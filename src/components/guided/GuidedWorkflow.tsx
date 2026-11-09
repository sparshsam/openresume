import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from '../Footer';
import { Header } from '../Header';
import { ToastRegion, type ToastItem, type ToastTone } from '../ToastRegion';
import { GuidedProgress } from './GuidedProgress';
import { GuidedStepApply } from './GuidedStepApply';
import { GuidedStepAssistant } from './GuidedStepAssistant';
import { GuidedStepBuild } from './GuidedStepBuild';
import { GuidedStepPrepare, type CopyState } from './GuidedStepPrepare';
import { GuidedStepReview } from './GuidedStepReview';
import { parseResume } from '../../lib/parse';
import { parseApplicationKit } from '../../lib/parseApplicationKit';
import { resumeHasContent } from '../../lib/resumeValidation';
import { applyPageMeta } from '../../lib/publicPages';
import { findGuidedAssistant, type GuidedAssistantId } from '../../lib/guidedAssistants';
import { isSafeHttpsUrl, parseJobContext, type JobContext } from '../../lib/jobContext';
import { buildGuidedPrompt, type GuidedOutput } from '../../lib/guidedPrompt';
import type { CoverLetter } from '../../types/coverLetter';
import type { Resume } from '../../types/resume';

type GuidedStep = 1 | 2 | 3 | 4 | 5;

const STEP_CONTENT: Record<GuidedStep, { title: string; description: string }> = {
  1: {
    title: 'Choose an AI assistant',
    description:
      'Pick the assistant you already use. It will help tailor your existing résumé to this job.',
  },
  2: {
    title: 'Prepare tailored content',
    description:
      'Copy a job-specific prompt, upload your résumé, and give the assistant the complete job description.',
  },
  3: {
    title: 'Build your documents',
    description:
      'Paste the assistant’s structured output. OpenResume checks it before creating your documents.',
  },
  4: {
    title: 'Review and download',
    description:
      'Edit anything you like, choose a design, and download ready-to-send PDF and Word files.',
  },
  5: {
    title: 'Apply',
    description: 'Open the employer’s application page with your documents ready.',
  },
};

function hasAnyJobDetail(job: JobContext): boolean {
  return Boolean(
    job.id ||
    job.title ||
    job.employer ||
    job.location ||
    job.jobDescriptionUrl ||
    job.applicationUrl ||
    job.details ||
    job.qualifications,
  );
}

export function GuidedWorkflow() {
  const initial = useMemo(() => parseJobContext(window.location.search), []);
  const [job, setJob] = useState<JobContext>(initial.job);
  const [step, setStep] = useState<GuidedStep>(1);
  const [assistantId, setAssistantId] = useState<GuidedAssistantId | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [output, setOutput] = useState<GuidedOutput>('resume');
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [text, setText] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastId = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const assistant = assistantId ? findGuidedAssistant(assistantId) : null;
  const prompt = useMemo(() => buildGuidedPrompt(job, output), [job, output]);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    nextToastId.current += 1;
    setToasts((current) => [...current.slice(-2), { id: nextToastId.current, message, tone }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    applyPageMeta('prepare');
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    try {
      window.scrollTo(0, 0);
    } catch {
      /* jsdom and restricted environments may not implement scrolling. */
    }
  }, [step]);

  const goToStep = (next: GuidedStep) => {
    setStep(next);
  };

  const continueFromAssistant = () => {
    if (!assistantId) {
      notify('Choose an AI assistant before continuing.', 'error');
      return;
    }
    if (!confirmed) {
      notify('Confirm that you opened your AI assistant before continuing.', 'error');
      return;
    }
    if (
      (job.jobDescriptionUrl && !isSafeHttpsUrl(job.jobDescriptionUrl)) ||
      (job.applicationUrl && !isSafeHttpsUrl(job.applicationUrl))
    ) {
      notify('Use a complete https:// link for the job URLs, or leave them blank.', 'error');
      return;
    }
    setCopyState('idle');
    goToStep(2);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
      notify('AI tailoring prompt copied.');
    } catch {
      setCopyState('error');
      notify('Could not copy the prompt. Select it below and copy manually.', 'error');
    }
  };

  const updateJob = (patch: Partial<JobContext>) => {
    setJob((current) => ({ ...current, ...patch }));
  };

  const buildDocuments = () => {
    if (!text.trim()) {
      setBuildError('Paste the complete AI-generated content before building.');
      return;
    }

    if (output === 'applicationKit') {
      const parsed = parseApplicationKit(text);
      if (!parsed.ok) {
        setBuildError(parsed.errors.join(' '));
        return;
      }
      if (!resumeHasContent(parsed.resume)) {
        setBuildError(
          'The résumé needs at least one section with content, such as SUMMARY or EXPERIENCE. Ask the assistant to include the complete résumé.',
        );
        return;
      }
      setResume((current) => ({
        ...parsed.resume,
        template: current?.template ?? parsed.resume.template,
      }));
      setCoverLetter((current) => ({
        ...parsed.coverLetter,
        template: current?.template ?? parsed.coverLetter.template,
      }));
      setWarnings(parsed.warnings);
    } else {
      const parsed = parseResume(text);
      if (parsed.documentCount === 0) {
        setBuildError('Start with a single "# Your Name" line, then include your sections.');
        return;
      }
      if (parsed.documentCount > 1) {
        setBuildError(
          `This text contains ${parsed.documentCount} résumé headings. Ask the assistant for one résumé only.`,
        );
        return;
      }
      if (!parsed.resume.header.name.trim()) {
        setBuildError('Add the applicant name after "# " in the first line.');
        return;
      }
      if (!resumeHasContent(parsed.resume)) {
        setBuildError(
          'The résumé needs at least one section with content, such as SUMMARY or EXPERIENCE. Ask the assistant to include the complete résumé.',
        );
        return;
      }
      setResume((current) => ({
        ...parsed.resume,
        template: current?.template ?? parsed.resume.template,
      }));
      setCoverLetter(null);
      setWarnings(parsed.warnings);
    }

    setBuildError(null);
    goToStep(4);
  };

  const startOver = () => {
    window.history.replaceState({}, '', '/prepare');
    setJob({ version: 1 });
    setStep(1);
    setAssistantId(null);
    setConfirmed(false);
    setOutput('resume');
    setCopyState('idle');
    setText('');
    setBuildError(null);
    setResume(null);
    setCoverLetter(null);
    setWarnings([]);
    setToasts([]);
  };

  const content = STEP_CONTENT[step];
  const hasJobContext = hasAnyJobDetail(job);

  return (
    <div className={`app guided-page${step === 4 ? ' guided-page--workspace' : ''}`}>
      <a className="skip-link" href="#guided-main">
        Skip to guided application
      </a>
      <Header
        view="prepare"
        kind={null}
        kitMode={false}
        formattingOpen={false}
        onHome={() => window.location.assign('/')}
        onNew={() => {}}
        onToggleFormatting={() => {}}
        onExportPdf={() => {}}
        onExportDocx={() => {}}
      />
      <GuidedProgress step={step} />

      <main
        className={`guided-main${step === 4 ? ' guided-main--workspace' : ''}`}
        id="guided-main"
      >
        <div className={step === 4 ? 'guided-review-heading' : 'guided-step-header'}>
          <p className="guided-eyebrow">Guided application</p>
          <h1 className="guided-step-title" ref={headingRef} tabIndex={-1}>
            {content.title}
          </h1>
          <p className="guided-muted guided-step-description">{content.description}</p>
        </div>

        {step === 1 ? (
          <GuidedStepAssistant
            job={job}
            hasJobContext={hasJobContext}
            jobWarnings={initial.warnings}
            assistant={assistantId}
            confirmed={confirmed}
            onAssistant={setAssistantId}
            onConfirmed={setConfirmed}
            onJobChange={updateJob}
            onContinue={continueFromAssistant}
          />
        ) : null}

        {step === 2 && assistant ? (
          <GuidedStepPrepare
            job={job}
            assistant={assistant}
            output={output}
            prompt={prompt}
            copyState={copyState}
            onOutput={(value) => {
              setOutput(value);
              setCopyState('idle');
            }}
            onCopy={() => void copyPrompt()}
            onBack={() => goToStep(1)}
            onContinue={() => goToStep(3)}
          />
        ) : null}

        {step === 3 && assistant ? (
          <GuidedStepBuild
            output={output}
            assistant={assistant}
            text={text}
            error={buildError}
            onChange={(value) => {
              setText(value);
              if (buildError) setBuildError(null);
            }}
            onBuild={buildDocuments}
            onBack={() => goToStep(2)}
          />
        ) : null}

        {step === 4 && resume ? (
          <GuidedStepReview
            resume={resume}
            coverLetter={coverLetter}
            job={job}
            warnings={warnings}
            onResume={(updater) =>
              setResume((current) =>
                current ? (typeof updater === 'function' ? updater(current) : updater) : current,
              )
            }
            onCoverLetter={(updater) =>
              setCoverLetter((current) =>
                current ? (typeof updater === 'function' ? updater(current) : updater) : current,
              )
            }
            onBack={() => goToStep(3)}
            onContinue={() => goToStep(5)}
            notify={notify}
          />
        ) : null}

        {step === 5 && resume ? (
          <GuidedStepApply
            job={job}
            resume={resume}
            coverLetter={coverLetter}
            onBack={() => goToStep(4)}
            onStartOver={startOver}
          />
        ) : null}
      </main>

      <Footer plainLinks />
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
