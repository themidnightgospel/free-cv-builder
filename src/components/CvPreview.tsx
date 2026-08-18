import React, { useLayoutEffect, useRef, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
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
import { EditableMonth } from './editable/EditableMonth';
import { EditableSelect } from './editable/EditableSelect';
import { EditableToggle } from './editable/EditableToggle';
import { AddSectionGap } from './editable/AddSectionGap';
import type { AddSectionOption } from './editable/AddSectionGap';
import { renderEditableSection } from './editable/renderEditableSection';
import type {
  AchievementEntry,
  CustomSection,
  EducationEntry,
  Language,
  LanguageLevel,
  ProjectEntry,
  PublicationEntry,
  Skill,
  SkillLevel,
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

const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

const LANGUAGE_LEVEL_OPTIONS: { value: LanguageLevel; label: string }[] = [
  { value: 'Native', label: 'Native' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Professional', label: 'Professional' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Basic', label: 'Basic' },
];

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
          <div className="relative shrink-0">
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
            {editor && personalInfo.photoDataUrl && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await editor.confirmDeleteEntry(
                    'Remove this photo? This cannot be undone.',
                  );
                  if (!ok) return;
                  updatePersonal({ photoDataUrl: null });
                }}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-700 text-white shadow-sm transition hover:bg-red-600"
                title="Remove photo"
                aria-label="Remove profile photo"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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
  /** Resolves to true when the user confirms an entry deletion. */
  confirmDeleteEntry: (message: string) => Promise<boolean>;
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

const renderProjectLike = (
  entry: ProjectEntry,
  update: (next: ProjectEntry) => void,
  isEditor: boolean,
  namePlaceholder: string,
) => (
  <>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold">
          {isEditor ? (
            <EditableText
              value={entry.name}
              onChange={(value) => update({ ...entry, name: value })}
              placeholder={namePlaceholder}
              ariaLabel="Project name"
            />
          ) : (
            entry.name
          )}
        </p>
        <p className="text-[11px] text-slate-600">
          {isEditor ? (
            <>
              <EditableText
                value={entry.role}
                onChange={(value) => update({ ...entry, role: value })}
                placeholder="Role"
                ariaLabel="Role"
              />
              {' • '}
              <EditableText
                value={entry.techStack}
                onChange={(value) => update({ ...entry, techStack: value })}
                placeholder="Tech stack"
                ariaLabel="Tech stack"
              />
            </>
          ) : (
            <>
              {entry.role}
              {entry.techStack ? ` • ${entry.techStack}` : ''}
            </>
          )}
        </p>
      </div>
      {isEditor ? (
        <div className="text-[11px] text-blue-600 break-all">
          <EditableText
            value={entry.link}
            onChange={(value) => update({ ...entry, link: value })}
            placeholder="https://"
            ariaLabel="Link"
            validate={validateOptionalUrl}
          />
        </div>
      ) : (
        entry.link &&
        renderExternalLink(
          entry.link,
          entry.link,
          'text-[11px] text-blue-600 break-all hover:underline',
        )
      )}
    </div>
    <div className="mt-1 text-[11px] text-slate-700">
      {isEditor ? (
        <EditableText
          value={entry.description}
          onChange={(value) => update({ ...entry, description: value })}
          multiline
          placeholder="Brief description (markdown supported)"
          ariaLabel="Description"
        />
      ) : (
        entry.description && (
          <div className="cv-markdown">
            <ReactMarkdown skipHtml components={markdownComponents}>
              {preserveBlankLines(entry.description)}
            </ReactMarkdown>
          </div>
        )
      )}
    </div>
    <div className="mt-1 text-[11px] text-slate-700">
      {isEditor ? (
        <EditableText
          value={entry.achievements}
          onChange={(value) => update({ ...entry, achievements: value })}
          multiline
          placeholder="Achievements (markdown)"
          ariaLabel="Achievements"
        />
      ) : (
        entry.achievements && (
          <div className="cv-markdown">
            <ReactMarkdown skipHtml components={markdownComponents}>
              {preserveBlankLines(entry.achievements)}
            </ReactMarkdown>
          </div>
        )
      )}
    </div>
  </>
);

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
  const [displayWidth, setDisplayWidth] = useState(PRINT_PAGE_WIDTH);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Only the landing-page poster (non-editor, non-print) needs width-tracking
  // for its scale-to-fit transform. The editor and the print copy render at
  // native PRINT_PAGE_WIDTH with no scaling.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (isEditor || forcePrintLayout) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setDisplayWidth(viewport.clientWidth || PRINT_PAGE_WIDTH);
    update();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(update);
      observer.observe(viewport);
      return () => observer.disconnect();
    }
    return;
  }, [isEditor, forcePrintLayout]);

  const widthRatio = displayWidth / PRINT_PAGE_WIDTH || 1;
  const printMode = forcePrintLayout;
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
    height: 'auto',
    ...fontVariableStyles,
  };

  // Scale the native A4 content into narrower viewports — only for the landing
  // page poster. The editor renders natively and lets the page scroll.
  if (!printMode && !isEditor) {
    contentStyles.transformOrigin = 'top left';
    contentStyles.transform = `scale(${widthRatio})`;
  }

  // Reserve vertical space when scaling so the parent grows with the scaled
  // content rather than overlapping siblings.
  const scaledHeight =
    !printMode && !isEditor
      ? `calc(${PRINT_PAGE_HEIGHT}px * ${widthRatio})`
      : undefined;

  return (
    <div
      ref={viewportRef}
      className="relative print:h-auto"
      style={{
        height: scaledHeight,
        overflow: !printMode && !isEditor ? 'hidden' : 'visible',
      }}
    >
        <div
          ref={contentRef}
          className={`cv-preview-content flex flex-col text-xs text-slate-900 print:transition-none${
            advanced.showSectionDividers ? ' cv-preview-content--dividers' : ''
          }`}
          style={contentStyles}
        >
          <CvHeader personalInfo={personalInfo} editor={editor} />

      <div
        className="mt-4 flex flex-col"
        style={{ gap: 'var(--cv-section-gap, 1rem)' }}
      >
        {(personalInfo.summary || isEditor) && (
          <section>
            <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
              Professional Summary
            </h2>
            <div className="text-[11px] text-slate-700">
              {isEditor ? (
                <EditableText
                  value={personalInfo.summary}
                  onChange={(value) =>
                    editor?.onUpdatePersonalInfo({
                      ...personalInfo,
                      summary: value,
                    })
                  }
                  multiline
                  placeholder="Brief professional summary (markdown supported)"
                  ariaLabel="Professional summary"
                />
              ) : (
                <div className="cv-markdown">
                  <ReactMarkdown skipHtml components={markdownComponents}>
                    {preserveBlankLines(personalInfo.summary)}
                  </ReactMarkdown>
                </div>
              )}
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
                  confirmDelete: editor.confirmDeleteEntry,
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
                  addLabel: 'Add experience',
                  entryLabel: 'experience entry',
                  displayFilter: (e) =>
                    Boolean(e.jobTitle || e.company || e.description),
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (e, update) => {
                    const startDate = formatMonthForDisplay(e.startDate);
                    const endDate = e.isCurrent
                      ? 'Present'
                      : formatMonthForDisplay(e.endDate);
                    const hasRange = Boolean(startDate || endDate);
                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">
                              {isEditor ? (
                                <EditableText
                                  value={e.jobTitle}
                                  onChange={(value) =>
                                    update({ ...e, jobTitle: value })
                                  }
                                  placeholder="Job title"
                                  ariaLabel="Job title"
                                />
                              ) : (
                                e.jobTitle
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {isEditor ? (
                                <>
                                  <EditableText
                                    value={e.company}
                                    onChange={(value) =>
                                      update({ ...e, company: value })
                                    }
                                    placeholder="Company"
                                    ariaLabel="Company"
                                  />
                                  {' • '}
                                  <EditableText
                                    value={e.location}
                                    onChange={(value) =>
                                      update({ ...e, location: value })
                                    }
                                    placeholder="Location"
                                    ariaLabel="Location"
                                  />
                                </>
                              ) : (
                                <>
                                  {e.company}
                                  {e.location ? ` • ${e.location}` : ''}
                                </>
                              )}
                            </p>
                          </div>
                          {isEditor ? (
                            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <EditableMonth
                                  value={e.startDate}
                                  onChange={(value) =>
                                    update({ ...e, startDate: value })
                                  }
                                  placeholder="Start"
                                  ariaLabel="Start date"
                                />
                                <span> – </span>
                                <EditableMonth
                                  value={e.endDate}
                                  onChange={(value) =>
                                    update({ ...e, endDate: value })
                                  }
                                  placeholder={
                                    e.isCurrent ? 'Present' : 'End'
                                  }
                                  ariaLabel="End date"
                                  disabled={e.isCurrent}
                                />
                              </div>
                              <EditableToggle
                                checked={e.isCurrent}
                                onChange={(checked) =>
                                  update({
                                    ...e,
                                    isCurrent: checked,
                                    endDate: checked ? '' : e.endDate,
                                  })
                                }
                                label="Still working here"
                                ariaLabel="Currently working here"
                              />
                            </div>
                          ) : (
                            hasRange && (
                              <p className="text-[11px] text-slate-500">
                                {startDate}
                                {(endDate || e.isCurrent) && ' – '}
                                {endDate}
                              </p>
                            )
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-700">
                          {isEditor ? (
                            <EditableText
                              value={e.description}
                              onChange={(value) =>
                                update({ ...e, description: value })
                              }
                              multiline
                              placeholder="- Owned the design system…&#10;- Shipped accessibility audit…"
                              ariaLabel="Experience description"
                            />
                          ) : (
                            e.description && (
                              <div className="cv-markdown">
                                <ReactMarkdown
                                  skipHtml
                                  components={markdownComponents}
                                >
                                  {preserveBlankLines(e.description)}
                                </ReactMarkdown>
                              </div>
                            )
                          )}
                        </div>
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
                  addLabel: 'Add education',
                  entryLabel: 'education entry',
                  displayFilter: (e) =>
                    Boolean(e.degree || e.institution || e.description),
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (e, update) => {
                    const startYear = formatMonthForDisplay(e.startYear);
                    const endYear = e.isCurrent
                      ? 'Present'
                      : formatMonthForDisplay(e.endYear);
                    const hasRange = Boolean(startYear || endYear);
                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">
                              {isEditor ? (
                                <EditableText
                                  value={e.degree}
                                  onChange={(value) =>
                                    update({ ...e, degree: value })
                                  }
                                  placeholder="Degree"
                                  ariaLabel="Degree"
                                />
                              ) : (
                                e.degree
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {isEditor ? (
                                <>
                                  <EditableText
                                    value={e.institution}
                                    onChange={(value) =>
                                      update({ ...e, institution: value })
                                    }
                                    placeholder="Institution"
                                    ariaLabel="Institution"
                                  />
                                  {' • '}
                                  <EditableText
                                    value={e.location}
                                    onChange={(value) =>
                                      update({ ...e, location: value })
                                    }
                                    placeholder="Location"
                                    ariaLabel="Location"
                                  />
                                </>
                              ) : (
                                <>
                                  {e.institution}
                                  {e.location ? ` • ${e.location}` : ''}
                                </>
                              )}
                            </p>
                          </div>
                          {isEditor ? (
                            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <EditableMonth
                                  value={e.startYear}
                                  onChange={(value) =>
                                    update({ ...e, startYear: value })
                                  }
                                  placeholder="Start"
                                  ariaLabel="Start year"
                                />
                                <span> – </span>
                                <EditableMonth
                                  value={e.endYear}
                                  onChange={(value) =>
                                    update({ ...e, endYear: value })
                                  }
                                  placeholder={
                                    e.isCurrent ? 'Present' : 'End'
                                  }
                                  ariaLabel="End year"
                                  disabled={e.isCurrent}
                                />
                              </div>
                              <EditableToggle
                                checked={e.isCurrent}
                                onChange={(checked) =>
                                  update({
                                    ...e,
                                    isCurrent: checked,
                                    endYear: checked ? '' : e.endYear,
                                  })
                                }
                                label="In progress"
                                ariaLabel="Education in progress"
                              />
                            </div>
                          ) : (
                            hasRange && (
                              <p className="text-[11px] text-slate-500">
                                {startYear}
                                {(endYear || e.isCurrent) && ' – '}
                                {endYear}
                              </p>
                            )
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-700">
                          {isEditor ? (
                            <EditableText
                              value={e.description}
                              onChange={(value) =>
                                update({ ...e, description: value })
                              }
                              multiline
                              placeholder="Honors, focus, thesis…"
                              ariaLabel="Education description"
                            />
                          ) : (
                            e.description && (
                              <div className="cv-markdown">
                                <ReactMarkdown
                                  skipHtml
                                  components={markdownComponents}
                                >
                                  {preserveBlankLines(e.description)}
                                </ReactMarkdown>
                              </div>
                            )
                          )}
                        </div>
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
                  addLabel: 'Add project',
                  entryLabel: 'project',
                  displayFilter: projectHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (p, update) =>
                    renderProjectLike(p, update, isEditor, 'Project'),
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
                  addLabel: 'Add achievement',
                  entryLabel: 'achievement',
                  displayFilter: achievementHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (a, update) => {
                    const date = formatMonthForDisplay(a.date);
                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">
                              {isEditor ? (
                                <EditableText
                                  value={a.name}
                                  onChange={(value) =>
                                    update({ ...a, name: value })
                                  }
                                  placeholder="Award name"
                                  ariaLabel="Award name"
                                />
                              ) : (
                                a.name
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {isEditor ? (
                                <EditableText
                                  value={a.organization}
                                  onChange={(value) =>
                                    update({ ...a, organization: value })
                                  }
                                  placeholder="Organization"
                                  ariaLabel="Organization"
                                />
                              ) : (
                                a.organization
                              )}
                            </p>
                          </div>
                          {isEditor ? (
                            <div className="text-[11px] text-slate-500">
                              <EditableMonth
                                value={a.date}
                                onChange={(value) =>
                                  update({ ...a, date: value })
                                }
                                placeholder="Date"
                                ariaLabel="Award date"
                              />
                            </div>
                          ) : (
                            date && (
                              <p className="text-[11px] text-slate-500">
                                {date}
                              </p>
                            )
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-700">
                          {isEditor ? (
                            <EditableText
                              value={a.context}
                              onChange={(value) =>
                                update({ ...a, context: value })
                              }
                              multiline
                              placeholder="Context (markdown)"
                              ariaLabel="Context"
                            />
                          ) : (
                            a.context && <p>{a.context}</p>
                          )}
                        </div>
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
                  addLabel: 'Add publication',
                  entryLabel: 'publication',
                  displayFilter: publicationHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (pub, update) => {
                    const publishedDate = formatMonthForDisplay(pub.year);
                    return (
                      <>
                        <p className="text-[12px] font-semibold">
                          {isEditor ? (
                            <EditableText
                              value={pub.title}
                              onChange={(value) =>
                                update({ ...pub, title: value })
                              }
                              placeholder="Publication title"
                              ariaLabel="Publication title"
                            />
                          ) : (
                            pub.title
                          )}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {isEditor ? (
                            <>
                              <EditableText
                                value={pub.venue}
                                onChange={(value) =>
                                  update({ ...pub, venue: value })
                                }
                                placeholder="Venue"
                                ariaLabel="Venue"
                              />
                              {' • '}
                              <EditableMonth
                                value={pub.year}
                                onChange={(value) =>
                                  update({ ...pub, year: value })
                                }
                                placeholder="Year"
                                ariaLabel="Publication year"
                              />
                            </>
                          ) : (
                            <>
                              {pub.venue}
                              {publishedDate ? ` • ${publishedDate}` : ''}
                            </>
                          )}
                        </p>
                        {isEditor ? (
                          <p className="text-[11px] text-slate-500">
                            <EditableText
                              value={pub.coAuthors}
                              onChange={(value) =>
                                update({ ...pub, coAuthors: value })
                              }
                              placeholder="Co-authors (optional)"
                              ariaLabel="Co-authors"
                            />
                          </p>
                        ) : (
                          pub.coAuthors && (
                            <p className="text-[11px] text-slate-500">
                              Co-authors: {pub.coAuthors}
                            </p>
                          )
                        )}
                        <p className="text-[11px] text-blue-600 break-all">
                          {isEditor ? (
                            <EditableText
                              value={pub.link}
                              onChange={(value) =>
                                update({ ...pub, link: value })
                              }
                              placeholder="https://"
                              ariaLabel="Link"
                              validate={validateOptionalUrl}
                            />
                          ) : (
                            pub.link &&
                            renderExternalLink(
                              pub.link,
                              pub.link,
                              'text-[11px] text-blue-600 break-all hover:underline',
                            )
                          )}
                        </p>
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
                  addLabel: 'Add talk',
                  entryLabel: 'talk',
                  displayFilter: talkHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (talk, update) => {
                    const talkDate = formatMonthForDisplay(talk.date);
                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">
                              {isEditor ? (
                                <EditableText
                                  value={talk.title}
                                  onChange={(value) =>
                                    update({ ...talk, title: value })
                                  }
                                  placeholder="Talk title"
                                  ariaLabel="Talk title"
                                />
                              ) : (
                                talk.title
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {isEditor ? (
                                <EditableText
                                  value={talk.event}
                                  onChange={(value) =>
                                    update({ ...talk, event: value })
                                  }
                                  placeholder="Event / conference"
                                  ariaLabel="Event"
                                />
                              ) : (
                                talk.event
                              )}
                            </p>
                          </div>
                          {isEditor ? (
                            <p className="text-[11px] text-slate-500 text-right">
                              <EditableText
                                value={talk.role}
                                onChange={(value) =>
                                  update({ ...talk, role: value })
                                }
                                placeholder="Role"
                                ariaLabel="Talk role"
                              />
                              {' • '}
                              <EditableMonth
                                value={talk.date}
                                onChange={(value) =>
                                  update({ ...talk, date: value })
                                }
                                placeholder="Date"
                                ariaLabel="Talk date"
                              />
                            </p>
                          ) : (
                            (talkDate || talk.role) && (
                              <p className="text-[11px] text-slate-500 text-right">
                                {talk.role && `${talk.role}`}
                                {talk.role && talkDate ? ' • ' : ''}
                                {talkDate}
                              </p>
                            )
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 break-all">
                          {isEditor ? (
                            <EditableText
                              value={talk.locationOrLink}
                              onChange={(value) =>
                                update({ ...talk, locationOrLink: value })
                              }
                              placeholder="Location or link"
                              ariaLabel="Location or link"
                            />
                          ) : (
                            talk.locationOrLink &&
                            (looksLikeUrl(talk.locationOrLink) ? (
                              renderExternalLink(
                                talk.locationOrLink,
                                talk.locationOrLink,
                                'text-[11px] text-blue-600 break-all hover:underline',
                              )
                            ) : (
                              talk.locationOrLink
                            ))
                          )}
                        </p>
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
                  addLabel: 'Add volunteer experience',
                  entryLabel: 'volunteer entry',
                  displayFilter: volunteerHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (v, update) => {
                    const startDate = formatMonthForDisplay(v.startDate);
                    const endDate = v.isCurrent
                      ? 'Present'
                      : formatMonthForDisplay(v.endDate);
                    const hasRange = Boolean(startDate || endDate);
                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">
                              {isEditor ? (
                                <EditableText
                                  value={v.role}
                                  onChange={(value) =>
                                    update({ ...v, role: value })
                                  }
                                  placeholder="Volunteer role"
                                  ariaLabel="Volunteer role"
                                />
                              ) : (
                                v.role
                              )}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {isEditor ? (
                                <>
                                  <EditableText
                                    value={v.organization}
                                    onChange={(value) =>
                                      update({ ...v, organization: value })
                                    }
                                    placeholder="Organization"
                                    ariaLabel="Organization"
                                  />
                                  {' • '}
                                  <EditableText
                                    value={v.location}
                                    onChange={(value) =>
                                      update({ ...v, location: value })
                                    }
                                    placeholder="Location"
                                    ariaLabel="Location"
                                  />
                                </>
                              ) : (
                                <>
                                  {v.organization}
                                  {v.location ? ` • ${v.location}` : ''}
                                </>
                              )}
                            </p>
                          </div>
                          {isEditor ? (
                            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <EditableMonth
                                  value={v.startDate}
                                  onChange={(value) =>
                                    update({ ...v, startDate: value })
                                  }
                                  placeholder="Start"
                                  ariaLabel="Start date"
                                />
                                <span> – </span>
                                <EditableMonth
                                  value={v.endDate}
                                  onChange={(value) =>
                                    update({ ...v, endDate: value })
                                  }
                                  placeholder={
                                    v.isCurrent ? 'Present' : 'End'
                                  }
                                  ariaLabel="End date"
                                  disabled={v.isCurrent}
                                />
                              </div>
                              <EditableToggle
                                checked={v.isCurrent}
                                onChange={(checked) =>
                                  update({
                                    ...v,
                                    isCurrent: checked,
                                    endDate: checked ? '' : v.endDate,
                                  })
                                }
                                label="Ongoing"
                                ariaLabel="Volunteering ongoing"
                              />
                            </div>
                          ) : (
                            hasRange && (
                              <p className="text-[11px] text-slate-500">
                                {startDate}
                                {(endDate || v.isCurrent) && ' – '}
                                {endDate}
                              </p>
                            )
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-700 whitespace-pre-line">
                          {isEditor ? (
                            <EditableText
                              value={v.responsibilities}
                              onChange={(value) =>
                                update({ ...v, responsibilities: value })
                              }
                              multiline
                              placeholder="Responsibilities (markdown)"
                              ariaLabel="Responsibilities"
                            />
                          ) : (
                            v.responsibilities && <span>{v.responsibilities}</span>
                          )}
                        </div>
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
                  addLabel: 'Add contribution',
                  entryLabel: 'contribution',
                  displayFilter: projectHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (c, update) =>
                    renderProjectLike(c, update, isEditor, 'Project'),
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
                  addLabel: 'Add skill',
                  entryLabel: 'skill',
                  displayFilter: skillHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (skill, update) =>
                    isEditor ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                        <EditableText
                          value={skill.name}
                          onChange={(value) =>
                            update({ ...skill, name: value })
                          }
                          placeholder="Skill"
                          ariaLabel="Skill name"
                        />
                        <span>–</span>
                        <EditableSelect<SkillLevel>
                          value={skill.level}
                          options={SKILL_LEVEL_OPTIONS}
                          onChange={(level) => update({ ...skill, level })}
                          placeholder="Level"
                          ariaLabel="Skill level"
                          allowEmpty
                        />
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                        {skill.name}
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
                  addLabel: 'Add language',
                  entryLabel: 'language',
                  displayFilter: languageHasContent,
                  isEditor,
                  ...sectionMoveHandlers,
                  renderEntry: (language, update) =>
                    isEditor ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                        <EditableText
                          value={language.name}
                          onChange={(value) =>
                            update({ ...language, name: value })
                          }
                          placeholder="Language"
                          ariaLabel="Language name"
                        />
                        <span>–</span>
                        <EditableSelect<LanguageLevel>
                          value={language.level}
                          options={LANGUAGE_LEVEL_OPTIONS}
                          onChange={(level) =>
                            update({
                              ...language,
                              level: level ?? 'Professional',
                            })
                          }
                          placeholder="Level"
                          ariaLabel="Language level"
                        />
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                        {language.name} – {language.level}
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
                  addLabel: 'Add entry',
                  entryLabel: 'custom section body',
                  isEditor,
                  ...sectionMoveHandlers,
                  title: isEditor ? (
                    <EditableText
                      value={section.title}
                      onChange={(value) => {
                        editor?.onUpdate({
                          ...cv,
                          customSections: cv.customSections.map((existing) =>
                            existing.id === section.id
                              ? { ...existing, title: value }
                              : existing,
                          ),
                        });
                      }}
                      placeholder="Custom section"
                      ariaLabel="Section title"
                    />
                  ) : (
                    section.title || 'Custom section'
                  ),
                  renderEntry: (s, update) =>
                    isEditor ? (
                      <div className="text-[11px] text-slate-700">
                        <EditableText
                          value={s.body}
                          onChange={(value) => update({ ...s, body: value })}
                          multiline
                          placeholder="Body (markdown)"
                          ariaLabel="Custom section body"
                        />
                      </div>
                    ) : s.body ? (
                      <div className="text-[11px] text-slate-700">
                        <div className="cv-markdown">
                          <ReactMarkdown skipHtml components={markdownComponents}>
                            {preserveBlankLines(s.body)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : null,
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
  );
};

