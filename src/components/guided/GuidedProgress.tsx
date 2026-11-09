const STEPS = [
  { id: 1, label: 'Assistant' },
  { id: 2, label: 'Prepare' },
  { id: 3, label: 'Build' },
  { id: 4, label: 'Review' },
  { id: 5, label: 'Apply' },
];

interface GuidedProgressProps {
  step: number;
}

export function GuidedProgress({ step }: GuidedProgressProps) {
  return (
    <nav className="guided-progress" aria-label="Application progress">
      <ol>
        {STEPS.map((entry) => {
          const active = entry.id === step;
          const complete = entry.id < step;
          return (
            <li
              key={entry.id}
              aria-current={active ? 'step' : undefined}
              data-complete={complete ? 'true' : undefined}
            >
              <span className="guided-progress-index" aria-hidden="true">
                {complete ? '✓' : entry.id}
              </span>
              <span className="guided-progress-label">
                {entry.label}
                {complete ? <span className="visually-hidden"> (completed)</span> : null}
                {active ? <span className="visually-hidden"> (current step)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
