import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { CvData, SectionId, FontSettings } from '../types';
import { formatMonthForDisplay } from '../utils/dateFields';

const hasText = (value?: string | null): boolean =>
  Boolean(value && value.trim().length > 0);

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

export interface CvPreviewProps {
  cv: CvData;
  fontSettings: FontSettings;
}

const PRINT_PAGE_WIDTH = 794; // px at 96dpi for A4 width
const PRINT_PAGE_HEIGHT = 1123; // px at 96dpi for A4 height

export const CvPreview: React.FC<CvPreviewProps> = ({ cv, fontSettings }) => {
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
  const printContentHeight = displayContentHeight / widthRatio;
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
  const pageShift = isPrinting ? 0 : pageIndex * displayPageHeight;
  const pxToRem = (value: number) => `${Math.max(0, value) / 16}rem`;
  const fontVariableStyles = {
    '--font-full-name': pxToRem(fontSettings.fullName),
    '--font-section-title': pxToRem(fontSettings.sectionTitle),
    '--font-section-item-title': pxToRem(fontSettings.sectionItemTitle),
    '--font-section-detail': pxToRem(fontSettings.sectionDetail),
  } as React.CSSProperties;
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

  const contentStyles: React.CSSProperties = {
    height: isPrinting ? 'auto' : '100%',
    ...fontVariableStyles,
  };

  if (!isPrinting) {
    contentStyles.transform = `translateY(-${pageShift}px)`;
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden print:h-auto print:overflow-visible"
        style={{
          height: displayPageHeight || PRINT_PAGE_HEIGHT,
        }}
      >
        <div
          ref={contentRef}
          className="cv-preview-content flex flex-col text-xs leading-relaxed text-slate-900 transition-transform duration-200 print:transition-none"
          style={contentStyles}
        >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:gap-[0.9rem]">
        <div className="flex items-center gap-4">
          {personalInfo.photoDataUrl && (
            <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
              <img
                src={personalInfo.photoDataUrl}
                alt={personalInfo.fullName || 'Profile photo'}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {personalInfo.fullName || 'Your full name'}
            </h1>
            <p className="text-[11px] text-slate-500">
              {personalInfo.jobTitle || 'Job title or professional headline'}
            </p>
          </div>
        </div>
        <div className="flex flex-1 justify-end">
          <div className="grid w-full max-w-md grid-cols-1 gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
            {personalInfo.email && (
              <p className="truncate">
                <span className="font-medium text-slate-700">Email:</span>{' '}
                <a
                  href={`mailto:${personalInfo.email.trim()}`}
                  className="break-all text-blue-600 hover:underline"
                >
                  {personalInfo.email}
                </a>
              </p>
            )}
            {personalInfo.phone && (
              <p className="truncate">
                <span className="font-medium text-slate-700">Phone:</span>{' '}
                <a
                  href={`tel:${formatTelHref(personalInfo.phone)}`}
                  className="break-all text-blue-600 hover:underline"
                >
                  {personalInfo.phone}
                </a>
              </p>
            )}
            {personalInfo.location && (
              <p className="truncate">
                <span className="font-medium text-slate-700">Location:</span>{' '}
                {personalInfo.location}
              </p>
            )}
            {ensureUrlProtocol(personalInfo.website) && (
              <p className="break-all">
                <span className="font-medium text-slate-700">Portfolio:</span>{' '}
                {renderExternalLink(personalInfo.website)}
              </p>
            )}
            {ensureUrlProtocol(personalInfo.linkedin) && (
              <p className="break-all">
                <span className="font-medium text-slate-700">LinkedIn:</span>{' '}
                {renderExternalLink(personalInfo.linkedin, personalInfo.linkedin)}
              </p>
            )}
            {!personalInfo.email &&
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

      <div className="mt-4 space-y-4">
        {personalInfo.summary && (
          <section>
            <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
              Professional Summary
            </h2>
            <div className="text-[11px] text-slate-700">
              <ReactMarkdown skipHtml>{personalInfo.summary}</ReactMarkdown>
            </div>
          </section>
        )}

        {sectionsOrder.map((id: SectionId) => {
            if (id === 'personal') {
              // Personal info already rendered as header.
              return null;
            }

            if (id === 'experience') {
              if (!hasExperience) {
                return null;
              }
              return (
                <section key="experience">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Experience
                  </h2>
                  <div className="space-y-2">
                      {experience
                        .filter((e) => e.jobTitle || e.company || e.description)
                        .map((e) => {
                          const startDate = formatMonthForDisplay(e.startDate);
                          const endDate = e.isCurrent
                            ? 'Present'
                            : formatMonthForDisplay(e.endDate);
                          const hasRange = Boolean(startDate || endDate);
                          return (
                            <div key={e.id}>
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-[12px] font-semibold">
                                    {e.jobTitle || 'Job title'}
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
                                  <ReactMarkdown skipHtml>
                                    {e.description}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                          );
                        })}
                  </div>
                </section>
              );
            }

            if (id === 'education') {
              if (!hasEducation) {
                return null;
              }
              return (
                <section key="education">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Education
                  </h2>
                  <div className="space-y-2">
                      {education
                        .filter((e) => e.degree || e.institution || e.description)
                        .map((e) => {
                          const startYear = formatMonthForDisplay(e.startYear);
                          const endYear = e.isCurrent
                            ? 'Present'
                            : formatMonthForDisplay(e.endYear);
                          const hasRange = Boolean(startYear || endYear);
                          return (
                            <div key={e.id}>
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-[12px] font-semibold">
                                    {e.degree || 'Degree'}
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
                                  <ReactMarkdown skipHtml>
                                    {e.description}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                          );
                        })}
                  </div>
                </section>
              );
            }

            if (id === 'projects') {
              if (!hasProjects) {
                return null;
              }
              return (
                <section key="projects">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Projects
                  </h2>
                  <div className="space-y-2">
                    {projects.filter(projectHasContent).map((p) => (
                      <div key={p.id}>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {p.name || 'Project'}
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
                            <ReactMarkdown skipHtml>{p.description}</ReactMarkdown>
                          </div>
                        )}
                        {p.achievements && (
                          <div className="mt-1 text-[11px] text-slate-700">
                            <ReactMarkdown skipHtml>{p.achievements}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'achievements') {
              if (!hasAchievements) {
                return null;
              }
              return (
                <section key="achievements">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Achievements / Awards
                  </h2>
                  <div className="space-y-2">
                    {achievements.filter(achievementHasContent).map((a) => {
                      const date = formatMonthForDisplay(a.date);
                      return (
                        <div key={a.id}>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-[12px] font-semibold">
                                {a.name || 'Award'}
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (id === 'publications') {
              if (!hasPublications) {
                return null;
              }
              return (
                <section key="publications">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Publications
                  </h2>
                  <div className="space-y-2">
                    {publications.filter(publicationHasContent).map((pub) => {
                      const publishedDate = formatMonthForDisplay(pub.year);
                      return (
                        <div key={pub.id}>
                          <p className="text-[12px] font-semibold">
                            {pub.title || 'Publication'}
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (id === 'talks') {
              if (!hasTalks) {
                return null;
              }
              return (
                <section key="talks">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Talks / Conferences / Workshops
                  </h2>
                  <div className="space-y-2">
                    {talks.filter(talkHasContent).map((talk) => {
                      const talkDate = formatMonthForDisplay(talk.date);
                      return (
                        <div key={talk.id}>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-[12px] font-semibold">
                                {talk.title || 'Talk'}
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (id === 'volunteer') {
              if (!hasVolunteer) {
                return null;
              }
              return (
                <section key="volunteer">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Volunteer Experience
                  </h2>
                  <div className="space-y-2">
                    {volunteer.filter(volunteerHasContent).map((v) => {
                      const startDate = formatMonthForDisplay(v.startDate);
                      const endDate = v.isCurrent
                        ? 'Present'
                        : formatMonthForDisplay(v.endDate);
                      const hasRange = Boolean(startDate || endDate);
                      return (
                        <div key={v.id}>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-[12px] font-semibold">
                                {v.role || 'Volunteer role'}
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (id === 'opensource') {
              if (!hasOpenSource) {
                return null;
              }
              return (
                <section key="opensource">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Open Source Contributions
                  </h2>
                  <div className="space-y-2">
                    {openSource.filter(projectHasContent).map((c) => (
                      <div key={c.id}>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[12px] font-semibold">
                              {c.name || 'Project'}
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
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'skills') {
              if (!hasSkills) {
                return null;
              }
              return (
                <section key="skills">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-1">
                    {skills.filter(skillHasContent).map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]"
                      >
                        {skill.name}
                        {skill.level ? ` – ${skill.level}` : ''}
                      </span>
                    ))}
                  </div>
                </section>
              );
            }

            if (id === 'languages') {
              if (!hasLanguages) {
                return null;
              }
              return (
                <section key="languages">
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-1">
                    {languages.filter(languageHasContent).map((language) => (
                      <span
                        key={language.id}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]"
                      >
                        {language.name} – {language.level}
                      </span>
                    ))}
                  </div>
                </section>
              );
            }

            if (id.startsWith('custom:')) {
              const customId = id.replace('custom:', '');
              const section = customSections.find((s) => s.id === customId);
              if (!section || !hasText(section.body)) return null;

              return (
                <section key={id}>
                  <h2 className="mb-1 font-section-title font-semibold uppercase tracking-wide text-slate-500">
                    {section.title || 'Custom section'}
                  </h2>
                  <div className="text-[11px] text-slate-700">
                    <ReactMarkdown skipHtml>{section.body}</ReactMarkdown>
                  </div>
                </section>
              );
            }

            return null;
          })}
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

