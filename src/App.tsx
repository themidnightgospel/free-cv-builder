import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { CvData, CvSectionKey, FontSettings, SectionId } from './types';
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
import { PhotoCropModal } from './components/PhotoCropModal';
import { useConfirmDialog } from './components/ConfirmDialogProvider';
import { encodeCvPayloadForText } from './pdf/encodeCvPayload';
import {
  extractEmbeddedCvJsonFromPdf,
  extractProfileImageFromPdf,
} from './pdf/pdfExtraction';
import { PdfPayloadPortal, PdfPayloadPrintBlock } from './pdf/PdfPayloadEmbed';
import {
  CURRENT_CV_ID_STORAGE_KEY,
  getCvDisplayName,
  type SavedCvRecord,
} from './state/cvStorage';
import {
  createEmptyAchievement,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProject,
  createInitialCv,
  hasMeaningfulCv,
  hasMeaningfulAchievements,
  hasMeaningfulEducation,
  hasMeaningfulExperience,
  hasMeaningfulProjects,
  hasMeaningfulVolunteer,
  isCustomSectionId,
  normalizeCvData,
  DEFAULT_FONT_SETTINGS,
  sectionLabel,
  validatePersonalInfo,
} from './state/cvModel';
import { useToast } from './components/toast/ToastProvider';
import {
  persistCurrentCvId,
  readSavedCvsFromStorage,
  writeSavedCvsToStorage,
  useCvPersistence,
} from './state/useCvPersistence';
import { usePdfExport } from './pdf/usePdfExport';
import { createSampleCv } from './state/sampleCv';
import { generateId } from './utils/uuid';
import { sectionsSidebarArrowButton } from './components/iconButtonStyles';

declare global {
  interface Window {
    fillForm?: () => void;
  }
}

const PREVIEW_SURFACE_CLASSNAMES =
  'relative mx-auto aspect-[1/1.4142] w-full max-w-full bg-white shadow-sm border border-slate-200 px-8 py-6 text-slate-900 print:mx-0 print:w-full print:max-w-none print:shadow-none print:border-0 print:max-h-none print:aspect-auto print:p-8';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'landing' | 'editor'>('landing');
  const [cv, setCv] = useState<CvData>(() => createInitialCv());
  const [activeSection, setActiveSection] = useState<SectionId>('personal');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [photoCropImageSrc, setPhotoCropImageSrc] = useState<string | null>(null);
  const [draggingSectionId, setDraggingSectionId] = useState<SectionId | null>(
    null,
  );
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<
    'sections' | 'preview'
  >('sections');
  const [isAddSectionMenuOpen, setIsAddSectionMenuOpen] = useState(false);
  const confirmDialog = useConfirmDialog();
  const { addToast } = useToast();
  const {
    currentCvId,
    savedCvs,
    hasUnsavedChanges,
    setCurrentCvId,
    setSavedCvs,
  } = useCvPersistence(cv, mode);
  const { isPreparingPdf, pendingPrintJob, downloadCvPdf } = usePdfExport(addToast);
  const fontSettings = cv.fontSettings;
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const addSectionMenuRef = useRef<HTMLDivElement | null>(null);
  const cvUploadInputRef = useRef<HTMLInputElement>(null);
  const activeCvEmbeddedPayload = useMemo(() => {
    try {
      return encodeCvPayloadForText(cv);
    } catch (error) {
      console.error(error);
      return '';
    }
  }, [cv]);
  const printJobEmbeddedPayload = useMemo(() => {
    if (!pendingPrintJob) return '';
    try {
      return encodeCvPayloadForText(pendingPrintJob.cv);
    } catch (error) {
      console.error(error);
      return '';
    }
  }, [pendingPrintJob]);
  const printablePayload = pendingPrintJob
    ? printJobEmbeddedPayload
    : activeCvEmbeddedPayload;
  const addSectionOptions: { id: CvSectionKey | 'custom'; label: string }[] =
    useMemo(
      () => [
        { id: 'projects', label: sectionLabel.projects },
        { id: 'experience', label: sectionLabel.experience },
        { id: 'education', label: sectionLabel.education },
        { id: 'skills', label: sectionLabel.skills },
        { id: 'languages', label: sectionLabel.languages },
        { id: 'volunteer', label: sectionLabel.volunteer },
        { id: 'opensource', label: sectionLabel.opensource },
        { id: 'achievements', label: sectionLabel.achievements },
        { id: 'publications', label: sectionLabel.publications },
        { id: 'talks', label: sectionLabel.talks },
        { id: 'custom', label: 'Custom' },
      ],
      [],
    );
  const fontControlSections: {
    id: string;
    title: string;
    controls: {
      key: keyof FontSettings;
      label: string;
      helper: string;
      step?: number;
    }[];
  }[] = [
    {
      id: 'personal-info',
      title: 'Personal Info Options',
      controls: [
        {
          key: 'fullName',
          label: 'Full name font size',
          helper: 'Controls the hero name in the header.',
          step: 2,
        },
        {
          key: 'jobTitle',
          label: 'Job title font size',
          helper: 'Applies to the role beneath your name.',
          step: 1,
        },
        {
          key: 'contactDetail',
          label: 'Contact details font size',
          helper: 'Email, phone, links in header column 3.',
          step: 1,
        },
      ],
    },
    {
      id: 'sections',
      title: 'Section Typography',
      controls: [
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
      ],
    },
  ];

  const handleFontSettingChange = (
    key: keyof FontSettings,
    value: number,
  ) => {
    const nextValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setCv((prev) => ({
      ...prev,
      fontSettings: { ...prev.fontSettings, [key]: nextValue },
    }));
  };
  const adjustFontSetting = (
    key: keyof FontSettings,
    delta: number,
  ) => {
    setCv((prev) => {
      const current = prev.fontSettings[key];
      const nextValue = Math.max(
        0,
        Math.round((current + delta) * 10) / 10,
      );
      return {
        ...prev,
        fontSettings: { ...prev.fontSettings, [key]: nextValue },
      };
    });
  };
  useEffect(() => {
    if (!isAddSectionMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addSectionMenuRef.current &&
        !addSectionMenuRef.current.contains(event.target as Node)
      ) {
        setIsAddSectionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddSectionMenuOpen]);
  useEffect(() => {
    window.fillForm = () => {
      const newId = generateId();
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
    const normalizedRecords = storedRecords
      .map((record) => {
        const normalizedCv = normalizeCvData(record.cv);
        if (!normalizedCv) return null;
        return { ...record, cv: normalizedCv };
      })
      .filter((record): record is SavedCvRecord => Boolean(record));
    setSavedCvs(normalizedRecords);
    const fallbackId =
      [...normalizedRecords].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ||
      null;
    const preferredId =
      window.localStorage.getItem(CURRENT_CV_ID_STORAGE_KEY) || fallbackId;
    if (preferredId) {
      const match = normalizedRecords.find((entry) => entry.id === preferredId);
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

  const importCvFromJsonText = (
    jsonText: string,
    sourceLabel: string,
    photoDataUrl?: string | null,
  ) => {
    const parsed = JSON.parse(jsonText);
    const normalized = normalizeCvData(parsed);
    if (!normalized) {
      throw new Error('Invalid CV JSON structure');
    }
    const nextCv =
      photoDataUrl && !normalized.personalInfo.photoDataUrl
        ? {
            ...normalized,
            personalInfo: { ...normalized.personalInfo, photoDataUrl },
          }
        : normalized;
    const newId = generateId();
    setCurrentCvId(newId);
    persistCurrentCvId(newId);
    setCv(nextCv);
    setMode('editor');
    setActiveSection('personal');
    setActiveWorkspaceView('sections');
    setShowValidationModal(false);
    setValidationErrors([]);
    addToast(`CV loaded from ${sourceLabel}.`, 'success');
  };

  const handlePdfUploadChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const cloneBytes = () => new Uint8Array(bytes);
      const photoFromPdfPromise = extractProfileImageFromPdf(cloneBytes()).catch(
        () => null,
      );

      const jsonText = await extractEmbeddedCvJsonFromPdf(cloneBytes());
      if (!jsonText) {
        setImportError(
          'This CV must be created using Free CV Builder. Please upload a PDF exported from Free CV Builder.',
        );
        return;
      }

      const photoDataUrl = await photoFromPdfPromise;
      importCvFromJsonText(jsonText, 'PDF file', photoDataUrl || undefined);
    } catch (error) {
      console.error(error);
      setImportError(
        'This CV must be created using Free CV Builder. Please upload a PDF exported from Free CV Builder.',
      );
    } finally {
      event.target.value = '';
    }
  };;

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

  const handleCreateNew = () => {
    const newId = generateId();
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
    const normalizedCv = normalizeCvData(record.cv) ?? createInitialCv();
    setCv(normalizedCv);
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
      const newId = generateId();
      setCurrentCvId(newId);
      persistCurrentCvId(newId);
    }
    addToast(`Deleted "${name}".`, 'info');
  };

  const handleAddSection = (sectionId: CvSectionKey) => {
    if (sectionId === 'personal') return;
    setCv((prev) => {
      if (prev.sectionsOrder.includes(sectionId)) return prev;
      return { ...prev, sectionsOrder: [...prev.sectionsOrder, sectionId] };
    });
    setActiveSection(sectionId);
    setIsAddSectionMenuOpen(false);
  };

  const handleRemoveSection = (sectionId: SectionId) => {
    if (sectionId === 'personal') return;
    let nextActive: SectionId | null = null;
    setCv((prev) => {
      if (!prev.sectionsOrder.includes(sectionId)) return prev;
      const nextSectionsOrder = prev.sectionsOrder.filter(
        (id) => id !== sectionId,
      );
      const nextCustomSections = isCustomSectionId(sectionId)
        ? prev.customSections.filter(
            (section) => `custom:${section.id}` !== sectionId,
          )
        : prev.customSections;

      if (activeSection === sectionId) {
        nextActive =
          (nextSectionsOrder.find((id) => id !== 'personal') ??
            nextSectionsOrder[0]) || 'personal';
      }

      return {
        ...prev,
        customSections: nextCustomSections,
        sectionsOrder: nextSectionsOrder,
      };
    });
    if (nextActive) {
      setActiveSection(nextActive);
    }
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
    setIsAddSectionMenuOpen(false);
  };

  const reorderSections = (sourceId: SectionId, targetId: SectionId) => {
    if (sourceId === targetId) return;
    if (sourceId === 'personal' || targetId === 'personal') return;
    setCv((prev) => {
      const order = [...prev.sectionsOrder];
      const fromIndex = order.indexOf(sourceId);
      const toIndex = order.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, sourceId);
      const personalIndex = order.indexOf('personal');
      if (personalIndex > 0) {
        order.splice(personalIndex, 1);
        order.unshift('personal');
      }
      return { ...prev, sectionsOrder: order };
    });
  };

  const handleDownloadPdf = async () => {
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

    await downloadCvPdf(cv, getCvDisplayName(cv));
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoCropImageSrc(reader.result);
      } else {
        addToast('Could not read photo file. Please try another image.', 'error');
      }
    };
    reader.onerror = () =>
      addToast('Could not read photo file. Please try again.', 'error');
    reader.readAsDataURL(file);
  };

  const handlePhotoCropSave = (dataUrl: string) => {
    setCv((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        photoDataUrl: dataUrl,
      },
    }));
    setPhotoCropImageSrc(null);
  };

  const handlePhotoCropCancel = () => {
    setPhotoCropImageSrc(null);
  };

  const importErrorModal = importError && (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-base font-semibold text-slate-900">
          Cannot load CV from PDF
        </h2>
        <p className="mb-4 text-sm text-slate-600">{importError}</p>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => setImportError(null)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );

  const header = (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200/80 bg-canvas/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-full p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink"
            onClick={() => {
              setMode('landing');
            }}
            aria-label="Back to start"
            title="Back to start"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="hidden h-5 w-px bg-slate-200 sm:block" />
          <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M4.5 3A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 3h-11ZM7 7.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 7.25Zm.75 2.75a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm0 3.25a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              freecv
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              hasUnsavedChanges
                ? 'bg-amber-100/70 text-amber-800'
                : 'bg-accent-soft text-accent-dark'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasUnsavedChanges ? 'bg-amber-500' : 'bg-accent'
              }`}
            />
            {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
          </span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPreparingPdf}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper shadow-soft transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            {isPreparingPdf ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
        {importError && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-2 text-base font-semibold text-slate-900">
                Cannot load CV from PDF
              </h2>
              <p className="mb-4 text-sm text-slate-600">{importError}</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => setImportError(null)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );

  if (mode === 'landing') {
    const nonEmptySavedCvs = [...savedCvs].filter((record) =>
      hasMeaningfulCv(record.cv),
    );

    return (
      <>
        <PdfPayloadPortal payload={printablePayload} />
        <PdfPayloadPrintBlock payload={printablePayload} />
        {importErrorModal}
        <div className="relative min-h-screen overflow-hidden bg-canvas px-4 py-14 sm:py-20">
          {/* Soft ambient color blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-accent/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-amber-200/30 blur-3xl"
          />

          <div className="relative mx-auto w-full max-w-md">
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-paper/70 px-3 py-1 text-[11px] font-medium text-muted shadow-soft backdrop-blur">
                <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
                Open source · MIT
              </span>
              <h1 className="mt-6 text-[44px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[52px]">
                Free CV builder
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
                Make a clean, professional CV in a few minutes. Download as PDF.
                No account. No tracking. No surprises.
              </p>
              <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                {[
                  'No paywall',
                  'No signup',
                  'No data harvesting',
                  'No watermarks',
                ].map((label) => (
                  <li key={label} className="inline-flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 text-accent"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.59a.75.75 0 0 1-1.07.005l-3.75-3.75a.75.75 0 1 1 1.06-1.06l3.213 3.213 6.97-7.052a.75.75 0 0 1 1.061-.006Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-paper p-5 shadow-soft">
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-medium text-paper shadow-soft transition hover:bg-accent-dark"
                >
                  Create new CV
                  <span className="transition group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => cvUploadInputRef.current?.click()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-paper px-5 py-3 text-[14px] font-medium text-ink transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-muted transition group-hover:text-ink"
                    aria-hidden
                  >
                    <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  Upload existing CV
                </button>
                <input
                  ref={cvUploadInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handlePdfUploadChange}
                />
                <p className="text-center text-[11px] text-muted">
                  Continue editing a PDF you made on buildmyfree.cv
                </p>
              </div>

              {nonEmptySavedCvs.length > 0 && (
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted">
                    Continue on this browser
                  </p>
                  <div className="space-y-1.5">
                    {[...nonEmptySavedCvs]
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map((record) => (
                        <div
                          key={record.id}
                          className="group flex items-stretch gap-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectSavedCv(record.id)}
                            className="flex-1 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[14px] font-medium text-ink">
                                {record.name}
                              </span>
                              <span className="text-[11px] text-muted">
                                {new Date(record.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted">
                              Last edited{' '}
                              {new Date(record.updatedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSavedCv(record.id, record.name)
                            }
                            className="flex items-center justify-center rounded-xl px-3 text-muted transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${record.name}`}
                            title="Delete saved CV"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-[12px] text-muted">
              Open source on{' '}
              <a
                href="https://github.com/themidnightgospel/free-cv-builder"
                className="font-medium text-ink underline decoration-accent decoration-2 underline-offset-4 transition hover:text-accent"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PdfPayloadPortal payload={printablePayload} />
      <PdfPayloadPrintBlock payload={printablePayload} />
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
                  {cv.sectionsOrder.map((id, index) => {
                    const rawLabel = isCustomSectionId(id)
                      ? cv.customSections.find(
                          (section) => `custom:${section.id}` === id,
                        )?.title || 'Custom section'
                      : sectionLabel[id as CvSectionKey];
                    const label =
                      rawLabel.length > 16 ? rawLabel.slice(0, 16) : rawLabel;

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
                    const isPersonal = id === 'personal';
                    const isFirst = index === 0;
                    const isLast = index === cv.sectionsOrder.length - 1;
                    const previousId =
                      index > 0 ? (cv.sectionsOrder[index - 1] as SectionId) : null;
                    const isImmediatelyAfterPersonal = previousId === 'personal';
                    const canMoveUp =
                      !isPersonal && !isFirst && !isImmediatelyAfterPersonal;
                    const canMoveDown = !isPersonal && !isLast;
                    const moveUpTargetId = canMoveUp ? previousId : null;
                    const moveDownTargetId = canMoveDown
                      ? (cv.sectionsOrder[index + 1] as SectionId)
                      : null;

                    return (
                      <div
                        key={id}
                        className={`flex w-full items-center gap-1.5 rounded-md ${
                          draggingSectionId === id ? 'opacity-60' : ''
                        }`}
                        draggable={!isPersonal}
                        onDragStart={(event) => {
                          if (isPersonal) return;
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggingSectionId(id);
                        }}
                        onDragEnd={() => setDraggingSectionId(null)}
                        onDragOver={(event) => {
                          if (
                            !draggingSectionId ||
                            draggingSectionId === id ||
                            id === 'personal' ||
                            draggingSectionId === 'personal'
                          )
                            return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (
                            !draggingSectionId ||
                            draggingSectionId === id ||
                            id === 'personal' ||
                            draggingSectionId === 'personal'
                          )
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={sectionsSidebarArrowButton}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (!moveUpTargetId) return;
                              reorderSections(id, moveUpTargetId);
                            }}
                            disabled={isFirst || isPersonal}
                            aria-label="Move section up"
                            title="Move section up"
                          >
                            <ChevronUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={sectionsSidebarArrowButton}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (!moveDownTargetId) return;
                              reorderSections(id, moveDownTargetId);
                            }}
                            disabled={isLast || isPersonal}
                            aria-label="Move section down"
                            title="Move section down"
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={`${sectionsSidebarArrowButton} ${
                              isPersonal ? '' : 'text-slate-700 hover:text-rose-700'
                            }`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRemoveSection(id);
                            }}
                            disabled={isPersonal}
                            aria-label="Remove section"
                            title="Remove section"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </nav>
                <div className="relative mt-3" ref={addSectionMenuRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setIsAddSectionMenuOpen((previous) => !previous)
                    }
                    className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <span>+ Add section</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition ${isAddSectionMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isAddSectionMenuOpen && (
                    <div className="absolute z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Choose a section
                        </p>
                      </div>
                      <div className="p-1">
                        {addSectionOptions.map((option) => {
                          const alreadyAdded =
                            option.id !== 'custom' &&
                            cv.sectionsOrder.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                if (option.id === 'custom') {
                                  handleAddCustomSection();
                                  return;
                                }
                                handleAddSection(option.id);
                              }}
                              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-medium transition ${
                                alreadyAdded
                                  ? 'bg-slate-50 text-slate-500'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{option.label}</span>
                              {alreadyAdded && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                  Added
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
                onDelete={() => handleRemoveSection(activeSection)}
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
                <button
                  type="button"
                  className="flex items-start gap-2 text-left"
                  aria-expanded={isAdvancedOptionsOpen}
                  aria-controls="advanced-options-panel"
                  onClick={() =>
                    setIsAdvancedOptionsOpen((prevIsOpen) => !prevIsOpen)
                  }
                >
                  {isAdvancedOptionsOpen ? (
                    <ChevronUpIcon className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Advanced options
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Fine-tune typography for the exported PDF.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  onClick={() =>
                    setCv((prev) => ({
                      ...prev,
                      fontSettings: { ...DEFAULT_FONT_SETTINGS },
                    }))
                  }
                >
                  Reset defaults
                </button>
              </div>
              {isAdvancedOptionsOpen && (
                <div className="space-y-4" id="advanced-options-panel">
                  {fontControlSections.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <p className="text-[11px] font-semibold text-slate-700">
                        {group.title}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {group.controls.map((control) => (
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
                                  adjustFontSetting(
                                    control.key,
                                    -(control.step ?? 1),
                                  )
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
                              <span className="text-[10px] text-slate-500">
                                px
                              </span>
                              <button
                                type="button"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() =>
                                  adjustFontSetting(
                                    control.key,
                                    control.step ?? 1,
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div
          className={`mt-4 ${
            activeWorkspaceView === 'preview' ? 'block' : 'hidden'
          } ${
            pendingPrintJob ? 'print:hidden' : 'print:block print:mt-0'
          }`}
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
                <div className={PREVIEW_SURFACE_CLASSNAMES}>
                  <CvPreview cv={cv} fontSettings={fontSettings} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {pendingPrintJob && (
          <div className="hidden print:block" aria-hidden="true">
            <div className="mx-auto max-w-4xl">
              <div className="bg-slate-200 py-4 px-2 print:bg-transparent print:p-0">
                <div className={PREVIEW_SURFACE_CLASSNAMES}>
                  <CvPreview
                    cv={pendingPrintJob.cv}
                    fontSettings={pendingPrintJob.cv.fontSettings}
                    forcePrintLayout
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {photoCropImageSrc && (
          <PhotoCropModal
            imageSrc={photoCropImageSrc}
            onCancel={handlePhotoCropCancel}
            onSave={handlePhotoCropSave}
          />
        )}

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

        {/* Import error modal */}
        {importError && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-2 text-base font-semibold text-slate-900">
                Cannot load CV from PDF
              </h2>
              <p className="mb-4 text-sm text-slate-600">{importError}</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => setImportError(null)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      </div>
    </>
  );
};
