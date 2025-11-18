import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { CvData, SectionId } from '../types';

const hasMeaningfulExperience = (experience: CvData['experience']): boolean =>
  experience.some((e) => e.jobTitle.trim() && e.company.trim());

const hasMeaningfulEducation = (education: CvData['education']): boolean =>
  education.some((e) => e.degree.trim() && e.institution.trim());

export interface CvPreviewProps {
  cv: CvData;
}

const PRINT_PAGE_WIDTH = 794; // px at 96dpi for A4 width
const PRINT_PAGE_HEIGHT = 1123; // px at 96dpi for A4 height

export const CvPreview: React.FC<CvPreviewProps> = ({ cv }) => {
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
  const [pageIndex, setPageIndex] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(PRINT_PAGE_WIDTH);
  const [displayPageHeight, setDisplayPageHeight] = useState(
    PRINT_PAGE_HEIGHT,
  );
  const [displayContentHeight, setDisplayContentHeight] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    let mediaQuery: MediaQueryList | null = null;
    let handleChange: ((event: MediaQueryListEvent) => void) | null = null;
    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('print');
      handleChange = (event: MediaQueryListEvent) =>
        setIsPrinting(event.matches);
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
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
          style={{
            transform: `translateY(-${pageShift}px)`,
            height: isPrinting ? 'auto' : '100%',
          }}
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
                {personalInfo.email}
              </p>
            )}
            {personalInfo.phone && (
              <p className="truncate">
                <span className="font-medium text-slate-700">Phone:</span>{' '}
                {personalInfo.phone}
              </p>
            )}
            {personalInfo.location && (
              <p className="truncate">
                <span className="font-medium text-slate-700">Location:</span>{' '}
                {personalInfo.location}
              </p>
            )}
            {personalInfo.website && (
              <p className="break-all">
                <span className="font-medium text-slate-700">Portfolio:</span>{' '}
                {personalInfo.website}
              </p>
            )}
            {personalInfo.linkedin && (
              <p className="break-all">
                <span className="font-medium text-slate-700">LinkedIn:</span>{' '}
                {personalInfo.linkedin}
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
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
              return (
                <section key="experience">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Experience
                  </h2>
                  {hasExperience ? (
                    <div className="space-y-2">
                      {experience
                        .filter((e) => e.jobTitle || e.company || e.description)
                        .map((e) => (
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
                              {(e.startDate || e.endDate || e.isCurrent) && (
                                <p className="text-[11px] text-slate-500">
                                  {e.startDate}
                                  {e.startDate || e.endDate || e.isCurrent ? ' – ' : ''}
                                  {e.isCurrent ? 'Present' : e.endDate}
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
                        ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Add your job experience here to show it on your CV.
                    </p>
                  )}
                </section>
              );
            }

            if (id === 'education') {
              return (
                <section key="education">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Education
                  </h2>
                  {hasEducation ? (
                    <div className="space-y-2">
                      {education
                        .filter((e) => e.degree || e.institution || e.description)
                        .map((e) => (
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
                              {(e.startYear || e.endYear || e.isCurrent) && (
                                <p className="text-[11px] text-slate-500">
                                  {e.startYear}
                                  {e.startYear || e.endYear || e.isCurrent ? ' – ' : ''}
                                  {e.isCurrent ? 'Present' : e.endYear}
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
                        ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Add your education to show it on your CV.
                    </p>
                  )}
                </section>
              );
            }

            if (id === 'projects') {
              return (
                <section key="projects">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Projects
                  </h2>
                  {projects.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add your projects to show them here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {projects
                        .filter((p) => p.name || p.description || p.achievements)
                        .map((p) => (
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
                              {p.link && (
                                <p className="text-[11px] text-slate-500 break-all">
                                  {p.link}
                                </p>
                              )}
                            </div>
                            {p.description && (
                              <div className="mt-1 text-[11px] text-slate-700">
                                <ReactMarkdown skipHtml>
                                  {p.description}
                                </ReactMarkdown>
                              </div>
                            )}
                            {p.achievements && (
                              <div className="mt-1 text-[11px] text-slate-700">
                                <ReactMarkdown skipHtml>
                                  {p.achievements}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id === 'achievements') {
              return (
                <section key="achievements">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Achievements / Awards
                  </h2>
                  {achievements.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add your notable achievements or awards to show them here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {achievements
                        .filter((a) => a.name || a.organization || a.context)
                        .map((a) => (
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
                              {a.date && (
                                <p className="text-[11px] text-slate-500">
                                  {a.date}
                                </p>
                              )}
                            </div>
                            {a.context && (
                              <p className="mt-1 text-[11px] text-slate-700">
                                {a.context}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id === 'publications') {
              return (
                <section key="publications">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Publications
                  </h2>
                  {publications.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add publications to show them here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {publications.map((pub) => (
                        <div key={pub.id}>
                          <p className="text-[12px] font-semibold">
                            {pub.title || 'Publication'}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {pub.venue}
                            {pub.year ? ` • ${pub.year}` : ''}
                          </p>
                          {pub.coAuthors && (
                            <p className="text-[11px] text-slate-500">
                              Co-authors: {pub.coAuthors}
                            </p>
                          )}
                          {pub.link && (
                            <p className="text-[11px] text-slate-500 break-all">
                              {pub.link}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id === 'talks') {
              return (
                <section key="talks">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Talks / Conferences / Workshops
                  </h2>
                  {talks.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add talks or conferences to show them here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {talks.map((talk) => (
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
                            {(talk.date || talk.role) && (
                              <p className="text-[11px] text-slate-500 text-right">
                                {talk.role && `${talk.role}`}
                                {talk.role && talk.date ? ' • ' : ''}
                                {talk.date}
                              </p>
                            )}
                          </div>
                          {talk.locationOrLink && (
                            <p className="text-[11px] text-slate-500 break-all">
                              {talk.locationOrLink}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id === 'volunteer') {
              return (
                <section key="volunteer">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Volunteer Experience
                  </h2>
                  {volunteer.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add volunteer roles to show them here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {volunteer.map((v) => (
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
                            {(v.startDate || v.endDate || v.isCurrent) && (
                              <p className="text-[11px] text-slate-500">
                                {v.startDate}
                                {v.startDate || v.endDate || v.isCurrent ? ' – ' : ''}
                                {v.isCurrent ? 'Present' : v.endDate}
                              </p>
                            )}
                          </div>
                          {v.responsibilities && (
                            <p className="mt-1 text-[11px] text-slate-700 whitespace-pre-line">
                              {v.responsibilities}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id === 'opensource') {
              return (
                <section key="opensource">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Open Source Contributions
                  </h2>
                  {openSource.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add open source contributions to show them here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {openSource.map((c) => (
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
                            {c.link && (
                              <p className="text-[11px] text-slate-500 break-all">
                                {c.link}
                              </p>
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
                  )}
                </section>
              );
            }

            if (id === 'skills') {
              return (
                <section key="skills">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </h2>
                  {skills.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add your skills to show them here.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]"
                        >
                          {skill.name}
                          {skill.level ? ` – ${skill.level}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id === 'languages') {
              return (
                <section key="languages">
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Languages
                  </h2>
                  {languages.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Add languages to show them here.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {languages.map((language) => (
                        <span
                          key={language.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]"
                        >
                          {language.name} – {language.level}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              );
            }

            if (id.startsWith('custom:')) {
              const customId = id.replace('custom:', '');
              const section = customSections.find((s) => s.id === customId);
              if (!section) return null;

              return (
                <section key={id}>
                  <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {section.title || 'Custom section'}
                  </h2>
                  {section.body ? (
                    <div className="text-[11px] text-slate-700">
                      <ReactMarkdown skipHtml>{section.body}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Add content to this section to show it here.
                    </p>
                  )}
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
