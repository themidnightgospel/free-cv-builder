import type {
  AchievementEntry,
  AdvancedSettings,
  CvData,
  CvSectionKey,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  FontSettings,
  Language,
  PersonalInfo,
  ProjectEntry,
  PublicationEntry,
  SectionId,
  Skill,
  TalkEntry,
  VolunteerExperienceEntry,
} from '../types';
import { generateId } from '../utils/uuid';

export const createEmptyPersonalInfo = (): PersonalInfo => ({
  fullName: '',
  jobTitle: '',
  summary: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  photoDataUrl: null,
});

export const stripCvPhoto = (cv: CvData): CvData => ({
  ...cv,
  personalInfo: { ...cv.personalInfo, photoDataUrl: null },
});

export const createEmptyExperience = (): ExperienceEntry => ({
  id: generateId(),
  jobTitle: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
});

export const createEmptyEducation = (): EducationEntry => ({
  id: generateId(),
  degree: '',
  institution: '',
  location: '',
  startYear: '',
  endYear: '',
  isCurrent: false,
  description: '',
});

export const createEmptyProject = (): ProjectEntry => ({
  id: generateId(),
  name: '',
  role: '',
  techStack: '',
  description: '',
  achievements: '',
  link: '',
});

export const createEmptyAchievement = (): AchievementEntry => ({
  id: generateId(),
  name: '',
  organization: '',
  date: '',
  context: '',
});

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fullName: 28,
  jobTitle: 12,
  contactDetail: 12,
  sectionTitle: 12,
  sectionItemTitle: 14,
  sectionDetail: 12,
};

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  sectionGapPx: 16,
  lineHeight: 1.5,
  accentColor: '#2563eb',
  showSectionDividers: false,
  pagePaddingXPx: 32,
  pagePaddingYPx: 24,
  paragraphSpacingPx: 4,
};

export const createInitialCv = (): CvData => ({
  personalInfo: createEmptyPersonalInfo(),
  experience: [createEmptyExperience()],
  education: [createEmptyEducation()],
  projects: [createEmptyProject()],
  achievements: [createEmptyAchievement()],
  publications: [],
  talks: [],
  volunteer: [],
  openSource: [],
  skills: [],
  languages: [],
  customSections: [],
  sectionsOrder: [
    'personal',
    'projects',
    'experience',
    'skills',
    'languages',
    'education',
  ],
  fontSettings: { ...DEFAULT_FONT_SETTINGS },
  advancedSettings: { ...DEFAULT_ADVANCED_SETTINGS },
});

export const sectionLabel: Record<CvSectionKey, string> = {
  personal: 'Personal Info',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  achievements: 'Achievements / Awards',
  publications: 'Publications',
  talks: 'Talks / Conferences',
  volunteer: 'Volunteer Experience',
  opensource: 'Open Source',
  skills: 'Skills',
  languages: 'Languages',
};

export const hasAnyText = (...values: string[]): boolean =>
  values.some((val) => val.trim().length > 0);

export const normalizeString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const normalizeMultilineString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const ensureId = (value: unknown): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : generateId();

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const normalizeSectionsOrder = (
  value: unknown,
  fallback: SectionId[],
): SectionId[] => {
  if (!Array.isArray(value)) return fallback;
  const sanitized = value.filter(
    (section): section is SectionId => typeof section === 'string',
  );
  return sanitized.length > 0 ? sanitized : fallback;
};

const normalizeFontValue = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, value);
};

const normalizePositiveNumber = (value: unknown, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, value);
};

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const normalizeHexColor = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed : fallback;
};

export const normalizeAdvancedSettings = (value: unknown): AdvancedSettings => {
  const record = isRecord(value) ? (value as Partial<AdvancedSettings>) : {};
  return {
    sectionGapPx: normalizePositiveNumber(
      record.sectionGapPx,
      DEFAULT_ADVANCED_SETTINGS.sectionGapPx,
    ),
    lineHeight:
      typeof record.lineHeight === 'number' && record.lineHeight > 0
        ? record.lineHeight
        : DEFAULT_ADVANCED_SETTINGS.lineHeight,
    accentColor: normalizeHexColor(
      record.accentColor,
      DEFAULT_ADVANCED_SETTINGS.accentColor,
    ),
    showSectionDividers: normalizeBoolean(
      record.showSectionDividers,
      DEFAULT_ADVANCED_SETTINGS.showSectionDividers,
    ),
    pagePaddingXPx: normalizePositiveNumber(
      record.pagePaddingXPx,
      DEFAULT_ADVANCED_SETTINGS.pagePaddingXPx,
    ),
    pagePaddingYPx: normalizePositiveNumber(
      record.pagePaddingYPx,
      DEFAULT_ADVANCED_SETTINGS.pagePaddingYPx,
    ),
    paragraphSpacingPx: normalizePositiveNumber(
      record.paragraphSpacingPx,
      DEFAULT_ADVANCED_SETTINGS.paragraphSpacingPx,
    ),
  };
};

export const normalizeFontSettings = (value: unknown): FontSettings => {
  const record = isRecord(value)
    ? (value as Partial<FontSettings> & { contactDetails?: unknown })
    : {};
  return {
    fullName: normalizeFontValue(record.fullName, DEFAULT_FONT_SETTINGS.fullName),
    jobTitle: normalizeFontValue(record.jobTitle, DEFAULT_FONT_SETTINGS.jobTitle),
    contactDetail: normalizeFontValue(
      record.contactDetail ?? record.contactDetails,
      DEFAULT_FONT_SETTINGS.contactDetail,
    ),
    sectionTitle: normalizeFontValue(
      record.sectionTitle,
      DEFAULT_FONT_SETTINGS.sectionTitle,
    ),
    sectionItemTitle: normalizeFontValue(
      record.sectionItemTitle,
      DEFAULT_FONT_SETTINGS.sectionItemTitle,
    ),
    sectionDetail: normalizeFontValue(
      record.sectionDetail,
      DEFAULT_FONT_SETTINGS.sectionDetail,
    ),
  };
};

export const normalizePersonalInfo = (value: unknown): PersonalInfo => {
  const base = createEmptyPersonalInfo();
  if (!isRecord(value)) return base;
  const record = value as Record<string, unknown>;
  return {
    ...base,
    fullName: normalizeString(record.fullName ?? base.fullName),
    jobTitle: normalizeString(record.jobTitle ?? base.jobTitle),
    summary: normalizeMultilineString(record.summary ?? base.summary),
    email: normalizeString(record.email ?? base.email),
    phone: normalizeString(record.phone ?? base.phone),
    location: normalizeString(record.location ?? base.location),
    website: normalizeString(record.website ?? base.website),
    linkedin: normalizeString(record.linkedin ?? base.linkedin),
    photoDataUrl:
      typeof record.photoDataUrl === 'string' && record.photoDataUrl.trim()
        ? record.photoDataUrl.trim()
        : null,
  };
};

export const normalizeExperienceEntry = (
  value: unknown,
): ExperienceEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const jobTitle = normalizeString(record.jobTitle);
  const company = normalizeString(record.company);
  const location = normalizeString(record.location);
  const startDate = normalizeString(record.startDate);
  const endDate = normalizeString(record.endDate);
  const description = normalizeMultilineString(record.description);
  const isCurrent = record.isCurrent === true;
  if (
    !hasAnyText(jobTitle, company, location, startDate, endDate, description) &&
    !isCurrent
  ) {
    return null;
  }
  return {
    id: ensureId(record.id),
    jobTitle,
    company,
    location,
    startDate,
    endDate,
    isCurrent,
    description,
  };
};

export const normalizeEducationEntry = (
  value: unknown,
): EducationEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const degree = normalizeString(record.degree);
  const institution = normalizeString(record.institution);
  const location = normalizeString(record.location);
  const startYear = normalizeString(record.startYear);
  const endYear = normalizeString(record.endYear);
  const description = normalizeMultilineString(record.description);
  const isCurrent = record.isCurrent === true;
  if (
    !hasAnyText(degree, institution, location, startYear, endYear, description) &&
    !isCurrent
  ) {
    return null;
  }
  return {
    id: ensureId(record.id),
    degree,
    institution,
    location,
    startYear,
    endYear,
    isCurrent,
    description,
  };
};

export const normalizeProjectEntry = (
  value: unknown,
): ProjectEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const name = normalizeString(record.name);
  const role = normalizeString(record.role);
  const techStack = normalizeString(record.techStack);
  const description = normalizeMultilineString(record.description);
  const achievements = normalizeMultilineString(record.achievements);
  const link = normalizeString(record.link);
  if (!hasAnyText(name, role, techStack, description, achievements, link)) {
    return null;
  }
  return {
    id: ensureId(record.id),
    name,
    role,
    techStack,
    description,
    achievements,
    link,
  };
};

export const normalizeAchievementEntry = (
  value: unknown,
): AchievementEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const name = normalizeString(record.name);
  const organization = normalizeString(record.organization);
  const date = normalizeString(record.date);
  const context = normalizeMultilineString(record.context);
  if (!hasAnyText(name, organization, date, context)) {
    return null;
  }
  return {
    id: ensureId(record.id),
    name,
    organization,
    date,
    context,
  };
};

export const normalizePublicationEntry = (
  value: unknown,
): PublicationEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const title = normalizeString(record.title);
  const venue = normalizeString(record.venue);
  const year = normalizeString(record.year);
  const coAuthors = normalizeString(record.coAuthors);
  const link = normalizeString(record.link);
  if (!hasAnyText(title, venue, year, coAuthors, link)) {
    return null;
  }
  return {
    id: ensureId(record.id),
    title,
    venue,
    year,
    coAuthors,
    link,
  };
};

export const normalizeTalkEntry = (value: unknown): TalkEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const title = normalizeString(record.title);
  const event = normalizeString(record.event);
  const date = normalizeString(record.date);
  const role = normalizeString(record.role);
  const locationOrLink = normalizeString(record.locationOrLink);
  if (!hasAnyText(title, event, date, role, locationOrLink)) {
    return null;
  }
  return {
    id: ensureId(record.id),
    title,
    event,
    date,
    role,
    locationOrLink,
  };
};

export const normalizeVolunteerEntry = (
  value: unknown,
): VolunteerExperienceEntry | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const organization = normalizeString(record.organization);
  const role = normalizeString(record.role);
  const location = normalizeString(record.location);
  const startDate = normalizeString(record.startDate);
  const endDate = normalizeString(record.endDate);
  const responsibilities = normalizeMultilineString(record.responsibilities);
  const isCurrent = record.isCurrent === true;
  if (
    !hasAnyText(
      organization,
      role,
      location,
      startDate,
      endDate,
      responsibilities,
    ) &&
    !isCurrent
  ) {
    return null;
  }
  return {
    id: ensureId(record.id),
    organization,
    role,
    location,
    startDate,
    endDate,
    responsibilities,
    isCurrent,
  };
};

export const normalizeSkill = (value: unknown): Skill | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const name = normalizeString(record.name);
  const level =
    typeof record.level === 'string' && record.level.trim().length > 0
      ? (record.level as Skill['level'])
      : undefined;
  if (!hasAnyText(name, level ?? '')) {
    return null;
  }
  return {
    id: ensureId(record.id),
    name,
    level,
  };
};

export const normalizeLanguage = (value: unknown): Language | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const name = normalizeString(record.name);
  const level =
    typeof record.level === 'string' && record.level.trim().length > 0
      ? (record.level as Language['level'])
      : undefined;
  if (!name || !level) {
    return null;
  }
  return {
    id: ensureId(record.id),
    name,
    level,
  };
};

export const normalizeCustomSection = (
  value: unknown,
): CustomSection | null => {
  if (!isRecord(value)) return null;
  const record = value as Record<string, unknown>;
  const title = normalizeString(record.title);
  const body = normalizeMultilineString(record.body);
  if (!hasAnyText(title, body)) {
    return null;
  }
  return {
    id: ensureId(record.id),
    title,
    body,
  };
};

const normalizeArray = <T>(
  value: unknown,
  normalizer: (item: unknown) => T | null,
): T[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizer).filter(Boolean) as T[];
};

export const normalizeCvData = (value: unknown): CvData | null => {
  if (!isRecord(value)) return null;
  const candidate = value as Record<string, unknown>;
  const baseSectionsOrder = createInitialCv().sectionsOrder;

  return {
    personalInfo: normalizePersonalInfo(candidate.personalInfo),
    experience: normalizeArray(candidate.experience, normalizeExperienceEntry),
    education: normalizeArray(candidate.education, normalizeEducationEntry),
    projects: normalizeArray(candidate.projects, normalizeProjectEntry),
    achievements: normalizeArray(
      candidate.achievements,
      normalizeAchievementEntry,
    ),
    publications: normalizeArray(
      candidate.publications,
      normalizePublicationEntry,
    ),
    talks: normalizeArray(candidate.talks, normalizeTalkEntry),
    volunteer: normalizeArray(candidate.volunteer, normalizeVolunteerEntry),
    openSource: normalizeArray(candidate.openSource, normalizeProjectEntry),
    skills: normalizeArray(candidate.skills, normalizeSkill),
    languages: normalizeArray(candidate.languages, normalizeLanguage),
    customSections: normalizeArray(
      candidate.customSections,
      normalizeCustomSection,
    ),
    sectionsOrder: normalizeSectionsOrder(
      candidate.sectionsOrder,
      baseSectionsOrder,
    ),
    fontSettings: normalizeFontSettings(candidate.fontSettings),
    advancedSettings: normalizeAdvancedSettings(candidate.advancedSettings),
  };
};

export const validateFullName = (fullName: string): string => {
  if (!fullName.trim()) return 'Full name is required.';
  return '';
};

export const validateEmailAddress = (email: string): string => {
  if (!email.trim()) return 'Email is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Email format is invalid.';
  return '';
};

export const validatePersonalInfo = (personalInfo: PersonalInfo) => {
  const errors: string[] = [];
  const nameError = validateFullName(personalInfo.fullName);
  if (nameError) errors.push(nameError);
  const emailError = validateEmailAddress(personalInfo.email);
  if (emailError) errors.push(emailError);
  return { isValid: errors.length === 0, errors };
};

export const hasMeaningfulPersonalInfo = (
  personalInfo: PersonalInfo,
): boolean =>
  hasAnyText(
    personalInfo.fullName,
    personalInfo.jobTitle,
    personalInfo.summary,
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.website,
    personalInfo.linkedin,
  );

export const hasMeaningfulExperience = (
  experience: ExperienceEntry[],
): boolean =>
  experience.some(
    (e) => (e.jobTitle ?? '').trim() && (e.company ?? '').trim(),
  );

export const hasMeaningfulEducation = (
  education: EducationEntry[],
): boolean =>
  education.some(
    (e) => (e.degree ?? '').trim() && (e.institution ?? '').trim(),
  );

export const hasMeaningfulProjects = (projects: ProjectEntry[]): boolean =>
  projects.some((p) => (p.name ?? '').trim() && (p.role ?? '').trim());

export const hasMeaningfulAchievements = (
  achievements: AchievementEntry[],
): boolean =>
  achievements.some(
    (a) => (a.name ?? '').trim() && (a.organization ?? '').trim(),
  );

export const hasMeaningfulVolunteer = (
  volunteer: CvData['volunteer'],
): boolean =>
  volunteer.some((v) => (v.organization ?? '').trim() && (v.role ?? '').trim());

export const hasMeaningfulCv = (cv: CvData): boolean =>
  hasMeaningfulPersonalInfo(cv.personalInfo) ||
  hasMeaningfulExperience(cv.experience) ||
  hasMeaningfulEducation(cv.education) ||
  hasMeaningfulProjects(cv.projects) ||
  hasMeaningfulAchievements(cv.achievements) ||
  hasMeaningfulVolunteer(cv.volunteer) ||
  cv.skills.some((skill) => hasAnyText(skill.name, skill.level ?? '')) ||
  cv.languages.some((language) =>
    hasAnyText(language.name, language.level ?? ''),
  ) ||
  cv.publications.length > 0 ||
  cv.talks.length > 0 ||
  cv.openSource.length > 0 ||
  cv.customSections.some((section) =>
    hasAnyText(section.title, section.body),
  );

export const isCustomSectionId = (
  sectionId: SectionId,
): sectionId is `custom:${string}` => sectionId.startsWith('custom:');
