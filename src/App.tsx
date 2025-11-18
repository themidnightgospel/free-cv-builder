import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import type {
  CvData,
  CvSectionKey,
  EducationEntry,
  ExperienceEntry,
  PersonalInfo,
  SectionId,
  ProjectEntry,
  AchievementEntry,
  FontSettings,
} from './types';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { ExperienceForm } from './components/ExperienceForm';
import { EducationForm } from './components/EducationForm';
import { SkillsForm } from './components/SkillsForm';
import { CvPreview } from './components/CvPreview';
import { CustomSectionForm } from './components/CustomSectionForm';
import { ProjectsForm } from './components/ProjectsForm';
import { AchievementsForm } from './components/AchievementsForm';
import { PublicationsForm } from './components/PublicationsForm';
import { TalksForm } from './components/TalksForm';
import { VolunteerForm } from './components/VolunteerForm';
import { OpenSourceForm } from './components/OpenSourceForm';
import { LanguagesForm } from './components/LanguagesForm';
import { useConfirmDialog } from './components/ConfirmDialogProvider';

declare global {
  interface Window {
    fillForm?: () => void;
  }
}

const createEmptyPersonalInfo = (): PersonalInfo => ({
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

const createEmptyExperience = (): ExperienceEntry => ({
  id: crypto.randomUUID(),
  jobTitle: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
});

const createEmptyEducation = (): EducationEntry => ({
  id: crypto.randomUUID(),
  degree: '',
  institution: '',
  location: '',
  startYear: '',
  endYear: '',
  isCurrent: false,
  description: '',
});

const createEmptyProject = (): ProjectEntry => ({
  id: crypto.randomUUID(),
  name: '',
  role: '',
  techStack: '',
  description: '',
  achievements: '',
  link: '',
});

const createEmptyAchievement = (): AchievementEntry => ({
  id: crypto.randomUUID(),
  name: '',
  organization: '',
  date: '',
  context: '',
});

const createInitialCv = (): CvData => ({
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

const createSampleCv = (): CvData => {
  const makeId = () => crypto.randomUUID();
  const customSections = [
    {
      id: makeId(),
      title: 'Community Leadership',
      body: `### Community Programs
- Organized quarterly meetups focused on accessibility testing.
- Built a mentorship circle pairing mid-level engineers with students.`,
    },
    {
      id: makeId(),
      title: 'Professional Development',
      body: `- Mentor three junior engineers through monthly growth sessions.
- Curate a \"What’s New in Frontend\" internal newsletter every sprint.`,
    },
  ];
  const customSectionIds: SectionId[] = customSections.map(
    (section) => `custom:${section.id}` as SectionId,
  );

  return {
    personalInfo: {
      fullName: 'Jordan Rivera',
      jobTitle: 'Senior Frontend Engineer',
      summary:
        'Product-minded engineer with a focus on accessibility, design systems, and data visualization for SaaS platforms.',
      email: 'jordan.rivera@example.com',
      phone: '+1 (555) 000-1234',
      location: 'Remote / NYC timezone',
      website: 'https://jordanrivera.dev',
      linkedin: 'https://www.linkedin.com/in/jordanrivera',
      photoDataUrl: null,
    },
    experience: [
      {
        id: makeId(),
        jobTitle: 'Lead Frontend Engineer',
        company: 'Aurora Analytics',
        location: 'Remote',
        startDate: 'Mar 2021',
        endDate: '',
        isCurrent: true,
        description:
          '- Own the company design system and accessibility guidelines.\n- Partner with PMs to ship experimentation tooling used by 45+ teams.',
      },
      {
        id: makeId(),
        jobTitle: 'Senior UI Engineer',
        company: 'Northwind Labs',
        location: 'Austin, TX',
        startDate: 'Jan 2018',
        endDate: 'Feb 2021',
        isCurrent: false,
        description:
          '- Implemented streaming dashboards for IoT fleet metrics.\n- Lifted Lighthouse performance scores from 68 to 94.',
      },
      {
        id: makeId(),
        jobTitle: 'Frontend Chapter Lead',
        company: 'Summit HR',
        location: 'Denver, CO',
        startDate: 'Mar 2016',
        endDate: 'Dec 2017',
        isCurrent: false,
        description:
          '- Led a guild of 14 engineers focusing on design system adoption.\n- Shipped internal UI kit used by recruiting pods worldwide.',
      },
      {
        id: makeId(),
        jobTitle: 'Product Engineer',
        company: 'Beacon CRM',
        location: 'Remote',
        startDate: 'May 2014',
        endDate: 'Feb 2016',
        isCurrent: false,
        description:
          '- Built reporting dashboards that increased CSAT visibility.\n- Partnered with PMs to run weekly customer feedback sessions.',
      },
      {
        id: makeId(),
        jobTitle: 'UI Engineer II',
        company: 'Hudson Analytics',
        location: 'Chicago, IL',
        startDate: 'Jun 2012',
        endDate: 'Apr 2014',
        isCurrent: false,
        description:
          '- Migrated legacy Backbone flows to React without downtime.\n- Authored accessibility checklist adopted across the org.',
      },
      {
        id: makeId(),
        jobTitle: 'Frontend Engineer',
        company: 'Brightside Media',
        location: 'Seattle, WA',
        startDate: 'Jul 2010',
        endDate: 'May 2012',
        isCurrent: false,
        description:
          '- Created marketing landing page generator powering 200+ launches.\n- Introduced performance budgets and bundle analysis tooling.',
      },
      {
        id: makeId(),
        jobTitle: 'Web Developer',
        company: 'PixelSmith Studio',
        location: 'Portland, OR',
        startDate: 'Jun 2009',
        endDate: 'Jun 2010',
        isCurrent: false,
        description:
          '- Built client microsites with custom CMS widgets.\n- Mentored two interns on semantic HTML and CSS architecture.',
      },
      {
        id: makeId(),
        jobTitle: 'Junior Developer',
        company: 'InnoTech Labs',
        location: 'San Diego, CA',
        startDate: 'Aug 2007',
        endDate: 'May 2009',
        isCurrent: false,
        description:
          '- Coded UI components for medical device dashboards.\n- Wrote regression suites covering mission-critical workflows.',
      },
    ],
    education: [
      {
        id: makeId(),
        degree: 'B.S. Computer Science',
        institution: 'University of Washington',
        location: 'Seattle, WA',
        startYear: '2012',
        endYear: '2016',
        isCurrent: false,
        description:
          'Concentration in Human-Computer Interaction. Minor in Design.',
      },
    ],
    projects: [
      {
        id: makeId(),
        name: 'CaseBuilder',
        role: 'Product Engineer',
        techStack: 'React, Zustand, Tailwind',
        description:
          'Workflow builder for legal teams drafting repeatable case packets.',
        achievements:
          '- Cut drafting time by 60%\n- Adopted by 12 enterprise law firms within 6 months',
        link: 'https://casebuilder.app',
      },
    ],
    achievements: [
      {
        id: makeId(),
        name: 'Grace Hopper Scholar',
        organization: 'AnitaB.org',
        date: '2023',
        context:
          'Selected for contributions to inclusive developer tooling initiatives.',
      },
    ],
    publications: [
      {
        id: makeId(),
        title: 'Design Systems that Scale',
        venue: 'Frontend Futures Magazine',
        year: '2024',
        coAuthors: 'Ava Patel',
        link: 'https://frontendfutures.dev/design-systems',
      },
    ],
    talks: [
      {
        id: makeId(),
        title: 'Measuring UX in Developer Tools',
        event: 'React Summit',
        date: 'Jun 2024',
        role: 'Speaker',
        locationOrLink: 'Amsterdam / livestream replay',
      },
    ],
    volunteer: [
      {
        id: makeId(),
        organization: 'Girls Who Code',
        role: 'Mentor',
        location: 'Remote',
        startDate: '2022',
        endDate: '',
        isCurrent: true,
        responsibilities:
          '- Lead weekly sessions for twelve high-school students.\n- Designed project-based curriculum covering JS fundamentals.',
      },
    ],
    openSource: [
      {
        id: makeId(),
        name: 'Prisma Dashboard',
        role: 'Maintainer',
        techStack: 'Next.js, GraphQL, Prisma',
        description: 'Extensible admin UI for inspecting Prisma schemas.',
        achievements:
          '- Added real-time query console\n- Introduced plugin API adopted by community contributors',
        link: 'https://github.com/jordanrivera/prisma-dashboard',
      },
    ],
    skills: [
      { id: makeId(), name: 'TypeScript', level: 'Advanced' },
      { id: makeId(), name: 'React', level: 'Advanced' },
      { id: makeId(), name: 'Node.js', level: 'Intermediate' },
      { id: makeId(), name: 'Design Systems', level: 'Advanced' },
    ],
    languages: [
      { id: makeId(), name: 'English', level: 'Native' },
      { id: makeId(), name: 'Spanish', level: 'Professional' },
    ],
    customSections,
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
      ...customSectionIds,
    ],
  };
};

const SAVED_CVS_STORAGE_KEY = 'freeCvBuilder:savedCvFiles';
const CURRENT_CV_ID_STORAGE_KEY = 'freeCvBuilder:currentCvId';

interface SavedCvRecord {
  id: string;
  name: string;
  updatedAt: number;
  cv: CvData;
}

const readSavedCvsFromStorage = (): SavedCvRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_CVS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (
          !isRecord(entry) ||
          typeof entry.id !== 'string' ||
          typeof entry.name !== 'string' ||
          typeof entry.updatedAt !== 'number' ||
          !isRecord(entry.cv)
        ) {
          return null;
        }
        return entry as unknown as SavedCvRecord;
      })
      .filter((entry): entry is SavedCvRecord => Boolean(entry));
  } catch (error) {
    console.error('Failed to read saved CVs', error);
    return [];
  }
};

const writeSavedCvsToStorage = (records: SavedCvRecord[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SAVED_CVS_STORAGE_KEY,
      JSON.stringify(records),
    );
  } catch (error) {
    console.error('Failed to persist CVs', error);
  }
};

const persistCurrentCvId = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CURRENT_CV_ID_STORAGE_KEY, id);
  } catch (error) {
    console.error('Failed to store current CV id', error);
  }
};

const getCvDisplayName = (data: CvData): string =>
  data.personalInfo.fullName.trim() || 'Untitled CV';

const createJsonFilename = (name?: string): string => {
  const base = name?.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-') ?? '';
  const sanitized = base.replace(/^-+|-+$/g, '') || 'my-cv';
  return `${sanitized}.json`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeSectionsOrder = (
  value: unknown,
  fallback: SectionId[],
): SectionId[] => {
  if (!Array.isArray(value)) return fallback;
  const sanitized = value.filter(
    (section): section is SectionId => typeof section === 'string',
  );
  return sanitized.length > 0 ? sanitized : fallback;
};

type CvArrayKey =
  | 'experience'
  | 'education'
  | 'projects'
  | 'achievements'
  | 'publications'
  | 'talks'
  | 'volunteer'
  | 'openSource'
  | 'skills'
  | 'languages'
  | 'customSections';

const normalizeCvData = (value: unknown): CvData | null => {
  if (!isRecord(value)) return null;
  const base = createInitialCv();
  const candidate = value as Partial<CvData>;
  const personalInfo = isRecord(candidate.personalInfo)
    ? ({
        ...base.personalInfo,
        ...(candidate.personalInfo as PersonalInfo),
      } as PersonalInfo)
    : base.personalInfo;
  const pickArray = <K extends CvArrayKey>(key: K): CvData[K] => {
    const candidateValue = candidate[key];
    if (Array.isArray(candidateValue)) {
      return candidateValue as CvData[K];
    }
    return base[key];
  };

  return {
    personalInfo,
    experience: pickArray('experience'),
    education: pickArray('education'),
    projects: pickArray('projects'),
    achievements: pickArray('achievements'),
    publications: pickArray('publications'),
    talks: pickArray('talks'),
    volunteer: pickArray('volunteer'),
    openSource: pickArray('openSource'),
    skills: pickArray('skills'),
    languages: pickArray('languages'),
    customSections: pickArray('customSections'),
    sectionsOrder: normalizeSectionsOrder(
      candidate.sectionsOrder,
      base.sectionsOrder,
    ),
  };
};

const validatePersonalInfo = (personalInfo: PersonalInfo) => {
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

const hasMeaningfulExperience = (experience: ExperienceEntry[]): boolean =>
  experience.some((e) => e.jobTitle.trim() && e.company.trim());

const hasMeaningfulEducation = (education: EducationEntry[]): boolean =>
  education.some((e) => e.degree.trim() && e.institution.trim());

const hasMeaningfulProjects = (projects: ProjectEntry[]): boolean =>
  projects.some((p) => p.name.trim() && p.role.trim());

const hasMeaningfulAchievements = (achievements: AchievementEntry[]): boolean =>
  achievements.some((a) => a.name.trim() && a.organization.trim());

const hasMeaningfulVolunteer = (volunteer: CvData['volunteer']): boolean =>
  volunteer.some((v) => v.organization.trim() && v.role.trim());

const sectionLabel: Record<CvSectionKey, string> = {
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

const isCustomSectionId = (
  sectionId: SectionId,
): sectionId is `custom:${string}` => sectionId.startsWith('custom:');

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const App: React.FC = () => {
  const [mode, setMode] = useState<'landing' | 'editor'>('landing');
  const [cv, setCv] = useState<CvData>(() => createInitialCv());
  const [activeSection, setActiveSection] = useState<SectionId>('personal');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [draggingSectionId, setDraggingSectionId] = useState<SectionId | null>(
    null,
  );
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<
    'sections' | 'preview'
  >('sections');
  const [currentCvId, setCurrentCvId] = useState<string>(() =>
    crypto.randomUUID(),
  );
  const [savedCvs, setSavedCvs] = useState<SavedCvRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const confirmDialog = useConfirmDialog();
  const defaultFontSettings: FontSettings = {
    fullName: 28,
    sectionTitle: 12,
    sectionItemTitle: 14,
    sectionDetail: 12,
  };
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    ...defaultFontSettings,
  });
  const jsonUploadInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const skipInitialPersistRef = useRef(true);
  const fontControls: {
    key: keyof FontSettings;
    label: string;
    helper: string;
    step?: number;
  }[] = [
    {
      key: 'fullName',
      label: 'Full name font size',
      helper: 'Controls the hero name in the header.',
      step: 2,
    },
    {
      key: 'sectionTitle',
      label: 'Section title font size',
      helper: 'Applies to headings like Experience or Skills.',
      step: 1,
    },
    {
      key: 'sectionItemTitle',
      label: 'Section item title font size',
      helper: 'Used for job titles, project names, etc.',
      step: 1,
    },
    {
      key: 'sectionDetail',
      label: 'Section details font size',
      helper: 'Controls the body text under each entry.',
      step: 1,
    },
  ];

  const handleFontSettingChange = (
    key: keyof FontSettings,
    value: number,
  ) => {
    const nextValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setFontSettings((prev) => ({ ...prev, [key]: nextValue }));
  };
  const adjustFontSetting = (
    key: keyof FontSettings,
    delta: number,
  ) => {
    setFontSettings((prev) => {
      const current = prev[key];
      const nextValue = Math.max(0, Math.round((current + delta) * 10) / 10);
      return { ...prev, [key]: nextValue };
    });
  };
  useEffect(() => {
    window.fillForm = () => {
      const newId = crypto.randomUUID();
      setCurrentCvId(newId);
      persistCurrentCvId(newId);
      setMode('editor');
      setCv(createSampleCv());
      setActiveSection('experience');
      setActiveWorkspaceView('sections');
    };
    return () => {
      delete window.fillForm;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedRecords = readSavedCvsFromStorage();
    setSavedCvs(storedRecords);
    const fallbackId =
      [...storedRecords].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ||
      null;
    const preferredId =
      window.localStorage.getItem(CURRENT_CV_ID_STORAGE_KEY) || fallbackId;
    if (preferredId) {
      const match = storedRecords.find((entry) => entry.id === preferredId);
      if (match) {
        setCv(match.cv);
        setCurrentCvId(match.id);
        persistCurrentCvId(match.id);
        setMode('editor');
        setActiveSection('personal');
        setActiveWorkspaceView('sections');
        setShowValidationModal(false);
        setValidationErrors([]);
      }
    }
  }, []);

  useEffect(() => {
    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }
    if (typeof window === 'undefined') return;
    if (!currentCvId) return;
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      const records = readSavedCvsFromStorage();
      const entry: SavedCvRecord = {
        id: currentCvId,
        name: getCvDisplayName(cv),
        updatedAt: Date.now(),
        cv,
      };
      const existingIndex = records.findIndex(
        (record) => record.id === currentCvId,
      );
      const nextRecords =
        existingIndex >= 0
          ? [
              ...records.slice(0, existingIndex),
              entry,
              ...records.slice(existingIndex + 1),
            ]
          : [...records, entry];
      writeSavedCvsToStorage(nextRecords);
      persistCurrentCvId(currentCvId);
      setSavedCvs(nextRecords);
      setHasUnsavedChanges(false);
      saveTimeoutRef.current = null;
    }, 3000);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [cv, currentCvId]);

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = normalizeCvData(parsed);
      if (!normalized) {
        throw new Error('Invalid CV JSON structure');
      }
      const newId = crypto.randomUUID();
      setCurrentCvId(newId);
      persistCurrentCvId(newId);
      setCv(normalized);
      setMode('editor');
      setActiveSection('personal');
      setActiveWorkspaceView('sections');
      setShowValidationModal(false);
      setValidationErrors([]);
      addToast('CV loaded from JSON file.', 'success');
    } catch (error) {
      console.error(error);
      addToast(
        'Could not import JSON. Please use a file exported from this builder.',
        'error',
      );
    }
  };

  const handleJsonUploadChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleImportJson(file);
    event.target.value = '';
  };

  const sectionStatuses = useMemo(() => {
    const personalValidation = validatePersonalInfo(cv.personalInfo);
    return {
      personal: personalValidation.isValid ? 'valid' : personalValidation.errors.length > 0 ? 'incomplete' : 'empty',
      experience: hasMeaningfulExperience(cv.experience)
        ? 'valid'
        : cv.experience.some((e) => e.jobTitle || e.company)
        ? 'incomplete'
        : 'empty',
      education: hasMeaningfulEducation(cv.education)
        ? 'valid'
        : cv.education.some((e) => e.degree || e.institution)
        ? 'incomplete'
        : 'empty',
      projects: hasMeaningfulProjects(cv.projects)
        ? 'valid'
        : cv.projects.some((p) => p.name || p.role)
        ? 'incomplete'
        : 'empty',
      achievements: hasMeaningfulAchievements(cv.achievements)
        ? 'valid'
        : cv.achievements.some((a) => a.name || a.organization)
        ? 'incomplete'
        : 'empty',
      publications:
        cv.publications.length > 0
          ? 'valid'
          : 'empty',
      talks:
        cv.talks.length > 0
          ? 'valid'
          : 'empty',
      volunteer: hasMeaningfulVolunteer(cv.volunteer)
        ? 'valid'
        : cv.volunteer.some((v) => v.organization || v.role)
        ? 'incomplete'
        : 'empty',
      opensource:
        cv.openSource.length > 0
          ? 'valid'
          : 'empty',
      skills: cv.skills.length > 0 ? 'valid' : 'empty',
      languages: cv.languages.length > 0 ? 'valid' : 'empty',
    } as const;
  }, [cv]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleCreateNew = () => {
    const newId = crypto.randomUUID();
    setCurrentCvId(newId);
    persistCurrentCvId(newId);
    setCv(createInitialCv());
    setActiveSection('personal');
    setMode('editor');
    setActiveWorkspaceView('sections');
    setShowValidationModal(false);
    setValidationErrors([]);
  };

  const handleSelectSavedCv = (id: string) => {
    const record = savedCvs.find((entry) => entry.id === id);
    if (!record) return;
    setCv(record.cv);
    setMode('editor');
    setActiveSection('personal');
    setActiveWorkspaceView('sections');
    setShowValidationModal(false);
    setValidationErrors([]);
    setCurrentCvId(id);
    persistCurrentCvId(id);
    addToast(`Loaded ${record.name}.`, 'success');
  };

  const handleDeleteSavedCv = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete saved CV?',
      message: `Delete "${name}" from this browser? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    setSavedCvs((prev) => {
      const next = prev.filter((record) => record.id !== id);
      writeSavedCvsToStorage(next);
      return next;
    });
    if (currentCvId === id) {
      const newId = crypto.randomUUID();
      setCurrentCvId(newId);
      persistCurrentCvId(newId);
    }
    addToast(`Deleted "${name}".`, 'info');
  };

  const handleAddCustomSection = () => {
    const id = crypto.randomUUID();
    setCv((prev) => ({
      ...prev,
      customSections: [
        ...prev.customSections,
        { id, title: 'New section', body: '' },
      ],
      sectionsOrder: [...prev.sectionsOrder, `custom:${id}`],
    }));
    setActiveSection(`custom:${id}`);
  };

  const reorderSections = (sourceId: SectionId, targetId: SectionId) => {
    if (sourceId === targetId) return;
    setCv((prev) => {
      const order = [...prev.sectionsOrder];
      const fromIndex = order.indexOf(sourceId);
      const toIndex = order.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, sourceId);
      return { ...prev, sectionsOrder: order };
    });
  };

  const downloadCvJson = (data: CvData, filenameHint?: string) => {
    try {
      const filename = createJsonFilename(
        filenameHint || getCvDisplayName(data),
      );
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      addToast(`CV data downloaded as ${filename}.`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Could not generate JSON. Try again.', 'error');
    }
  };

  const handleDownloadJson = () => {
    downloadCvJson(cv, getCvDisplayName(cv));
  };

  const handleDownloadSavedCv = (record: SavedCvRecord) => {
    downloadCvJson(record.cv, record.name);
  };

  const handleDownloadPdf = () => {
    const personalValidation = validatePersonalInfo(cv.personalInfo);
    if (!personalValidation.isValid) {
      setValidationErrors([
        ...personalValidation.errors.map((msg) => `Personal Info: ${msg}`),
      ]);
      setShowValidationModal(true);
      return;
    }

    const warnings: string[] = [];
    if (!hasMeaningfulExperience(cv.experience) && !hasMeaningfulEducation(cv.education)) {
      warnings.push(
        'Your CV does not include any experience or education yet. You can still export, but consider adding them.',
      );
    }
    warnings.forEach((message) => addToast(message, 'info'));

    const originalTitle = document.title;
    const normalizedName =
      cv.personalInfo.fullName.trim().toLowerCase().replace(/\s+/g, '-') ||
      'my-cv';
    document.title = `${normalizedName}-cv`;

    setIsPreparingPdf(true);
    setTimeout(() => {
      window.print();
      setIsPreparingPdf(false);
      document.title = originalTitle;
      addToast("PDF ready. Use 'Save as PDF' in the dialog.", 'success');
    }, 100);
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCv((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          photoDataUrl: typeof reader.result === 'string' ? reader.result : null,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const header = (
    <header className="fixed inset-x-0 top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={async () => {
              const confirmed = await confirmDialog({
                title: 'Return to start?',
                message:
                  'Your current CV will remain stored in this browser unless you clear it.',
              });
              if (confirmed) {
                setMode('landing');
              }
            }}
          >
            ← Back to start
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Free CV Builder
            </div>
            <div className="text-xs text-gray-500">
              Create and download your CV, fully in your browser.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium border ${
              hasUnsavedChanges
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {hasUnsavedChanges ? 'Unsaved changes' : 'Changes saved'}
          </span>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPreparingPdf}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isPreparingPdf ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </header>
  );

  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              Free CV Builder
            </h1>
            <p className="text-sm text-slate-600">
              Create and download your CV, fully in your browser.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Create new CV
            </button>
            <button
              type="button"
              onClick={() => jsonUploadInputRef.current?.click()}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Upload existing CV JSON
            </button>
            <input
              ref={jsonUploadInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleJsonUploadChange}
            />
            {savedCvs.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                <p className="text-xs font-semibold tracking-wide text-slate-500">
                  Saved CVs on this browser
                </p>
                <div className="space-y-2">
                  {[...savedCvs]
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((record) => (
                      <div
                        key={record.id}
                        className="flex items-stretch gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectSavedCv(record.id)}
                          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-slate-300 hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              {record.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(record.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Last updated{' '}
                            {new Date(record.updatedAt).toLocaleTimeString()}
                          </p>
                        </button>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadSavedCv(record)}
                            className="flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-2 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            aria-label={`Download ${record.name} as JSON`}
                            title="Download JSON"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSavedCv(record.id, record.name)
                            }
                            className="flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${record.name}`}
                            title="Delete saved CV"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 text-center">
            No sign-up, no server. Your data stays in your browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {header}
      <main className="mx-auto max-w-6xl px-4 pt-20 pb-8 print:block print:max-w-none print:px-0 print:pt-0 print:pb-0">
        <div className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 p-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm print:hidden">
          <button
            type="button"
            onClick={() => setActiveWorkspaceView('sections')}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              activeWorkspaceView === 'sections'
                ? 'bg-slate-900 text-white'
                : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            CV Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveWorkspaceView('preview')}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              activeWorkspaceView === 'preview'
                ? 'bg-slate-900 text-white'
                : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Live preview
          </button>
        </div>

        {activeWorkspaceView === 'sections' && (
          <div className="flex gap-4 print:hidden">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 space-y-4 pt-4 print:hidden">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Sections
                </h2>
                <nav className="space-y-1">
                  {cv.sectionsOrder.map((id) => {
                    const label = isCustomSectionId(id)
                      ? cv.customSections.find(
                          (section) => `custom:${section.id}` === id,
                        )?.title || 'Custom section'
                      : sectionLabel[id as CvSectionKey];

                    let status: 'valid' | 'incomplete' | 'empty' = 'empty';
                    if (isCustomSectionId(id)) {
                      const custom = cv.customSections.find(
                        (section) => `custom:${section.id}` === id,
                      );
                      status = custom && custom.body.trim() ? 'valid' : 'empty';
                    } else {
                      status = sectionStatuses[id as CvSectionKey];
                    }

                    const color =
                      status === 'valid'
                        ? 'bg-emerald-500'
                        : status === 'incomplete'
                        ? 'bg-amber-400'
                        : 'bg-slate-300';

                    return (
                      <div
                        key={id}
                        className={`flex items-center gap-1 rounded-md ${
                          draggingSectionId === id ? 'opacity-60' : ''
                        }`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggingSectionId(id);
                        }}
                        onDragEnd={() => setDraggingSectionId(null)}
                        onDragOver={(event) => {
                          if (!draggingSectionId || draggingSectionId === id)
                            return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!draggingSectionId || draggingSectionId === id)
                            return;
                          reorderSections(draggingSectionId, id);
                          setDraggingSectionId(null);
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveSection(id)}
                          className={`flex flex-1 items-center justify-between rounded-md px-3 py-2 text-sm ${
                            activeSection === id
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className="flex items-center gap-1 text-xs">
                            <span
                              className={`h-2 w-2 rounded-full ${color}`}
                              aria-hidden
                            />
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </nav>
                <button
                  type="button"
                  onClick={handleAddCustomSection}
                  className="mt-3 inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <span>+ Add section</span>
                </button>
              </div>
              <div className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
                Auto-save to this browser is coming soon. For now, download JSON to keep a copy.
              </div>
            </aside>

            {/* Form panel */}
            <section className="flex flex-1 pt-4">
              <div className="flex-1 space-y-4 print:hidden">
            {activeSection === 'personal' && (
              <PersonalInfoForm
                personalInfo={cv.personalInfo}
                onChange={(personalInfo) =>
                  setCv((prev) => ({ ...prev, personalInfo }))
                }
                onPhotoUpload={handlePhotoUpload}
              />
            )}
            {activeSection === 'experience' && (
              <ExperienceForm
                entries={cv.experience}
                onChange={(experience) => setCv((prev) => ({ ...prev, experience }))}
                createEmptyExperience={createEmptyExperience}
              />
            )}
            {activeSection === 'volunteer' && (
              <VolunteerForm
                entries={cv.volunteer}
                onChange={(volunteer) =>
                  setCv((prev) => ({ ...prev, volunteer }))
                }
              />
            )}
            {activeSection === 'projects' && (
              <ProjectsForm
                entries={cv.projects}
                onChange={(projects) => setCv((prev) => ({ ...prev, projects }))}
                createEmptyProject={createEmptyProject}
              />
            )}
            {activeSection === 'achievements' && (
              <AchievementsForm
                entries={cv.achievements}
                onChange={(achievements) =>
                  setCv((prev) => ({ ...prev, achievements }))
                }
                createEmptyAchievement={createEmptyAchievement}
              />
            )}
            {activeSection === 'publications' && (
              <PublicationsForm
                entries={cv.publications}
                onChange={(publications) =>
                  setCv((prev) => ({ ...prev, publications }))
                }
              />
            )}
            {activeSection === 'talks' && (
              <TalksForm
                entries={cv.talks}
                onChange={(talks) => setCv((prev) => ({ ...prev, talks }))}
              />
            )}
            {activeSection === 'opensource' && (
              <OpenSourceForm
                entries={cv.openSource}
                onChange={(openSource) =>
                  setCv((prev) => ({ ...prev, openSource }))
                }
              />
            )}
            {activeSection === 'education' && (
              <EducationForm
                entries={cv.education}
                onChange={(education) => setCv((prev) => ({ ...prev, education }))}
                createEmptyEducation={createEmptyEducation}
              />
            )}
            {activeSection === 'skills' && (
              <SkillsForm
                skills={cv.skills}
                onChange={(skills) => setCv((prev) => ({ ...prev, skills }))}
              />
            )}
            {activeSection === 'languages' && (
              <LanguagesForm
                languages={cv.languages}
                onChange={(languages) =>
                  setCv((prev) => ({ ...prev, languages }))
                }
              />
            )}
            {activeSection.startsWith('custom:') && (
              <CustomSectionForm
                section={
                  cv.customSections.find(
                    (section) => `custom:${section.id}` === activeSection,
                  ) ?? {
                    id: '',
                    title: '',
                    body: '',
                  }
                }
                onChange={(updated) =>
                  setCv((prev) => ({
                    ...prev,
                    customSections: prev.customSections.map((section) =>
                      section.id === updated.id ? updated : section,
                    ),
                  }))
                }
                onDelete={() =>
                  setCv((prev) => {
                    const id = activeSection.replace('custom:', '');
                    return {
                      ...prev,
                      customSections: prev.customSections.filter(
                        (section) => section.id !== id,
                      ),
                      sectionsOrder: prev.sectionsOrder.filter(
                        (sectionId) => sectionId !== activeSection,
                      ),
                    };
                  })
                }
              />
            )}
          </div>
        </section>
        </div>
        )}

        {/* Live preview */}
        {activeWorkspaceView === 'preview' && (
          <div className="mt-4 mx-auto max-w-4xl print:hidden">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Advanced options
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fine-tune typography for the exported PDF.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => setFontSettings({ ...defaultFontSettings })}
                >
                  Reset defaults
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {fontControls.map((control) => (
                  <div key={control.key}>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      {control.label}
                    </label>
                    <p className="text-[10px] text-slate-500">
                      {control.helper}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() =>
                          adjustFontSetting(control.key, -(control.step ?? 1))
                        }
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        step={control.step ?? 1}
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-700"
                        value={fontSettings[control.key]}
                        onChange={(event) =>
                          handleFontSettingChange(
                            control.key,
                            Number(event.target.value),
                          )
                        }
                      />
                      <span className="text-[10px] text-slate-500">px</span>
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() =>
                          adjustFontSetting(control.key, control.step ?? 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div
          className={`mt-4 ${
            activeWorkspaceView === 'preview' ? 'block' : 'hidden'
          } print:block print:mt-0`}
        >
          <div className="mx-auto max-w-4xl">
            <div className="sticky top-20 print:static print:top-auto">
              <div className="mb-2 flex items-baseline justify-between print:hidden">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Live preview
                </h2>
                <p className="text-[11px] text-slate-400">
                  This layout is used for PDF export.
                </p>
              </div>
              <div className="bg-slate-200 py-4 px-2 print:bg-transparent print:p-0">
                <div className="mx-auto aspect-[1/1.4142] w-full max-w-full bg-white shadow-sm border border-slate-200 px-8 py-6 text-slate-900 print:mx-0 print:w-full print:max-w-none print:shadow-none print:border-0 print:max-h-none print:aspect-auto print:p-8">
                  <CvPreview cv={cv} fontSettings={fontSettings} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation modal */}
        {showValidationModal && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-2 text-base font-semibold text-slate-900">
                Complete required info
              </h2>
              <p className="mb-3 text-sm text-slate-600">
                Fix the highlighted fields to generate a clean CV.
              </p>
              <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowValidationModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => {
                    setActiveSection('personal');
                    setShowValidationModal(false);
                  }}
                >
                  Go to Personal Info
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 space-y-2 print:hidden">
          {toasts.map((toast) => {
            const base =
              'pointer-events-auto flex items-center gap-2 rounded-md px-3 py-2 text-xs shadow-sm border';
            const style =
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-slate-50 text-slate-800 border-slate-200';
            return (
              <div key={toast.id} className={`${base} ${style}`}>
                <span>{toast.message}</span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
