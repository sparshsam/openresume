import type { Contact } from '../types/resume';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s().\-/]{6,}(?:\s*(?:ext\.?|x)\s*\d+)?$/i;
const URL_RE = /^(https?:\/\/|www\.)/i;
const BARE_URL_RE = /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i;
const LEADING_PROTOCOL_RE = /^https?:\/\//i;

/**
 * A bare domain is only a link when its final label is a real top-level
 * domain. Without this check, values such as "Toronto.ON" would be treated
 * as a website and removed from the contact line.
 */
const KNOWN_TLDS = new Set([
  'agency',
  'ai',
  'app',
  'art',
  'au',
  'be',
  'biz',
  'blog',
  'ca',
  'cc',
  'ch',
  'cloud',
  'cn',
  'co',
  'com',
  'cz',
  'de',
  'design',
  'dev',
  'digital',
  'dk',
  'email',
  'edu',
  'es',
  'fi',
  'fm',
  'fr',
  'gg',
  'gov',
  'hk',
  'ie',
  'in',
  'info',
  'io',
  'it',
  'jp',
  'kr',
  'life',
  'link',
  'live',
  'ly',
  'me',
  'media',
  'mil',
  'net',
  'news',
  'nl',
  'no',
  'nz',
  'online',
  'org',
  'page',
  'pl',
  'portfolio',
  'pt',
  'run',
  'se',
  'sg',
  'sh',
  'shop',
  'site',
  'so',
  'space',
  'store',
  'studio',
  'tech',
  'travel',
  'tv',
  'uk',
  'us',
  'website',
  'work',
  'world',
  'xyz',
  'zone',
]);

/**
 * Words that signal a role, employer description, or professional headline
 * rather than a place. The list is intentionally conservative: a false
 * positive only leaves the location empty, while a false negative puts a
 * title in the Location field.
 */
const ROLE_WORDS = new Set([
  'account',
  'accountant',
  'administrator',
  'advisor',
  'advocate',
  'agent',
  'analyst',
  'analytics',
  'apprentice',
  'architect',
  'artist',
  'assistant',
  'associate',
  'attorney',
  'auditor',
  'banker',
  'bartender',
  'brand',
  'broker',
  'builder',
  'business',
  'candidate',
  'cashier',
  'chef',
  'chief',
  'clerk',
  'cloud',
  'communications',
  'consultant',
  'content',
  'contractor',
  'coordinator',
  'counsel',
  'creative',
  'customer',
  'data',
  'dentist',
  'designer',
  'developer',
  'development',
  'digital',
  'director',
  'driver',
  'economist',
  'editor',
  'electrician',
  'engineer',
  'engineering',
  'evangelist',
  'executive',
  'finance',
  'financial',
  'founder',
  'freelancer',
  'generalist',
  'graduate',
  'growth',
  'hardware',
  'head',
  'human',
  'illustrator',
  'intern',
  'interpreter',
  'junior',
  'lawyer',
  'lead',
  'leader',
  'librarian',
  'machine',
  'management',
  'manager',
  'marketer',
  'marketing',
  'mechanic',
  'musician',
  'network',
  'nurse',
  'officer',
  'operations',
  'owner',
  'paralegal',
  'partner',
  'pharmacist',
  'photographer',
  'physician',
  'planner',
  'plumber',
  'practitioner',
  'president',
  'principal',
  'producer',
  'product',
  'professor',
  'program',
  'project',
  'quality',
  'receptionist',
  'recruiter',
  'representative',
  'research',
  'researcher',
  'resources',
  'sales',
  'scientist',
  'secretary',
  'security',
  'senior',
  'server',
  'software',
  'specialist',
  'staff',
  'strategist',
  'strategy',
  'student',
  'success',
  'superintendent',
  'supervisor',
  'surgeon',
  'support',
  'systems',
  'teacher',
  'technical',
  'technician',
  'technologist',
  'therapist',
  'trader',
  'trainee',
  'trainer',
  'translator',
  'vice',
  'volunteer',
  'vp',
  'welder',
  'writer',
]);

const EXTRA_ROLE_WORDS = new Set([
  'administrative',
  'agile',
  'animator',
  'archivist',
  'assembler',
  'assurance',
  'baker',
  'barber',
  'barista',
  'bookkeeper',
  'butcher',
  'buyer',
  'cad',
  'chain',
  'civil',
  'cleaner',
  'company',
  'construction',
  'consulting',
  'cook',
  'copywriter',
  'corp',
  'corporation',
  'counselor',
  'courier',
  'curator',
  'custodian',
  'dancer',
  'dispatcher',
  'drafter',
  'electrical',
  'entrepreneur',
  'estate',
  'estimator',
  'facilities',
  'fashion',
  'firefighter',
  'florist',
  'foreman',
  'forklift',
  'graphic',
  'group',
  'guard',
  'hairdresser',
  'holdings',
  'host',
  'hostess',
  'housekeeper',
  'hvac',
  'hygienist',
  'inc',
  'industrial',
  'inspector',
  'insurance',
  'interior',
  'janitor',
  'judge',
  'laboratory',
  'labs',
  'landscaper',
  'lecturer',
  'llc',
  'logistics',
  'machinist',
  'makeup',
  'mason',
  'master',
  'mechanical',
  'merchandiser',
  'notary',
  'office',
  'operator',
  'paramedic',
  'partners',
  'pharmacy',
  'police',
  'procurement',
  'proprietor',
  'psychiatrist',
  'psychologist',
  'real',
  'reliability',
  'research',
  'retail',
  'roofer',
  'scheduler',
  'scrum',
  'shift',
  'social',
  'solutions',
  'sommelier',
  'sourcer',
  'statistician',
  'store',
  'structural',
  'studio',
  'supply',
  'surveyor',
  'tailor',
  'technologies',
  'teller',
  'tutor',
  'ventures',
  'veterinarian',
  'videographer',
  'warehouse',
  'worker',
]);

const ROLE_SUFFIX_RE =
  /\b(minded|focused|driven|oriented|specialist|generalist|professional|enthusiast)\b/i;

const COUNTRY_ALIASES = new Set(['usa', 'us', 'uk', 'uae', 'u.s.', 'u.s.a.', 'gb', 'gbr']);

const REGION_CODES = new Set(
  (
    'AB BC MB NB NL NS NT NU ON PE QC SK YT ' +
    'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'
  ).split(' '),
);

const REGION_NAMES = new Set([
  'alabama',
  'alaska',
  'alberta',
  'arizona',
  'arkansas',
  'british columbia',
  'california',
  'colorado',
  'connecticut',
  'delaware',
  'district of columbia',
  'florida',
  'georgia',
  'hawaii',
  'idaho',
  'illinois',
  'indiana',
  'iowa',
  'kansas',
  'kentucky',
  'louisiana',
  'maine',
  'manitoba',
  'maryland',
  'massachusetts',
  'michigan',
  'minnesota',
  'mississippi',
  'missouri',
  'montana',
  'nebraska',
  'nevada',
  'new brunswick',
  'new hampshire',
  'new jersey',
  'new mexico',
  'new york state',
  'newfoundland',
  'newfoundland and labrador',
  'north carolina',
  'north dakota',
  'northwest territories',
  'england',
  'northern ireland',
  'nova scotia',
  'nunavut',
  'ohio',
  'oklahoma',
  'ontario',
  'oregon',
  'pennsylvania',
  'prince edward island',
  'quebec',
  'rhode island',
  'saskatchewan',
  'south carolina',
  'scotland',
  'south dakota',
  'tennessee',
  'texas',
  'utah',
  'vermont',
  'virginia',
  'wales',
  'washington',
  'west virginia',
  'wisconsin',
  'wyoming',
  'yukon',
]);

const COUNTRIES = new Set([
  'afghanistan',
  'albania',
  'algeria',
  'andorra',
  'angola',
  'argentina',
  'armenia',
  'australia',
  'austria',
  'azerbaijan',
  'bahamas',
  'bahrain',
  'bangladesh',
  'barbados',
  'belarus',
  'belgium',
  'belize',
  'benin',
  'bhutan',
  'bolivia',
  'bosnia',
  'botswana',
  'brazil',
  'brunei',
  'bulgaria',
  'burundi',
  'cambodia',
  'cameroon',
  'canada',
  'chile',
  'china',
  'colombia',
  'costa rica',
  'croatia',
  'cuba',
  'cyprus',
  'czech republic',
  'czechia',
  'denmark',
  'dominican republic',
  'ecuador',
  'egypt',
  'el salvador',
  'estonia',
  'ethiopia',
  'fiji',
  'finland',
  'france',
  'gabon',
  'germany',
  'ghana',
  'greece',
  'guatemala',
  'haiti',
  'honduras',
  'hungary',
  'iceland',
  'india',
  'indonesia',
  'iran',
  'iraq',
  'ireland',
  'israel',
  'italy',
  'ivory coast',
  'jamaica',
  'japan',
  'kazakhstan',
  'kenya',
  'kuwait',
  'latvia',
  'lebanon',
  'libya',
  'lithuania',
  'luxembourg',
  'malaysia',
  'maldives',
  'malta',
  'mauritius',
  'mexico',
  'moldova',
  'monaco',
  'mongolia',
  'montenegro',
  'morocco',
  'mozambique',
  'myanmar',
  'namibia',
  'nepal',
  'netherlands',
  'new zealand',
  'nicaragua',
  'nigeria',
  'north macedonia',
  'norway',
  'oman',
  'pakistan',
  'panama',
  'paraguay',
  'peru',
  'philippines',
  'poland',
  'portugal',
  'qatar',
  'romania',
  'russia',
  'rwanda',
  'saudi arabia',
  'senegal',
  'serbia',
  'singapore',
  'slovakia',
  'slovenia',
  'south africa',
  'south korea',
  'spain',
  'sri lanka',
  'sweden',
  'switzerland',
  'taiwan',
  'tanzania',
  'thailand',
  'tunisia',
  'turkey',
  'uganda',
  'ukraine',
  'united arab emirates',
  'united kingdom',
  'united states',
  'uruguay',
  'uzbekistan',
  'venezuela',
  'vietnam',
  'zambia',
  'zimbabwe',
]);

/**
 * Multiword places that are routinely written without a comma. A single
 * unknown token is never treated as a location, because a bare word is more
 * likely to be part of a headline than a verified place.
 */
const MULTIWORD_PLACES = new Set([
  'abu dhabi',
  'addis ababa',
  'bay area',
  'buenos aires',
  'cape town',
  'colorado springs',
  'dar es salaam',
  'fort worth',
  'greater toronto area',
  'guatemala city',
  'ho chi minh city',
  'hong kong',
  'kansas city',
  'kuala lumpur',
  'las vegas',
  'los angeles',
  'mexico city',
  'new delhi',
  'new orleans',
  'new york',
  'new york city',
  'oklahoma city',
  'panama city',
  'quebec city',
  'rio de janeiro',
  'salt lake city',
  'san antonio',
  'san diego',
  'san francisco',
  'san jose',
  'santa fe',
  'sao paulo',
  'são paulo',
  'silicon valley',
  'st. louis',
  'tel aviv',
  'washington dc',
]);

/** Common single-token cities and unambiguous countries. */
const SINGLE_TOKEN_PLACES = new Set([
  'amsterdam',
  'antwerp',
  'athens',
  'atlanta',
  'auckland',
  'austin',
  'bangkok',
  'barcelona',
  'basel',
  'beijing',
  'belfast',
  'berlin',
  'bern',
  'birmingham',
  'bogota',
  'boston',
  'brisbane',
  'bristol',
  'brussels',
  'budapest',
  'buffalo',
  'burnaby',
  'calgary',
  'cambridge',
  'canberra',
  'cardiff',
  'chicago',
  'christchurch',
  'cincinnati',
  'cleveland',
  'cologne',
  'copenhagen',
  'cork',
  'dallas',
  'delhi',
  'denver',
  'detroit',
  'doha',
  'dresden',
  'dubai',
  'dublin',
  'düsseldorf',
  'edinburgh',
  'edmonton',
  'frankfurt',
  'geneva',
  'glasgow',
  'guadalajara',
  'halifax',
  'hamburg',
  'helsinki',
  'honolulu',
  'houston',
  'indianapolis',
  'istanbul',
  'jakarta',
  'jerusalem',
  'johannesburg',
  'kolkata',
  'kraków',
  'kyiv',
  'lagos',
  'lausanne',
  'leeds',
  'leipzig',
  'lima',
  'lisbon',
  'liverpool',
  'london',
  'lyon',
  'madrid',
  'manchester',
  'manila',
  'marseille',
  'melbourne',
  'memphis',
  'miami',
  'milan',
  'minneapolis',
  'mississauga',
  'montreal',
  'moscow',
  'mumbai',
  'munich',
  'nairobi',
  'nantes',
  'naples',
  'nashville',
  'newark',
  'nice',
  'orlando',
  'osaka',
  'oslo',
  'ottawa',
  'paris',
  'perth',
  'philadelphia',
  'phoenix',
  'portland',
  'porto',
  'prague',
  'pune',
  'quebec',
  'raleigh',
  'reykjavik',
  'richmond',
  'rome',
  'rotterdam',
  'sacramento',
  'salt lake',
  'san diego',
  'san francisco',
  'santiago',
  'seattle',
  'seoul',
  'seville',
  'shanghai',
  'sheffield',
  'shenzhen',
  'singapore',
  'stockholm',
  'stuttgart',
  'sydney',
  'tokyo',
  'toronto',
  'toulouse',
  'turin',
  'utrecht',
  'vancouver',
  'victoria',
  'vienna',
  'warsaw',
  'washington',
  'wellington',
  'winnipeg',
  'zurich',
  'zürich',
]);

function toUrl(value: string): string {
  return URL_RE.test(value) ? value : `https://${value}`;
}

function isLink(part: string): boolean {
  if (URL_RE.test(part)) return true;
  const match = BARE_URL_RE.exec(part);
  if (!match) return false;
  const host = part.split('/')[0];
  const tld = host.split('.').pop()?.toLowerCase();
  return Boolean(tld && KNOWN_TLDS.has(tld));
}

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9à-ÿ+]+/i)
    .filter(Boolean);
}

/** True when the value reads as a role, employer, or professional headline. */
export function looksLikeJobTitle(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  if (!normalized || !/[a-zà-ÿ]/i.test(normalized)) return false;
  if (ROLE_SUFFIX_RE.test(normalized)) return true;
  return words(normalized).some((word) => ROLE_WORDS.has(word) || EXTRA_ROLE_WORDS.has(word));
}

function normalizePlace(value: string): string {
  return value.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

/** True for a confirmed work arrangement such as Remote, Hybrid, or On-site. */
export function isConfirmedWorkArrangement(value: string): boolean {
  const trimmed = value.trim();
  if (
    /^(remote|hybrid|on-?site|online|distributed|telecommute|work from home|wfh)$/i.test(trimmed)
  ) {
    return true;
  }
  if (/^(remote|hybrid|on-?site|online)\s*\([^)]*\)$/i.test(trimmed)) return true;
  const dash = /^(remote|hybrid|on-?site|online)\s*[-–—]\s*(.+)$/i.exec(trimmed);
  if (!dash) return false;
  const place = dash[2].trim();
  return isRegion(place) || looksLikeLocation(place);
}

function isRegion(value: string): boolean {
  const compact = value.trim();
  if (REGION_CODES.has(compact.toUpperCase())) return true;
  const normalized = normalizePlace(compact);
  return (
    REGION_NAMES.has(normalized) || COUNTRIES.has(normalized) || COUNTRY_ALIASES.has(normalized)
  );
}

function isPostalRegion(value: string): boolean {
  // "ON M5V 2T6" or "CA 94107"
  const match = /^([A-Z]{2})\s+\S/i.exec(value.trim());
  return Boolean(match && REGION_CODES.has(match[1].toUpperCase()));
}

function isGeographicLocation(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // "Toronto (Remote)" keeps the city and the confirmed arrangement.
  const hybrid = /^(.+?)\s*\((remote|hybrid|on-?site|online)\)$/i.exec(trimmed);
  if (hybrid) return looksLikeLocation(hybrid[1]);

  const segments = trimmed
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length > 1 && segments.every((segment) => looksLikeLocation(segment))) {
    return true;
  }

  // "Toronto ON", "New York NY", and "Toronto ON M5V 2T6".
  const noComma = /^(.+?)\s+([A-Z]{2})(?:\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d))?$/i.exec(trimmed);
  if (noComma && REGION_CODES.has(noComma[2].toUpperCase())) {
    const place = normalizePlace(noComma[1]);
    if (MULTIWORD_PLACES.has(place) || SINGLE_TOKEN_PLACES.has(place)) return true;
  }

  const commaParts = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (commaParts.length >= 2) {
    const region = commaParts[commaParts.length - 1];
    if (isRegion(region) || isPostalRegion(region)) return true;
    if (commaParts.length >= 3) {
      const penultimate = commaParts[commaParts.length - 2];
      if (isRegion(penultimate) || isPostalRegion(penultimate)) return true;
    }
    if (commaParts.length === 2) {
      const first = normalizePlace(commaParts[0]);
      if (MULTIWORD_PLACES.has(first) || SINGLE_TOKEN_PLACES.has(first) || COUNTRIES.has(first)) {
        return true;
      }
    }
    return false;
  }

  const normalized = normalizePlace(trimmed);
  return MULTIWORD_PLACES.has(normalized) || SINGLE_TOKEN_PLACES.has(normalized);
}

/** True when the value can stand as a geographic location or work arrangement. */
export function looksLikeLocation(value: string): boolean {
  return isConfirmedWorkArrangement(value) || isGeographicLocation(value);
}

function mergeLocations(values: string[]): string {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(' · ');
}

export interface ParsedContactLine {
  headline?: string;
  contact: Contact;
  warnings: string[];
}

/**
 * Reads the canonical contact line:
 *
 *   Professional Headline | email | phone | Location | Link | Link
 *
 * Every field after the headline is optional. Email, phone, and links are
 * recognised by pattern, so an omitted field never shifts the values that
 * follow it. Free text is only accepted as a location when it reads as a
 * place or a confirmed work arrangement and not as a job title or headline.
 */
export function parseContactLine(line: string): ParsedContactLine {
  const contact: Contact = { links: [] };
  const warnings: string[] = [];
  const freeText: { value: string; index: number }[] = [];
  let lastContactDetailIndex = -1;

  const parts = line
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  parts.forEach((part, index) => {
    if (isLink(part)) {
      contact.links.push({ label: part.replace(LEADING_PROTOCOL_RE, ''), url: toUrl(part) });
      lastContactDetailIndex = index;
      return;
    }
    if (EMAIL_RE.test(part)) {
      if (!contact.email) {
        contact.email = part;
      } else {
        warnings.push(`Ignored an additional email address: "${part}". One email is supported.`);
      }
      lastContactDetailIndex = index;
      return;
    }
    if (PHONE_RE.test(part)) {
      if (!contact.phone) {
        contact.phone = part;
      } else {
        warnings.push(`Ignored an additional phone number: "${part}". One phone is supported.`);
      }
      lastContactDetailIndex = index;
      return;
    }
    freeText.push({ value: part, index });
  });

  const locationParts = freeText.filter(
    (part) => looksLikeLocation(part.value) && !looksLikeJobTitle(part.value),
  );
  const location =
    locationParts.length > 0 ? mergeLocations(locationParts.map((part) => part.value)) : undefined;
  if (location) contact.location = location;

  const locationValues = new Set(locationParts.map((part) => part.value));
  const headlineParts = freeText.filter((part) => !locationValues.has(part.value));
  const headline =
    headlineParts.length > 0 ? headlineParts.map((part) => part.value).join(' · ') : undefined;

  const last = freeText[freeText.length - 1];
  if (
    last &&
    last.index > lastContactDetailIndex &&
    lastContactDetailIndex >= 0 &&
    looksLikeJobTitle(last.value) &&
    !locationValues.has(last.value)
  ) {
    warnings.push(
      'The final contact value looks like a job title or professional headline, so it was not used as a location.',
    );
  }

  return { headline, contact, warnings };
}
