import type {
  AchievementEntry,
  CvData,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  Language,
  PersonalInfo,
  ProjectEntry,
  PublicationEntry,
  Skill,
  TalkEntry,
  VolunteerExperienceEntry,
} from '../types';

const trimString = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const pushStringIfPresent = (
  target: Record<string, unknown>,
  key: string,
  value?: string | null,
) => {
  const trimmed = trimString(value);
  if (trimmed !== undefined) {
    target[key] = trimmed;
  }
};

const compactPersonalInfo = (
  info: PersonalInfo,
): Partial<PersonalInfo> & Pick<PersonalInfo, 'fullName' | 'email'> => {
  const result: Partial<PersonalInfo> = {
    fullName: info.fullName.trim(),
    email: info.email.trim(),
  };
  pushStringIfPresent(result, 'jobTitle', info.jobTitle);
  pushStringIfPresent(result, 'summary', info.summary);
  pushStringIfPresent(result, 'phone', info.phone);
  pushStringIfPresent(result, 'location', info.location);
  pushStringIfPresent(result, 'website', info.website);
  pushStringIfPresent(result, 'linkedin', info.linkedin);
  return result as Partial<PersonalInfo> &
    Pick<PersonalInfo, 'fullName' | 'email'>;
};

const compactExperience = (
  entry: ExperienceEntry,
): Partial<ExperienceEntry> & { id: string } | null => {
  const payload: Partial<ExperienceEntry> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'jobTitle', entry.jobTitle);
  pushStringIfPresent(payload, 'company', entry.company);
  pushStringIfPresent(payload, 'location', entry.location);
  pushStringIfPresent(payload, 'startDate', entry.startDate);
  pushStringIfPresent(payload, 'endDate', entry.endDate);
  pushStringIfPresent(payload, 'description', entry.description);
  if (entry.isCurrent) payload.isCurrent = true;
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactEducation = (
  entry: EducationEntry,
): Partial<EducationEntry> & { id: string } | null => {
  const payload: Partial<EducationEntry> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'degree', entry.degree);
  pushStringIfPresent(payload, 'institution', entry.institution);
  pushStringIfPresent(payload, 'location', entry.location);
  pushStringIfPresent(payload, 'startYear', entry.startYear);
  pushStringIfPresent(payload, 'endYear', entry.endYear);
  pushStringIfPresent(payload, 'description', entry.description);
  if (entry.isCurrent) payload.isCurrent = true;
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactProject = (
  entry: ProjectEntry,
): Partial<ProjectEntry> & { id: string } | null => {
  const payload: Partial<ProjectEntry> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'name', entry.name);
  pushStringIfPresent(payload, 'role', entry.role);
  pushStringIfPresent(payload, 'techStack', entry.techStack);
  pushStringIfPresent(payload, 'description', entry.description);
  pushStringIfPresent(payload, 'achievements', entry.achievements);
  pushStringIfPresent(payload, 'link', entry.link);
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactAchievement = (
  entry: AchievementEntry,
): Partial<AchievementEntry> & { id: string } | null => {
  const payload: Partial<AchievementEntry> & { id: string } = {
    id: entry.id,
  };
  pushStringIfPresent(payload, 'name', entry.name);
  pushStringIfPresent(payload, 'organization', entry.organization);
  pushStringIfPresent(payload, 'date', entry.date);
  pushStringIfPresent(payload, 'context', entry.context);
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactPublication = (
  entry: PublicationEntry,
): Partial<PublicationEntry> & { id: string } | null => {
  const payload: Partial<PublicationEntry> & { id: string } = {
    id: entry.id,
  };
  pushStringIfPresent(payload, 'title', entry.title);
  pushStringIfPresent(payload, 'venue', entry.venue);
  pushStringIfPresent(payload, 'year', entry.year);
  pushStringIfPresent(payload, 'coAuthors', entry.coAuthors);
  pushStringIfPresent(payload, 'link', entry.link);
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactTalk = (
  entry: TalkEntry,
): Partial<TalkEntry> & { id: string } | null => {
  const payload: Partial<TalkEntry> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'title', entry.title);
  pushStringIfPresent(payload, 'event', entry.event);
  pushStringIfPresent(payload, 'date', entry.date);
  pushStringIfPresent(payload, 'role', entry.role);
  pushStringIfPresent(payload, 'locationOrLink', entry.locationOrLink);
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactVolunteer = (
  entry: VolunteerExperienceEntry,
): Partial<VolunteerExperienceEntry> & { id: string } | null => {
  const payload: Partial<VolunteerExperienceEntry> & { id: string } = {
    id: entry.id,
  };
  pushStringIfPresent(payload, 'organization', entry.organization);
  pushStringIfPresent(payload, 'role', entry.role);
  pushStringIfPresent(payload, 'location', entry.location);
  pushStringIfPresent(payload, 'startDate', entry.startDate);
  pushStringIfPresent(payload, 'endDate', entry.endDate);
  pushStringIfPresent(payload, 'responsibilities', entry.responsibilities);
  if (entry.isCurrent) payload.isCurrent = true;
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactSkill = (
  entry: Skill,
): Partial<Skill> & { id: string } | null => {
  const payload: Partial<Skill> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'name', entry.name);
  if (entry.level) {
    payload.level = entry.level;
  }
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactLanguage = (
  entry: Language,
): Partial<Language> & { id: string } | null => {
  const payload: Partial<Language> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'name', entry.name);
  pushStringIfPresent(payload, 'level', entry.level);
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactCustomSection = (
  entry: CustomSection,
): Partial<CustomSection> & { id: string } | null => {
  const payload: Partial<CustomSection> & { id: string } = { id: entry.id };
  pushStringIfPresent(payload, 'title', entry.title);
  pushStringIfPresent(payload, 'body', entry.body);
  return Object.keys(payload).length > 1 ? payload : null;
};

const compactArray = <TInput, TOutput>(
  items: TInput[] | undefined,
  compact: (item: TInput) => TOutput | null,
): TOutput[] =>
  (items ?? []).map(compact).filter(Boolean) as TOutput[];

const buildCompactCvPayload = (cv: CvData) => ({
  v: 1,
  personalInfo: compactPersonalInfo(cv.personalInfo),
  experience: compactArray(cv.experience, compactExperience),
  education: compactArray(cv.education, compactEducation),
  projects: compactArray(cv.projects, compactProject),
  achievements: compactArray(cv.achievements, compactAchievement),
  publications: compactArray(cv.publications, compactPublication),
  talks: compactArray(cv.talks, compactTalk),
  volunteer: compactArray(cv.volunteer, compactVolunteer),
  openSource: compactArray(cv.openSource, compactProject),
  skills: compactArray(cv.skills, compactSkill),
  languages: compactArray(cv.languages, compactLanguage),
  customSections: compactArray(cv.customSections, compactCustomSection),
  sectionsOrder: cv.sectionsOrder ?? [],
  fontSettings: cv.fontSettings,
});

export const encodeCvPayloadForText = (data: CvData): string => {
  const payload = buildCompactCvPayload(data);
  return JSON.stringify(payload);
};
