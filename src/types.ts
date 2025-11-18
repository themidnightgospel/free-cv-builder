export type CvSectionKey =
  | 'personal'
  | 'experience'
  | 'education'
  | 'projects'
  | 'achievements'
  | 'publications'
  | 'talks'
  | 'volunteer'
  | 'opensource'
  | 'skills'
  | 'languages';

export type SectionId = CvSectionKey | `custom:${string}`;

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  photoDataUrl?: string | null;
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startYear: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  techStack: string;
  description: string;
  achievements: string;
  link: string;
}

export interface AchievementEntry {
  id: string;
  name: string;
  organization: string;
  date: string;
  context: string;
}

export interface PublicationEntry {
  id: string;
  title: string;
  venue: string;
  year: string;
  coAuthors: string;
  link: string;
}

export interface TalkEntry {
  id: string;
  title: string;
  event: string;
  date: string;
  role: string;
  locationOrLink: string;
}

export interface VolunteerExperienceEntry {
  id: string;
  organization: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Skill {
  id: string;
  name: string;
  level?: SkillLevel;
}

export type LanguageLevel =
  | 'Native'
  | 'Fluent'
  | 'Professional'
  | 'Intermediate'
  | 'Basic';

export interface Language {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface CustomSection {
  id: string;
  title: string;
  body: string;
}

export interface CvData {
  personalInfo: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  publications: PublicationEntry[];
  talks: TalkEntry[];
  volunteer: VolunteerExperienceEntry[];
  openSource: ProjectEntry[];
  skills: Skill[];
  languages: Language[];
  customSections: CustomSection[];
  /**
   * Controls order of sections in the UI and preview.
   * 'personal' is treated specially (header) but may still appear here.
   */
  sectionsOrder: SectionId[];
}
