import type {
  AchievementEntry,
  CvData,
  CvSectionKey,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
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
    'experience',
    'projects',
    'education',
    'skills',
    'languages',
    'volunteer',
    'opensource',
    'achievements',
    'publications',
    'talks',
  ],
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

export const normalizePersonalInfo = (value: unknown): PersonalInfo => {
  const base = createEmptyPersonalInfo();
  if (!isRecord(value)) return base;
  const record = value as Record<string, unknown>;
  return {
    ...base,
    fullName: normalizeString(record.fullName ?? base.fullName),
    jobTitle: normalizeString(record.jobTitle ?? base.jobTitle),
    summary: normalizeString(record.summary ?? base.summary),
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
  const description = normalizeString(record.description);
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
  const description = normalizeString(record.description);
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
  const description = normalizeString(record.description);
  const achievements = normalizeString(record.achievements);
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
  const context = normalizeString(record.context);
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
  const responsibilities = normalizeString(record.responsibilities);
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
  const body = normalizeString(record.body);
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
  };
};

export const validatePersonalInfo = (personalInfo: PersonalInfo) => {
  const errors: string[] = [];
  if (!personalInfo.fullName.trim()) {
    errors.push('Full name is required.');
  }
  if (!personalInfo.email.trim()) {
    errors.push('Email is required.');
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(personalInfo.email)) {
      errors.push('Email format is invalid.');
    }
  }
  return { isValid: errors.length === 0, errors };
};

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

export const isCustomSectionId = (
  sectionId: SectionId,
): sectionId is `custom:${string}` => sectionId.startsWith('custom:');
