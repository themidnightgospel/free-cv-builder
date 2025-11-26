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
  const defaultFontSettings: FontSettings = {
    fullName: 28,
    sectionTitle: 12,
    sectionItemTitle: 14,
    sectionDetail: 12,
  };
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    ...defaultFontSettings,
  });
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
      const newId = generateId();
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
    <header className="fixed inset-x-0 top-0 z-20 bg-white/90 border-b border-gray-200 shadow-sm print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              setMode('landing');
            }}
          >
            ← Back to start
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <div className="text-sm font-semibold text-gray-900">
                Truly free CV builder
            </div>
            <div className="text-xs text-gray-500">
                No paywall, no sign-up, no data harvesting
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
            onClick={handleDownloadPdf}
            disabled={isPreparingPdf}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isPreparingPdf ? 'Preparing PDF…' : 'Download PDF'}
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-slate-900">
                  Truly free CV builder
              </h1>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Create new CV
              </button>
              <p className="text-center text-xs font-medium text-slate-500">
                or do you have existing cv built using buildmyfree.cv ?
              </p>
              <button
                type="button"
                onClick={() => cvUploadInputRef.current?.click()}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Upload existing CV
              </button>
              <input
                ref={cvUploadInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handlePdfUploadChange}
              />
              {nonEmptySavedCvs.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-slate-500">
                    Saved CVs on this browser
                  </p>
                  <div className="space-y-2">
                    {[...nonEmptySavedCvs]
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
                          <div className="flex flex-col justify-center">
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
            <p className="text-xs text-slate-500 text-center font-semibold">
                No paywall, no sign-up, no data harvesting, no ‘free until download’, no watermarks
            </p>
            <p className="text-xs text-slate-500 text-center font-semibold">
                Open-source on{' '}
                <a
                  href="https://github.com/themidnightgospel/free-cv-builder"
                  className="text-blue-600 hover:underline"
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
                        </div>
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
                    fontSettings={fontSettings}
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
