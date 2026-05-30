import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type {
  AdvancedSettings,
  CvData,
  ExperienceEntry,
  PersonalInfo,
  SectionId,
  FontSettings,
} from '../types';
import { DEFAULT_ADVANCED_SETTINGS } from '../state/cvModel';
import { formatMonthForDisplay } from '../utils/dateFields';
import { EditableText } from './editable/EditableText';
import { AddSectionGap } from './editable/AddSectionGap';
import type { AddSectionOption } from './editable/AddSectionGap';
import { renderEditableSection } from './editable/renderEditableSection';
import {
  AchievementForm,
  CustomSectionForm as CustomBodyForm,
  EducationForm,
  ExperienceForm,
  LanguageForm,
  ProjectForm,
  PublicationForm,
  SkillForm,
  TalkForm,
  VolunteerForm,
} from './editable/EntryForms';
import type {
  AchievementEntry,
  CustomSection,
  EducationEntry,
  Language,
  ProjectEntry,
  PublicationEntry,
  Skill,
  TalkEntry,
  VolunteerExperienceEntry,
} from '../types';
import { generateId } from '../utils/uuid';
import {
  validateOptionalEmail,
  validateOptionalLinkedIn,
  validateOptionalPhone,
  validateOptionalUrl,
} from '../utils/fieldValidators';

const hasText = (value?: string | null): boolean =>
  Boolean(value && value.trim().length > 0);

const preserveBlankLines = (markdown: string): string => {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const stripped = normalized.replace(/\n[ \t]+(?=\n)/g, '\n');
  return stripped.replace(/\n{2,}/g, (run) => {
    const extra = run.length - 2;
    if (extra <= 0) return run;
    return '\n\n' + ' \n\n'.repeat(extra);
  });
};

const hasMeaningfulExperience = (experience: CvData['experience']): boolean =>
  experience.some((e) => hasText(e.jobTitle) && hasText(e.company));

const hasMeaningfulEducation = (education: CvData['education']): boolean =>
  education.some((e) => hasText(e.degree) && hasText(e.institution));

const projectHasContent = (project: CvData['projects'][number]): boolean =>
  hasText(project.name) ||
  hasText(project.role) ||
  hasText(project.techStack) ||
  hasText(project.description) ||
  hasText(project.achievements) ||
  hasText(project.link);

const achievementHasContent = (
  achievement: CvData['achievements'][number],
): boolean =>
  hasText(achievement.name) ||
  hasText(achievement.organization) ||
  hasText(achievement.context) ||
  hasText(achievement.date);

const publicationHasContent = (
  publication: CvData['publications'][number],
): boolean =>
  hasText(publication.title) ||
  hasText(publication.venue) ||
  hasText(publication.year) ||
  hasText(publication.coAuthors) ||
  hasText(publication.link);

const talkHasContent = (talk: CvData['talks'][number]): boolean =>
  hasText(talk.title) ||
  hasText(talk.event) ||
  hasText(talk.date) ||
  hasText(talk.role) ||
  hasText(talk.locationOrLink);

const volunteerHasContent = (
  entry: CvData['volunteer'][number],
): boolean =>
  hasText(entry.organization) ||
  hasText(entry.role) ||
  hasText(entry.location) ||
  hasText(entry.startDate) ||
  hasText(entry.endDate) ||
  hasText(entry.responsibilities);

const skillHasContent = (skill: CvData['skills'][number]): boolean =>
  hasText(skill.name);

const languageHasContent = (
  language: CvData['languages'][number],
): boolean => hasText(language.name);

const hasMeaningfulProjects = (projects: CvData['projects']): boolean =>
  projects.some(projectHasContent);

const hasMeaningfulAchievements = (
  achievements: CvData['achievements'],
): boolean => achievements.some(achievementHasContent);

const hasMeaningfulPublications = (
  publications: CvData['publications'],
): boolean => publications.some(publicationHasContent);

const hasMeaningfulTalks = (talks: CvData['talks']): boolean =>
  talks.some(talkHasContent);

const hasMeaningfulVolunteer = (volunteer: CvData['volunteer']): boolean =>
  volunteer.some(volunteerHasContent);

const hasMeaningfulSkills = (skills: CvData['skills']): boolean =>
  skills.some(skillHasContent);

const hasMeaningfulLanguages = (languages: CvData['languages']): boolean =>
  languages.some(languageHasContent);

const ensureUrlProtocol = (value: string) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  if (/^[a-z]+:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const looksLikeUrl = (value: string) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return false;
  return /^(https?:\/\/|www\.)/i.test(trimmed);
};

const formatTelHref = (value: string) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  const normalized = trimmed.replace(/[^+\d]/g, '');
  return normalized || trimmed;
};

const normalizeMarkdownHref = (href?: string) => {
  const trimmed = href?.trim() ?? '';
  if (!trimmed) return '';
  if (trimmed.startsWith('#')) return trimmed;
  return ensureUrlProtocol(trimmed);
};

const renderExternalLink = (
  value: string,
  label?: string,
  className = 'text-blue-600 hover:underline break-all',
) => {
  const href = ensureUrlProtocol(value);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label ?? value}
    </a>
  );
};

const markdownComponents: Components = {
  a({ node: _node, href, children, className, ...props }) {
    const safeHref = normalizeMarkdownHref(href);
    if (!safeHref) {
      return <span {...props}>{children}</span>;
    }
    const combinedClassName = ['text-blue-600 hover:underline', className]
      .filter(Boolean)
      .join(' ');
    return (
      <a
        {...props}
        href={safeHref}
        target="_blank"
        rel="noreferrer"
        className={combinedClassName}
      >
        {children}
      </a>
    );
  },
};

interface CvHeaderProps {
  personalInfo: CvData['personalInfo'];
  editor?: EditorBindings;
}

const CvHeader: React.FC<CvHeaderProps> = ({ personalInfo, editor }) => {
  const updatePersonal = (patch: Partial<PersonalInfo>) => {
    editor?.onUpdatePersonalInfo({ ...personalInfo, ...patch });
  };

  const validatorByKey: Partial<
    Record<keyof PersonalInfo, (value: string) => string | null>
  > = {
    email: validateOptionalEmail,
    phone: validateOptionalPhone,
    website: validateOptionalUrl,
    linkedin: validateOptionalLinkedIn,
  };

  const contactRow = (label: string, key: keyof PersonalInfo, placeholder: string) => {
    if (!editor && !personalInfo[key]) return null;
    return (
      <p className="break-words">
        <span className="font-medium text-slate-700">{label}:</span>{' '}
        {editor ? (
          <EditableText
            value={(personalInfo[key] as string) ?? ''}
            onChange={(value) => updatePersonal({ [key]: value } as Partial<PersonalInfo>)}
            placeholder={placeholder}
            ariaLabel={label}
            className="break-all"
            validate={validatorByKey[key]}
          />
        ) : key === 'email' ? (
          <a
            href={`mailto:${(personalInfo.email ?? '').trim()}`}
            className="break-all text-blue-600 hover:underline"
          >
            {personalInfo.email}
          </a>
        ) : key === 'phone' ? (
          <a
            href={`tel:${formatTelHref(personalInfo.phone)}`}
            className="break-all text-blue-600 hover:underline"
          >
            {personalInfo.phone}
          </a>
        ) : key === 'website' || key === 'linkedin' ? (
          renderExternalLink(
            personalInfo[key] as string,
            personalInfo[key] as string,
          )
        ) : (
          <>{personalInfo[key] as string}</>
        )}
      </p>
    );
  };

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:gap-[0.9rem]">
      <div className="flex items-center gap-4">
        {(personalInfo.photoDataUrl || editor) && (
          <button
            type="button"
            onClick={editor?.onPhotoUploadRequest}
            disabled={!editor}
            className={`h-16 w-16 overflow-hidden rounded-full bg-slate-100 ${
              editor
                ? 'cursor-pointer ring-1 ring-transparent transition hover:ring-2 hover:ring-accent/40'
                : ''
            }`}
            title={editor ? 'Change photo' : undefined}
            aria-label={editor ? 'Change profile photo' : undefined}
          >
            {personalInfo.photoDataUrl ? (
              <img
                src={personalInfo.photoDataUrl}
                alt={personalInfo.fullName || 'Profile photo'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                Photo
              </span>
            )}
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {editor ? (
              <EditableText
                value={personalInfo.fullName}
                onChange={(value) => updatePersonal({ fullName: value })}
                placeholder="Your full name"
                ariaLabel="Full name"
              />
            ) : (
              personalInfo.fullName || 'Your full name'
            )}
          </h1>
          <p className="font-job-title text-slate-500">
            {editor ? (
              <EditableText
                value={personalInfo.jobTitle}
                onChange={(value) => updatePersonal({ jobTitle: value })}
                placeholder="Job title or professional headline"
                ariaLabel="Job title"
              />
            ) : (
              personalInfo.jobTitle || 'Job title or professional headline'
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-1 justify-end">
        <div className="grid w-full max-w-md grid-cols-1 gap-1 font-contact-detail text-slate-600 sm:grid-cols-2">
          {contactRow('Email', 'email', 'you@example.com')}
          {contactRow('Phone', 'phone', '+1 555 000 0000')}
          {contactRow('Location', 'location', 'City, Country')}
          {contactRow('Portfolio', 'website', 'https://')}
          {contactRow('LinkedIn', 'linkedin', 'https://linkedin.com/in/you')}
          {!editor &&
            !personalInfo.email &&
            !personalInfo.phone &&
            !personalInfo.location &&
            !personalInfo.website &&
            !personalInfo.linkedin && (
              <p className="text-[11px] text-slate-400">
                Add your contact details to show them here.
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export interface EditorBindings {
  onUpdate: (cv: CvData) => void;
  onUpdatePersonalInfo: (info: PersonalInfo) => void;
  onPhotoUploadRequest: () => void;
  addSectionOptions: AddSectionOption[];
  onInsertSectionAt: (afterIndex: number, sectionId: string) => void;
  onMoveSection: (sectionId: SectionId, direction: -1 | 1) => void;
  onRemoveSection: (sectionId: SectionId) => void;
}

export interface CvPreviewProps {
  cv: CvData;
  fontSettings: FontSettings;
  advancedSettings?: AdvancedSettings;
  forcePrintLayout?: boolean;
  editor?: EditorBindings;
}

export const PRINT_PAGE_WIDTH = 794; // px at 96dpi for A4 width
export const PRINT_PAGE_HEIGHT = 1123; // px at 96dpi for A4 height

export const CvPreview: React.FC<CvPreviewProps> = ({
  cv,
  fontSettings,
  advancedSettings,
  forcePrintLayout = false,
  editor,
}) => {
  const advanced =
    advancedSettings ?? cv.advancedSettings ?? DEFAULT_ADVANCED_SETTINGS;
  const isEditor = Boolean(editor);
  const {
    personalInfo,
    experience,
    education,
    projects,
    achievements,
    publications,
    talks,
    volunteer,
    openSource,
    skills,
    languages,
    customSections,
    sectionsOrder,
  } = cv;
  const hasExperience = hasMeaningfulExperience(experience);
  const hasEducation = hasMeaningfulEducation(education);
  const hasProjects = hasMeaningfulProjects(projects);
  const hasAchievements = hasMeaningfulAchievements(achievements);
  const hasPublications = hasMeaningfulPublications(publications);
  const hasTalks = hasMeaningfulTalks(talks);
  const hasVolunteer = hasMeaningfulVolunteer(volunteer);
  const hasOpenSource = hasMeaningfulProjects(openSource);
  const hasSkills = hasMeaningfulSkills(skills);
  const hasLanguages = hasMeaningfulLanguages(languages);
  const [pageIndex, setPageIndex] = useState(0);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [displayWidth, setDisplayWidth] = useState(PRINT_PAGE_WIDTH);
  const [displayPageHeight, setDisplayPageHeight] = useState(
    PRINT_PAGE_HEIGHT,
  );
  const [displayContentHeight, setDisplayContentHeight] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageIndexRef = useRef(0);
  const pendingPrintPageRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const updateHeights = () => {
      const width =
        viewport.clientWidth || content.clientWidth || PRINT_PAGE_WIDTH;
      const pageHeight = (width / PRINT_PAGE_WIDTH) * PRINT_PAGE_HEIGHT;
      setDisplayWidth(width);
      setDisplayPageHeight(pageHeight);
      setDisplayContentHeight(content.scrollHeight);
    };

    updateHeights();

    if ('ResizeObserver' in window) {
      const viewportObserver = new ResizeObserver(updateHeights);
      const contentObserver = new ResizeObserver(updateHeights);
      viewportObserver.observe(viewport);
      contentObserver.observe(content);
      return () => {
        viewportObserver.disconnect();
        contentObserver.disconnect();
      };
    }

    return;
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const width =
      viewport.clientWidth || content.clientWidth || PRINT_PAGE_WIDTH;
    const pageHeight = (width / PRINT_PAGE_WIDTH) * PRINT_PAGE_HEIGHT;
    setDisplayWidth(width);
    setDisplayPageHeight(pageHeight);
    setDisplayContentHeight(content.scrollHeight);
  }, [cv]);

  const widthRatio = displayWidth / PRINT_PAGE_WIDTH || 1;
  // Content renders at native PRINT_PAGE_WIDTH then is scaled — so scrollHeight is already in print coordinates.
  const printContentHeight = displayContentHeight;
  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    const totalPages =
      PRINT_PAGE_HEIGHT > 0
        ? Math.max(1, Math.ceil(printContentHeight / PRINT_PAGE_HEIGHT))
        : 1;
    setPageIndex((prev) => {
      const maxIndex = Math.max(totalPages - 1, 0);
      return prev > maxIndex ? maxIndex : prev;
    });
  }, [printContentHeight]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prepareForPrint = () => {
      if (pendingPrintPageRef.current === null) {
        pendingPrintPageRef.current = pageIndexRef.current;
      }
      setPageIndex(0);
      setIsPrinting(true);
    };
    const cleanupAfterPrint = () => {
      setIsPrinting(false);
      if (pendingPrintPageRef.current !== null) {
        setPageIndex(pendingPrintPageRef.current);
        pendingPrintPageRef.current = null;
      }
    };

    window.addEventListener('beforeprint', prepareForPrint);
    window.addEventListener('afterprint', cleanupAfterPrint);

    let mediaQuery: MediaQueryList | null = null;
    let handleChange: ((event: MediaQueryListEvent) => void) | null = null;
    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('print');
      handleChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          prepareForPrint();
        } else {
          cleanupAfterPrint();
        }
      };
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      window.removeEventListener('beforeprint', prepareForPrint);
      window.removeEventListener('afterprint', cleanupAfterPrint);
      if (mediaQuery && handleChange) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, []);

  const totalPages =
    PRINT_PAGE_HEIGHT > 0
      ? Math.max(1, Math.ceil(printContentHeight / PRINT_PAGE_HEIGHT))
      : 1;
  const printMode = forcePrintLayout || isPrinting;
  // Translate in content (print) coordinates — scale applies on top so the visual shift = pageShift * widthRatio.
  const pageShiftInPrintCoords = printMode ? 0 : pageIndex * PRINT_PAGE_HEIGHT;
  const pxToRem = (value: number) => `${Math.max(0, value) / 16}rem`;
  const fontVariableStyles = {
    '--font-full-name': pxToRem(fontSettings.fullName),
    '--font-job-title': pxToRem(fontSettings.jobTitle),
    '--font-contact-detail': pxToRem(fontSettings.contactDetail),
    '--font-section-title': pxToRem(fontSettings.sectionTitle),
    '--font-section-item-title': pxToRem(fontSettings.sectionItemTitle),
    '--font-section-detail': pxToRem(fontSettings.sectionDetail),
    '--cv-section-gap': `${Math.max(0, advanced.sectionGapPx)}px`,
    '--cv-paragraph-spacing': `${Math.max(0, advanced.paragraphSpacingPx)}px`,
    '--cv-line-height': String(advanced.lineHeight),
    '--cv-accent': advanced.accentColor,
    '--cv-page-padding-x': `${Math.max(0, advanced.pagePaddingXPx)}px`,
    '--cv-page-padding-y': `${Math.max(0, advanced.pagePaddingYPx)}px`,
  } as React.CSSProperties;

  const contentStyles: React.CSSProperties = {
    // Always render at native A4 print width so text wraps the same as the PDF.
    width: `${PRINT_PAGE_WIDTH}px`,
    height: printMode || isEditor ? 'auto' : undefined,
    ...fontVariableStyles,
  };

  if (!printMode && !isEditor) {
    contentStyles.transformOrigin = 'top left';
    contentStyles.transform = `scale(${widthRatio}) translateY(-${pageShiftInPrintCoords}px)`;
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden print:h-auto print:overflow-visible"
        style={{
          height:
            printMode || isEditor
              ? 'auto'
              : displayPageHeight || PRINT_PAGE_HEIGHT,
          overflow: printMode || isEditor ? 'visible' : undefined,
        }}
      >
        <div
          ref={contentRef}
          className={`cv-preview-content flex flex-col text-xs text-slate-900 transition-transform duration-200 print:transition-none${
            advanced.showSectionDividers ? ' cv-preview-content--dividers' : ''
          }`}
          style={contentStyles}
        >
          <CvHeader personalInfo={personalInfo} editor={editor} />

      <div
        className="mt-4 flex flex-col"
        style={{ gap: 'var(--cv-section-gap, 1rem)' }}
      >
        {personalInfo.summary && (
          <section>
            <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
              Professional Summary
            </h2>
            <div className="text-[11px] text-slate-700">
              <div className="cv-markdown">
                <ReactMarkdown skipHtml components={markdownComponents}>
                  {preserveBlankLines(personalInfo.summary)}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {sectionsOrder.map((id: SectionId, sectionIndex: number) => {
            const renderGapBefore = () => {
              if (!isEditor || !editor) return null;
              if (sectionIndex === 0) return null;
              return (
                <AddSectionGap
                  options={editor.addSectionOptions}
                  onSelect={(optionId) =>
                    editor.onInsertSectionAt(sectionIndex - 1, optionId)
                  }
                />
              );
            };
            const wrap = (content: React.ReactNode) =>
              content === null ? null : (
                <React.Fragment key={id}>
                  {renderGapBefore()}
                  {content}
                </React.Fragment>
              );

            if (id === 'personal') return null;

            const sectionMoveHandlers = isEditor && editor
              ? {
                  onMoveSection: editor.onMoveSection,
                  onRemoveSection: editor.onRemoveSection,
                }
              : {};

            if (id === 'experience') {
              if (!hasExperience && !isEditor) return null;
              return wrap(
                renderEditableSection<ExperienceEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Experience',
                  entries: experience,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, experience: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    jobTitle: '',
                    company: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    description: '',
                  }),
                  FormComponent: ExperienceForm,
                  popoverTitle: 'Experience',
                  popoverWidth: 580,
                  addLabel: 'Add experience',
                  displayFilter: (e) =>
                    Boolean(e.jobTitle || e.company || e.description),
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (e) => {
                    const startDate = formatMonthForDisplay(e.startDate);
                    const endDate = e.isCurrent
                      ? 'Present'
                      : formatMonthForDisplay(e.endDate);
                    const hasRange = Boolean(startDate || endDate);
                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {e.jobTitle || (
                                <span className="italic text-slate-400">
                                  Job title
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {e.company}
                              {e.location ? ` • ${e.location}` : ''}
                            </p>
                          </div>
                          {hasRange && (
                            <p className="text-[11px] text-slate-500">
                              {startDate}
                              {(endDate || e.isCurrent) && ' – '}
                              {endDate}
                            </p>
                          )}
                        </div>
                        {e.description && (
                          <div className="mt-1 text-[11px] text-slate-700">
                            <div className="cv-markdown">
                              <ReactMarkdown
                                skipHtml
                                components={markdownComponents}
                              >
                                {preserveBlankLines(e.description)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  },
                }),
              );
            }

            if (id === 'education') {
              if (!hasEducation && !isEditor) return null;
              return wrap(
                renderEditableSection<EducationEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Education',
                  entries: education,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, education: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    degree: '',
                    institution: '',
                    location: '',
                    startYear: '',
                    endYear: '',
                    isCurrent: false,
                    description: '',
                  }),
                  FormComponent: EducationForm,
                  popoverTitle: 'Education',
                  popoverWidth: 560,
                  addLabel: 'Add education',
                  displayFilter: (e) =>
                    Boolean(e.degree || e.institution || e.description),
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (e) => {
                    const startYear = formatMonthForDisplay(e.startYear);
                    const endYear = e.isCurrent
                      ? 'Present'
                      : formatMonthForDisplay(e.endYear);
                    const hasRange = Boolean(startYear || endYear);
                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {e.degree || (
                                <span className="italic text-slate-400">
                                  Degree
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {e.institution}
                              {e.location ? ` • ${e.location}` : ''}
                            </p>
                          </div>
                          {hasRange && (
                            <p className="text-[11px] text-slate-500">
                              {startYear}
                              {(endYear || e.isCurrent) && ' – '}
                              {endYear}
                            </p>
                          )}
                        </div>
                        {e.description && (
                          <div className="mt-1 text-[11px] text-slate-700">
                            <div className="cv-markdown">
                              <ReactMarkdown
                                skipHtml
                                components={markdownComponents}
                              >
                                {preserveBlankLines(e.description)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  },
                }),
              );
            }

            if (id === 'projects') {
              if (!hasProjects && !isEditor) return null;
              return wrap(
                renderEditableSection<ProjectEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Projects',
                  entries: projects,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, projects: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    name: '',
                    role: '',
                    techStack: '',
                    description: '',
                    achievements: '',
                    link: '',
                  }),
                  FormComponent: ProjectForm,
                  popoverTitle: 'Project',
                  popoverWidth: 560,
                  addLabel: 'Add project',
                  displayFilter: projectHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (p) => (
                    <>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-[12px] font-semibold">
                            {p.name || (
                              <span className="italic text-slate-400">
                                Project
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {p.role}
                            {p.techStack ? ` • ${p.techStack}` : ''}
                          </p>
                        </div>
                        {p.link &&
                          renderExternalLink(
                            p.link,
                            p.link,
                            'text-[11px] text-blue-600 break-all hover:underline',
                          )}
                      </div>
                      {p.description && (
                        <div className="mt-1 text-[11px] text-slate-700">
                          <div className="cv-markdown">
                            <ReactMarkdown
                              skipHtml
                              components={markdownComponents}
                            >
                              {preserveBlankLines(p.description)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {p.achievements && (
                        <div className="mt-1 text-[11px] text-slate-700">
                          <div className="cv-markdown">
                            <ReactMarkdown
                              skipHtml
                              components={markdownComponents}
                            >
                              {preserveBlankLines(p.achievements)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </>
                  ),
                }),
              );
            }

            if (id === 'achievements') {
              if (!hasAchievements && !isEditor) return null;
              return wrap(
                renderEditableSection<AchievementEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Achievements / Awards',
                  entries: achievements,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, achievements: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    name: '',
                    organization: '',
                    date: '',
                    context: '',
                  }),
                  FormComponent: AchievementForm,
                  popoverTitle: 'Achievement',
                  popoverWidth: 520,
                  addLabel: 'Add achievement',
                  displayFilter: achievementHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (a) => {
                    const date = formatMonthForDisplay(a.date);
                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {a.name || (
                                <span className="italic text-slate-400">
                                  Award
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {a.organization}
                            </p>
                          </div>
                          {date && (
                            <p className="text-[11px] text-slate-500">{date}</p>
                          )}
                        </div>
                        {a.context && (
                          <p className="mt-1 text-[11px] text-slate-700">
                            {a.context}
                          </p>
                        )}
                      </>
                    );
                  },
                }),
              );
            }

            if (id === 'publications') {
              if (!hasPublications && !isEditor) return null;
              return wrap(
                renderEditableSection<PublicationEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Publications',
                  entries: publications,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, publications: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    title: '',
                    venue: '',
                    year: '',
                    coAuthors: '',
                    link: '',
                  }),
                  FormComponent: PublicationForm,
                  popoverTitle: 'Publication',
                  popoverWidth: 520,
                  addLabel: 'Add publication',
                  displayFilter: publicationHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (pub) => {
                    const publishedDate = formatMonthForDisplay(pub.year);
                    return (
                      <>
                        <p className="text-[12px] font-semibold">
                          {pub.title || (
                            <span className="italic text-slate-400">
                              Publication
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {pub.venue}
                          {publishedDate ? ` • ${publishedDate}` : ''}
                        </p>
                        {pub.coAuthors && (
                          <p className="text-[11px] text-slate-500">
                            Co-authors: {pub.coAuthors}
                          </p>
                        )}
                        {pub.link &&
                          renderExternalLink(
                            pub.link,
                            pub.link,
                            'text-[11px] text-blue-600 break-all hover:underline',
                          )}
                      </>
                    );
                  },
                }),
              );
            }

            if (id === 'talks') {
              if (!hasTalks && !isEditor) return null;
              return wrap(
                renderEditableSection<TalkEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Talks / Conferences / Workshops',
                  entries: talks,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, talks: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    title: '',
                    event: '',
                    date: '',
                    role: '',
                    locationOrLink: '',
                  }),
                  FormComponent: TalkForm,
                  popoverTitle: 'Talk',
                  popoverWidth: 520,
                  addLabel: 'Add talk',
                  displayFilter: talkHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (talk) => {
                    const talkDate = formatMonthForDisplay(talk.date);
                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {talk.title || (
                                <span className="italic text-slate-400">
                                  Talk
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {talk.event}
                            </p>
                          </div>
                          {(talkDate || talk.role) && (
                            <p className="text-[11px] text-slate-500 text-right">
                              {talk.role && `${talk.role}`}
                              {talk.role && talkDate ? ' • ' : ''}
                              {talkDate}
                            </p>
                          )}
                        </div>
                        {talk.locationOrLink &&
                          (looksLikeUrl(talk.locationOrLink) ? (
                            renderExternalLink(
                              talk.locationOrLink,
                              talk.locationOrLink,
                              'text-[11px] text-blue-600 break-all hover:underline',
                            )
                          ) : (
                            <p className="text-[11px] text-slate-500 break-all">
                              {talk.locationOrLink}
                            </p>
                          ))}
                      </>
                    );
                  },
                }),
              );
            }

            if (id === 'volunteer') {
              if (!hasVolunteer && !isEditor) return null;
              return wrap(
                renderEditableSection<VolunteerExperienceEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Volunteer Experience',
                  entries: volunteer,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, volunteer: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    organization: '',
                    role: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    responsibilities: '',
                  }),
                  FormComponent: VolunteerForm,
                  popoverTitle: 'Volunteer experience',
                  popoverWidth: 560,
                  addLabel: 'Add volunteer experience',
                  displayFilter: volunteerHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (v) => {
                    const startDate = formatMonthForDisplay(v.startDate);
                    const endDate = v.isCurrent
                      ? 'Present'
                      : formatMonthForDisplay(v.endDate);
                    const hasRange = Boolean(startDate || endDate);
                    return (
                      <>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {v.role || (
                                <span className="italic text-slate-400">
                                  Volunteer role
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {v.organization}
                              {v.location ? ` • ${v.location}` : ''}
                            </p>
                          </div>
                          {hasRange && (
                            <p className="text-[11px] text-slate-500">
                              {startDate}
                              {(endDate || v.isCurrent) && ' – '}
                              {endDate}
                            </p>
                          )}
                        </div>
                        {v.responsibilities && (
                          <p className="mt-1 text-[11px] text-slate-700 whitespace-pre-line">
                            {v.responsibilities}
                          </p>
                        )}
                      </>
                    );
                  },
                }),
              );
            }

            if (id === 'opensource') {
              if (!hasOpenSource && !isEditor) return null;
              return wrap(
                renderEditableSection<ProjectEntry>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Open Source Contributions',
                  entries: openSource,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, openSource: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    name: '',
                    role: '',
                    techStack: '',
                    description: '',
                    achievements: '',
                    link: '',
                  }),
                  FormComponent: ProjectForm,
                  popoverTitle: 'Open source contribution',
                  popoverWidth: 560,
                  addLabel: 'Add contribution',
                  displayFilter: projectHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (c) => (
                    <>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-[12px] font-semibold">
                            {c.name || (
                              <span className="italic text-slate-400">
                                Project
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {c.role}
                            {c.techStack ? ` • ${c.techStack}` : ''}
                          </p>
                        </div>
                        {c.link &&
                          renderExternalLink(
                            c.link,
                            c.link,
                            'text-[11px] text-blue-600 break-all hover:underline',
                          )}
                      </div>
                      {c.achievements && (
                        <div className="mt-1 text-[11px] text-slate-700 whitespace-pre-line">
                          {c.achievements}
                        </div>
                      )}
                    </>
                  ),
                }),
              );
            }

            if (id === 'skills') {
              if (!hasSkills && !isEditor) return null;
              return wrap(
                renderEditableSection<Skill>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Skills',
                  entries: skills,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, skills: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    name: '',
                  }),
                  FormComponent: SkillForm,
                  popoverTitle: 'Skill',
                  popoverWidth: 360,
                  addLabel: 'Add skill',
                  displayFilter: skillHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (skill) => (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                      {skill.name || (
                        <span className="italic text-slate-400">Skill</span>
                      )}
                      {skill.level ? ` – ${skill.level}` : ''}
                    </span>
                  ),
                }),
              );
            }

            if (id === 'languages') {
              if (!hasLanguages && !isEditor) return null;
              return wrap(
                renderEditableSection<Language>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: 'Languages',
                  entries: languages,
                  onUpdateEntries: (next) =>
                    editor?.onUpdate({ ...cv, languages: next }),
                  createEmpty: () => ({
                    id: generateId(),
                    name: '',
                    level: 'Professional' as const,
                  }),
                  FormComponent: LanguageForm,
                  popoverTitle: 'Language',
                  popoverWidth: 360,
                  addLabel: 'Add language',
                  displayFilter: languageHasContent,
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (language) => (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                      {language.name || (
                        <span className="italic text-slate-400">Language</span>
                      )}{' '}
                      – {language.level}
                    </span>
                  ),
                }),
              );
            }

            if (id.startsWith('custom:')) {
              const customId = id.replace('custom:', '');
              const section = customSections.find((s) => s.id === customId);
              if (!section) return null;
              if (!isEditor && !hasText(section.body)) return null;
              return wrap(
                renderEditableSection<CustomSection>({
                  sectionId: id,
                  sectionIndex,
                  sectionsOrderLength: sectionsOrder.length,
                  title: section.title || 'Custom section',
                  entries: [section],
                  onUpdateEntries: (next) => {
                    const updated = next[0];
                    if (!updated) return;
                    editor?.onUpdate({
                      ...cv,
                      customSections: cv.customSections.map((s) =>
                        s.id === section.id ? updated : s,
                      ),
                    });
                  },
                  createEmpty: () => ({ id: generateId(), title: '', body: '' }),
                  FormComponent: CustomBodyForm,
                  popoverTitle: 'Custom section',
                  popoverWidth: 520,
                  addLabel: 'Add entry',
                  isEditor,
                  openEntryId,
                  setOpenEntryId,
                  ...sectionMoveHandlers,
                  renderEntry: (s) =>
                    s.body ? (
                      <div className="text-[11px] text-slate-700">
                        <div className="cv-markdown">
                          <ReactMarkdown skipHtml components={markdownComponents}>
                            {preserveBlankLines(s.body)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <p className="italic text-[11px] text-slate-400">
                        Click the pencil to add content.
                      </p>
                    ),
                }),
              );
            }

            return null;
          })}
          {isEditor && editor && (
            <AddSectionGap
              options={editor.addSectionOptions}
              onSelect={(optionId) =>
                editor.onInsertSectionAt(sectionsOrder.length - 1, optionId)
              }
            />
          )}
        </div>
      </div>
    </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 print:hidden">
        <button
          type="button"
          onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
          disabled={pageIndex === 0}
          className={`rounded-md border px-3 py-1 font-medium ${
            pageIndex === 0
              ? 'cursor-not-allowed border-slate-200 text-slate-400 bg-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Previous
        </button>
        <span className="font-medium text-slate-700">
          Page {Math.min(pageIndex + 1, totalPages)} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))
          }
          disabled={pageIndex >= totalPages - 1}
          className={`rounded-md border px-3 py-1 font-medium ${
            pageIndex >= totalPages - 1
              ? 'cursor-not-allowed border-slate-200 text-slate-400 bg-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

