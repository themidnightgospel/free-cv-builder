import type {
  AchievementEntry,
  CvData,
  EducationEntry,
  ExperienceEntry,
  Language,
  LanguageLevel,
  ProjectEntry,
  PublicationEntry,
  Skill,
  SkillLevel,
  TalkEntry,
  VolunteerExperienceEntry,
} from '../types';
import {
  createInitialCv,
  DEFAULT_ADVANCED_SETTINGS,
  DEFAULT_FONT_SETTINGS,
} from '../state/cvModel';
import { generateId } from '../utils/uuid';
import { loadPdfJs } from './pdfExtraction';

const SECTION_HEADERS: Record<string, string> = {
  'PROFESSIONAL SUMMARY': 'summary',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  PROJECTS: 'projects',
  'ACHIEVEMENTS / AWARDS': 'achievements',
  ACHIEVEMENTS: 'achievements',
  AWARDS: 'achievements',
  PUBLICATIONS: 'publications',
  'TALKS / CONFERENCES / WORKSHOPS': 'talks',
  TALKS: 'talks',
  'VOLUNTEER EXPERIENCE': 'volunteer',
  VOLUNTEER: 'volunteer',
  'OPEN SOURCE CONTRIBUTIONS': 'opensource',
  'OPEN SOURCE': 'opensource',
  SKILLS: 'skills',
  LANGUAGES: 'languages',
};

const CONTACT_KEYS: Record<string, keyof CvData['personalInfo']> = {
  Email: 'email',
  Phone: 'phone',
  Location: 'location',
  Portfolio: 'website',
  Website: 'website',
  LinkedIn: 'linkedin',
};

const SKILL_LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGE_LEVELS: LanguageLevel[] = [
  'Native',
  'Fluent',
  'Professional',
  'Intermediate',
  'Basic',
];

const DATE_RANGE_RE =
  /^[A-Za-z]{3,12}\s+\d{4}\s*[–\-]\s*(?:Present|[A-Za-z]{3,12}\s+\d{4})$/;
const YEAR_RANGE_RE = /^\d{4}\s*[–\-]\s*(?:Present|\d{4})$/;
const URL_RE = /^(https?:\/\/|www\.)/i;

const isSectionHeader = (line: string): string | null => {
  const upper = line.trim().toUpperCase();
  return SECTION_HEADERS[upper] ?? null;
};

const isDateRange = (line: string): boolean =>
  DATE_RANGE_RE.test(line.trim()) || YEAR_RANGE_RE.test(line.trim());

const splitDateRange = (line: string): { start: string; end: string; isCurrent: boolean } => {
  const trimmed = line.trim();
  const parts = trimmed.split(/\s*[–\-]\s*/);
  const start = (parts[0] ?? '').trim();
  const rawEnd = (parts[1] ?? '').trim();
  const isCurrent = /^present$/i.test(rawEnd);
  return { start, end: isCurrent ? '' : rawEnd, isCurrent };
};

const splitBullet = (line: string): { left: string; right: string } => {
  const idx = line.indexOf('•');
  if (idx === -1) return { left: line.trim(), right: '' };
  return {
    left: line.slice(0, idx).trim(),
    right: line.slice(idx + 1).trim(),
  };
};

const joinHyphenLine = (lines: string[]): string[] => {
  // pdf.js may break "https://linkedin.com/i" / "n/handle" — re-join when a line ends mid-URL
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i];
    const next = lines[i + 1];
    if (
      current &&
      next &&
      /(https?:\/\/\S+|www\.\S+)$/.test(current) &&
      /^[a-z0-9._\-/?#%&=+]+/i.test(next) &&
      !isSectionHeader(next)
    ) {
      merged.push(`${current}${next.trim()}`);
      i += 1;
      continue;
    }
    merged.push(current);
  }
  return merged;
};

export const splitIntoLines = (raw: string): string[] =>
  raw
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

interface ParsedSections {
  header: string[];
  sections: { name: string; lines: string[] }[];
}

const splitSections = (lines: string[]): ParsedSections => {
  const header: string[] = [];
  const sections: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;
  for (const line of lines) {
    const sectionKey = isSectionHeader(line);
    if (sectionKey) {
      current = { name: sectionKey, lines: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      header.push(line);
    } else {
      current.lines.push(line);
    }
  }
  return { header, sections };
};

const parseHeader = (
  header: string[],
  personal: CvData['personalInfo'],
): CvData['personalInfo'] => {
  const next = { ...personal };
  if (header.length === 0) return next;
  let cursor = 0;
  if (header[cursor] && !header[cursor].includes(':')) {
    next.fullName = header[cursor];
    cursor += 1;
  }
  if (header[cursor] && !header[cursor].includes(':')) {
    next.jobTitle = header[cursor];
    cursor += 1;
  }
  const remaining = header.slice(cursor).join(' ');
  const labels = Object.keys(CONTACT_KEYS);
  const labelPattern = new RegExp(
    `(${labels.join('|')}):\\s*([^]*?)(?=\\s+(?:${labels.join('|')}):|$)`,
    'g',
  );
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = labelPattern.exec(remaining)) !== null) {
    const key = CONTACT_KEYS[m[1] as keyof typeof CONTACT_KEYS];
    const value = m[2].trim();
    if (key) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
};

const parseSummary = (lines: string[]): string => lines.join('\n').trim();

interface EntryBlock {
  preDate: string[];
  date: string | null;
  description: string[];
}

const groupEntriesByDate = (lines: string[]): EntryBlock[] => {
  const blocks: EntryBlock[] = [];
  let current: EntryBlock | null = null;
  let pre: string[] = [];
  for (const line of lines) {
    if (isDateRange(line)) {
      current = { preDate: pre, date: line, description: [] };
      blocks.push(current);
      pre = [];
      continue;
    }
    if (current) {
      // Heuristic: a new entry starts when we have a "title" line (no period, short) followed
      // by a bullet line. Easier: split when a line matches a date later — but we already split on date.
      // So just stash into description. New entry starts when a future date appears.
      current.description.push(line);
    } else {
      pre.push(line);
    }
  }
  // Detect entries that didn't have a date by recognizing 2-3 line headers before each date block:
  // The first block's preDate is its header (preceding lines). Subsequent blocks' headers come from
  // tail of previous block's description.
  // Reshuffle: a typical header is up to 3 lines preceding a date.
  for (let i = 1; i < blocks.length; i += 1) {
    const previous = blocks[i - 1];
    const next = blocks[i];
    // pop up to 3 trailing description lines that look like header (jobTitle, company • location)
    const headerCandidate: string[] = [];
    while (previous.description.length > 0 && headerCandidate.length < 3) {
      const candidate = previous.description[previous.description.length - 1];
      const looksLikeHeader =
        candidate.length < 120 &&
        !candidate.endsWith('.') &&
        !candidate.startsWith('-') &&
        !candidate.startsWith('•');
      if (!looksLikeHeader) break;
      headerCandidate.unshift(previous.description.pop() as string);
    }
    next.preDate = [...headerCandidate, ...next.preDate];
  }
  return blocks;
};

const blockToExperience = (block: EntryBlock): ExperienceEntry | null => {
  const headerLines = block.preDate;
  if (!headerLines.length && !block.date) return null;
  const jobTitle = headerLines[0] ?? '';
  const companyLine = headerLines[1] ?? '';
  const { left: company, right: location } = splitBullet(companyLine);
  const range = block.date ? splitDateRange(block.date) : { start: '', end: '', isCurrent: false };
  return {
    id: generateId(),
    jobTitle,
    company,
    location,
    startDate: range.start,
    endDate: range.end,
    isCurrent: range.isCurrent,
    description: block.description.join('\n').trim(),
  };
};

const blockToEducation = (block: EntryBlock): EducationEntry | null => {
  const headerLines = block.preDate;
  if (!headerLines.length && !block.date) return null;
  const degree = headerLines[0] ?? '';
  const institutionLine = headerLines[1] ?? '';
  const { left: institution, right: location } = splitBullet(institutionLine);
  const range = block.date ? splitDateRange(block.date) : { start: '', end: '', isCurrent: false };
  return {
    id: generateId(),
    degree,
    institution,
    location,
    startYear: range.start,
    endYear: range.end,
    isCurrent: range.isCurrent,
    description: block.description.join('\n').trim(),
  };
};

const blockToVolunteer = (
  block: EntryBlock,
): VolunteerExperienceEntry | null => {
  const headerLines = block.preDate;
  if (!headerLines.length && !block.date) return null;
  const role = headerLines[0] ?? '';
  const orgLine = headerLines[1] ?? '';
  const { left: organization, right: location } = splitBullet(orgLine);
  const range = block.date ? splitDateRange(block.date) : { start: '', end: '', isCurrent: false };
  return {
    id: generateId(),
    organization,
    role,
    location,
    startDate: range.start,
    endDate: range.end,
    isCurrent: range.isCurrent,
    responsibilities: block.description.join('\n').trim(),
  };
};

const parseExperience = (lines: string[]): ExperienceEntry[] =>
  groupEntriesByDate(lines)
    .map(blockToExperience)
    .filter((entry): entry is ExperienceEntry => Boolean(entry));

const parseEducation = (lines: string[]): EducationEntry[] =>
  groupEntriesByDate(lines)
    .map(blockToEducation)
    .filter((entry): entry is EducationEntry => Boolean(entry));

const parseVolunteer = (lines: string[]): VolunteerExperienceEntry[] =>
  groupEntriesByDate(lines)
    .map(blockToVolunteer)
    .filter((entry): entry is VolunteerExperienceEntry => Boolean(entry));

const isLikelyLink = (line: string): boolean => URL_RE.test(line.trim());

const parseProjectsLike = (
  lines: string[],
): ProjectEntry[] => {
  // Project entry structure (rendered): name, "role[ • techStack]", optional link, description, achievements
  // Split entries: when current entry has both name and (role|link|description) and the next
  // candidate line looks like a name (short, no bullet, no period), start a new entry.
  const entries: ProjectEntry[] = [];
  let current: ProjectEntry | null = null;
  const flush = () => {
    if (!current) return;
    if (
      current.name ||
      current.role ||
      current.description ||
      current.achievements ||
      current.link
    ) {
      entries.push(current);
    }
    current = null;
  };
  const newEntry = (): ProjectEntry => ({
    id: generateId(),
    name: '',
    role: '',
    techStack: '',
    description: '',
    achievements: '',
    link: '',
  });

  let stage: 'name' | 'role' | 'body' = 'name';
  for (const line of lines) {
    if (stage === 'name') {
      current = newEntry();
      current.name = line;
      stage = 'role';
      continue;
    }
    if (!current) {
      current = newEntry();
      stage = 'role';
    }
    if (stage === 'role') {
      if (isLikelyLink(line)) {
        current.link = line;
        stage = 'body';
        continue;
      }
      const { left, right } = splitBullet(line);
      current.role = left;
      current.techStack = right;
      stage = 'body';
      continue;
    }
    // body stage
    if (isLikelyLink(line) && !current.link) {
      current.link = line;
      continue;
    }
    // Heuristic: short non-bullet line after a body paragraph -> new entry header
    const looksLikeNewEntry =
      line.length < 80 &&
      !line.endsWith('.') &&
      !line.startsWith('-') &&
      !line.startsWith('•') &&
      current.description.length > 0;
    if (looksLikeNewEntry) {
      flush();
      current = newEntry();
      current.name = line;
      stage = 'role';
      continue;
    }
    if (current.description) {
      current.description += '\n' + line;
    } else {
      current.description = line;
    }
  }
  flush();
  return entries;
};

const parseAchievements = (lines: string[]): AchievementEntry[] => {
  const entries: AchievementEntry[] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const name = lines[cursor] ?? '';
    const organization = lines[cursor + 1] ?? '';
    const dateLine = lines[cursor + 2] ?? '';
    let date = '';
    let contextStart = cursor + 2;
    if (/^\d{4}$/.test(dateLine.trim()) || isDateRange(dateLine)) {
      date = dateLine.trim();
      contextStart = cursor + 3;
    }
    const contextLines: string[] = [];
    let i = contextStart;
    for (; i < lines.length; i += 1) {
      const next = lines[i];
      const looksLikeNewName =
        next.length < 80 &&
        !next.endsWith('.') &&
        contextLines.length > 0 &&
        !next.startsWith('-') &&
        !next.startsWith('•');
      if (looksLikeNewName) break;
      contextLines.push(next);
    }
    entries.push({
      id: generateId(),
      name,
      organization,
      date,
      context: contextLines.join('\n').trim(),
    });
    cursor = i;
    if (cursor === contextStart && contextLines.length === 0) cursor += 1;
  }
  return entries;
};

const parsePublications = (lines: string[]): PublicationEntry[] => {
  const entries: PublicationEntry[] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const title = lines[cursor] ?? '';
    const venueLine = lines[cursor + 1] ?? '';
    let venue = venueLine;
    let year = '';
    const dotIdx = venueLine.indexOf('•');
    if (dotIdx >= 0) {
      venue = venueLine.slice(0, dotIdx).trim();
      year = venueLine.slice(dotIdx + 1).trim();
    }
    let next = cursor + 2;
    let coAuthors = '';
    if (lines[next]?.startsWith('Co-authors:')) {
      coAuthors = lines[next].replace(/^Co-authors:\s*/i, '').trim();
      next += 1;
    }
    let link = '';
    if (next < lines.length && isLikelyLink(lines[next])) {
      link = lines[next];
      next += 1;
    }
    entries.push({
      id: generateId(),
      title,
      venue,
      year,
      coAuthors,
      link,
    });
    cursor = next;
  }
  return entries;
};

const parseTalks = (lines: string[]): TalkEntry[] => {
  const entries: TalkEntry[] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const title = lines[cursor] ?? '';
    const event = lines[cursor + 1] ?? '';
    const meta = lines[cursor + 2] ?? '';
    let role = '';
    let date = '';
    const dotIdx = meta.indexOf('•');
    if (dotIdx >= 0) {
      role = meta.slice(0, dotIdx).trim();
      date = meta.slice(dotIdx + 1).trim();
    } else {
      role = meta;
    }
    let next = cursor + 3;
    let locationOrLink = '';
    if (next < lines.length) {
      locationOrLink = lines[next];
      next += 1;
    }
    entries.push({
      id: generateId(),
      title,
      event,
      date,
      role,
      locationOrLink,
    });
    cursor = next;
  }
  return entries;
};

const parsePillEntries = (
  lines: string[],
): { name: string; level: string }[] => {
  // Skills and languages are rendered as pills "Name – Level" or "Name". pdf.js often emits
  // them on single line because they're inline blocks. Try splitting on "  " then on " – ".
  const text = lines.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  // Split on dash patterns. Each pill becomes "Name – Level".
  const tokens = text.split(/(?:\s{2,}|\s(?=[A-Z]))/);
  // Above is brittle. Better: split by " – " then handle words.
  const pieces = text.split(/\s+–\s+|\s+-\s+/);
  // pieces[0]=name1, pieces[1]=level1 name2, pieces[2]=level2 name3, ...
  const result: { name: string; level: string }[] = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const segment = pieces[i].trim();
    if (i === 0) {
      result.push({ name: segment, level: '' });
      continue;
    }
    const knownLevel = [...SKILL_LEVELS, ...LANGUAGE_LEVELS].find((lvl) =>
      segment.startsWith(lvl),
    );
    if (knownLevel) {
      const last = result[result.length - 1];
      if (last) last.level = knownLevel;
      const remainder = segment.slice(knownLevel.length).trim();
      if (remainder) result.push({ name: remainder, level: '' });
    } else {
      result.push({ name: segment, level: '' });
    }
  }
  return result.filter((entry) => entry.name);
  void tokens;
};

const parseSkills = (lines: string[]): Skill[] =>
  parsePillEntries(lines).map((entry) => ({
    id: generateId(),
    name: entry.name,
    level: SKILL_LEVELS.includes(entry.level as SkillLevel)
      ? (entry.level as SkillLevel)
      : undefined,
  }));

const parseLanguages = (lines: string[]): Language[] =>
  parsePillEntries(lines)
    .filter((entry) => entry.name && entry.level)
    .map((entry) => ({
      id: generateId(),
      name: entry.name,
      level: entry.level as LanguageLevel,
    }));

export const parseCvFromTextLines = (rawLines: string[]): CvData => {
  const lines = joinHyphenLine(rawLines);
  const { header, sections } = splitSections(lines);
  const base = createInitialCv();
  base.experience = [];
  base.education = [];
  base.projects = [];
  base.achievements = [];
  base.publications = [];
  base.talks = [];
  base.volunteer = [];
  base.openSource = [];
  base.skills = [];
  base.languages = [];
  base.customSections = [];
  base.fontSettings = { ...DEFAULT_FONT_SETTINGS };
  base.advancedSettings = { ...DEFAULT_ADVANCED_SETTINGS };

  base.personalInfo = parseHeader(header, base.personalInfo);

  const sectionOrder: CvData['sectionsOrder'] = ['personal'];

  for (const section of sections) {
    const { name, lines: sectionLines } = section;
    if (name === 'summary') {
      base.personalInfo.summary = parseSummary(sectionLines);
      continue;
    }
    if (name === 'experience') {
      base.experience = parseExperience(sectionLines);
      if (base.experience.length > 0) sectionOrder.push('experience');
      continue;
    }
    if (name === 'education') {
      base.education = parseEducation(sectionLines);
      if (base.education.length > 0) sectionOrder.push('education');
      continue;
    }
    if (name === 'projects') {
      base.projects = parseProjectsLike(sectionLines);
      if (base.projects.length > 0) sectionOrder.push('projects');
      continue;
    }
    if (name === 'opensource') {
      base.openSource = parseProjectsLike(sectionLines);
      if (base.openSource.length > 0) sectionOrder.push('opensource');
      continue;
    }
    if (name === 'achievements') {
      base.achievements = parseAchievements(sectionLines);
      if (base.achievements.length > 0) sectionOrder.push('achievements');
      continue;
    }
    if (name === 'publications') {
      base.publications = parsePublications(sectionLines);
      if (base.publications.length > 0) sectionOrder.push('publications');
      continue;
    }
    if (name === 'talks') {
      base.talks = parseTalks(sectionLines);
      if (base.talks.length > 0) sectionOrder.push('talks');
      continue;
    }
    if (name === 'volunteer') {
      base.volunteer = parseVolunteer(sectionLines);
      if (base.volunteer.length > 0) sectionOrder.push('volunteer');
      continue;
    }
    if (name === 'skills') {
      base.skills = parseSkills(sectionLines);
      if (base.skills.length > 0) sectionOrder.push('skills');
      continue;
    }
    if (name === 'languages') {
      base.languages = parseLanguages(sectionLines);
      if (base.languages.length > 0) sectionOrder.push('languages');
      continue;
    }
  }

  base.sectionsOrder = sectionOrder;
  return base;
};

export const extractLinesFromPdfTextLayer = async (
  bytes: Uint8Array,
): Promise<string[]> => {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const lines: string[] = [];
  for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
    const page = await doc.getPage(pageIndex);
    const content = await page.getTextContent();
    let current = '';
    for (const item of content.items as any[]) {
      if (!('str' in item)) continue;
      current += item.str;
      if (item.hasEOL) {
        const trimmed = current.replace(/\s+/g, ' ').trim();
        if (trimmed) lines.push(trimmed);
        current = '';
      }
    }
    const tail = current.replace(/\s+/g, ' ').trim();
    if (tail) lines.push(tail);
  }
  return lines;
};

export const parseCvFromPdfTextLayer = async (
  bytes: Uint8Array,
): Promise<CvData | null> => {
  try {
    const lines = await extractLinesFromPdfTextLayer(bytes);
    if (!lines.length) return null;
    return parseCvFromTextLines(lines);
  } catch (error) {
    console.error('Failed to parse CV from PDF text layer', error);
    return null;
  }
};
