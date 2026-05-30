import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { CvData, CvSectionKey, SectionId } from './types';
import { CvPreview } from './components/CvPreview';
import { AdvancedPanel } from './components/AdvancedPanel';
import { PhotoCropModal } from './components/PhotoCropModal';
import { useConfirmDialog } from './components/ConfirmDialogProvider';
import { encodeCvPayloadForText } from './pdf/encodeCvPayload';
import {
  extractEmbeddedCvJsonFromPdf,
  extractProfileImageFromPdf,
} from './pdf/pdfExtraction';
import { parseCvFromPdfTextLayer } from './pdf/textLayerParser';
import { PdfPayloadPortal, PdfPayloadPrintBlock } from './pdf/PdfPayloadEmbed';
import {
  CURRENT_CV_ID_STORAGE_KEY,
  getCvDisplayName,
  type SavedCvRecord,
} from './state/cvStorage';
import {
  createInitialCv,
  hasMeaningfulCv,
  hasMeaningfulEducation,
  hasMeaningfulExperience,
  isCustomSectionId,
  normalizeCvData,
  sectionLabel,
  validatePersonalInfo,
  DEFAULT_ADVANCED_SETTINGS,
  DEFAULT_FONT_SETTINGS,
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
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [photoCropImageSrc, setPhotoCropImageSrc] = useState<string | null>(null);
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
  const advancedSettings = cv.advancedSettings ?? DEFAULT_ADVANCED_SETTINGS;
  const cvUploadInputRef = useRef<HTMLInputElement>(null);
  const activeCvEmbeddedPayload = useMemo(() => {
    try {
      return encodeCvPayloadForText(cv);
    } catch (error) {
      console.error(error);
      return '';
    }
  }, [cv]);
  const landingSampleCv = useMemo(() => createSampleCv(), []);
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
  useEffect(() => {
    window.fillForm = () => {
      const newId = generateId();
      setCurrentCvId(newId);
      persistCurrentCvId(newId);
      setMode('editor');
      setCv(createSampleCv());
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
      const photoDataUrl = await photoFromPdfPromise;

      if (jsonText) {
        importCvFromJsonText(jsonText, 'PDF file', photoDataUrl || undefined);
        return;
      }

      const parsedFromText = await parseCvFromPdfTextLayer(cloneBytes());
      if (parsedFromText) {
        const withPhoto =
          photoDataUrl && !parsedFromText.personalInfo.photoDataUrl
            ? {
                ...parsedFromText,
                personalInfo: {
                  ...parsedFromText.personalInfo,
                  photoDataUrl,
                },
              }
            : parsedFromText;
        importCvFromJsonText(
          JSON.stringify(withPhoto),
          'PDF file (text recovery)',
          photoDataUrl || undefined,
        );
        return;
      }

      setImportError(
        'Could not read CV data from this PDF. Try a PDF exported from Free CV Builder, or paste content manually.',
      );
    } catch (error) {
      console.error(error);
      setImportError(
        'This CV must be created using Free CV Builder. Please upload a PDF exported from Free CV Builder.',
      );
    } finally {
      event.target.value = '';
    }
  };;

  const handleCreateNew = () => {
    const newId = generateId();
    setCurrentCvId(newId);
    persistCurrentCvId(newId);
    setCv(createInitialCv());
    setMode('editor');
    setShowValidationModal(false);
    setValidationErrors([]);
  };

  const handleSelectSavedCv = (id: string) => {
    const record = savedCvs.find((entry) => entry.id === id);
    if (!record) return;
    const normalizedCv = normalizeCvData(record.cv) ?? createInitialCv();
    setCv(normalizedCv);
    setMode('editor');
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

  const handleRemoveSection = (sectionId: SectionId) => {
    if (sectionId === 'personal') return;
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
      return {
        ...prev,
        customSections: nextCustomSections,
        sectionsOrder: nextSectionsOrder,
      };
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

  const photoUploadInputRef = useRef<HTMLInputElement>(null);
  const triggerPhotoUpload = () => {
    photoUploadInputRef.current?.click();
  };

  const onMoveSectionByDirection = (
    sectionId: SectionId,
    direction: -1 | 1,
  ) => {
    if (sectionId === 'personal') return;
    setCv((prev) => {
      const order = [...prev.sectionsOrder];
      const fromIndex = order.indexOf(sectionId);
      if (fromIndex === -1) return prev;
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= order.length) return prev;
      if (order[toIndex] === 'personal') return prev;
      [order[fromIndex], order[toIndex]] = [order[toIndex], order[fromIndex]];
      return { ...prev, sectionsOrder: order };
    });
  };

  const onInsertSectionAt = (afterIndex: number, optionId: string) => {
    if (optionId === 'custom') {
      const id = crypto.randomUUID();
      setCv((prev) => {
        const order = [...prev.sectionsOrder];
        order.splice(afterIndex + 1, 0, `custom:${id}` as SectionId);
        return {
          ...prev,
          customSections: [
            ...prev.customSections,
            { id, title: 'New section', body: '' },
          ],
          sectionsOrder: order,
        };
      });
      return;
    }
    setCv((prev) => {
      if (prev.sectionsOrder.includes(optionId as SectionId)) return prev;
      const order = [...prev.sectionsOrder];
      order.splice(afterIndex + 1, 0, optionId as SectionId);
      return { ...prev, sectionsOrder: order };
    });
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

          <div className="relative mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-10 xl:gap-x-16">
              {/* LEFT — content */}
              <div className="mx-auto w-full max-w-md lg:col-span-6 lg:mx-0 lg:max-w-none">
            <div className="mb-10 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-paper/70 px-3 py-1 text-[11px] font-medium text-muted shadow-soft backdrop-blur">
                <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
                Open source · MIT
              </span>
              <h1 className="mt-6 text-[44px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[52px] lg:text-[56px]">
                Free CV builder
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-muted lg:mx-0">
                Make a clean, professional CV in a few minutes. Download as PDF.
                No account. No tracking. No surprises.
              </p>
              <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-muted lg:mx-0 lg:justify-start">
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

            <p className="mt-8 text-center text-[12px] text-muted lg:text-left">
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

              {/* RIGHT — CV poster (lg+ only, decorative) */}
              <div
                className="hidden lg:col-span-6 lg:block"
                aria-hidden="true"
              >
                <div className="group relative">
                  {/* Layered shadow papers behind the main poster */}
                  <div className="pointer-events-none absolute left-6 top-6 h-full w-full origin-top-right -rotate-3 rounded-md bg-slate-100/80 shadow-soft transition-transform duration-500 ease-out group-hover:-rotate-2" />
                  <div className="pointer-events-none absolute left-3 top-3 h-full w-full origin-top-right rotate-1 rounded-md bg-paper/95 shadow-soft transition-transform duration-500 ease-out group-hover:rotate-0" />

                  {/* The active CV poster */}
                  <div className="relative origin-bottom-left rotate-[1.5deg] transition-transform duration-500 ease-out group-hover:rotate-0 group-hover:-translate-y-1">
                    <div className="relative aspect-[1/1.4142] w-full overflow-hidden rounded-md bg-paper px-7 py-6 text-slate-900 shadow-lift [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]">
                      <div className="pointer-events-none h-full w-full">
                        <CvPreview
                          cv={landingSampleCv}
                          fontSettings={DEFAULT_FONT_SETTINGS}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Floating caption chip */}
                  <span className="absolute -bottom-2 left-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-paper/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted shadow-soft backdrop-blur">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    A sample CV
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const editorBindings = {
    onUpdate: (next: CvData) => setCv(next),
    onUpdatePersonalInfo: (personalInfo: typeof cv.personalInfo) =>
      setCv((prev) => ({ ...prev, personalInfo })),
    onPhotoUploadRequest: triggerPhotoUpload,
    addSectionOptions: addSectionOptions.map((option) => ({
      id: option.id as string,
      label: option.label,
      disabled:
        option.id !== 'custom' && cv.sectionsOrder.includes(option.id as SectionId),
    })),
    onInsertSectionAt,
    onMoveSection: onMoveSectionByDirection,
    onRemoveSection: handleRemoveSection,
  };

  return (
    <>
      <PdfPayloadPortal payload={printablePayload} />
      <PdfPayloadPrintBlock payload={printablePayload} />
      <input
        ref={photoUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handlePhotoUpload(file);
          event.target.value = '';
        }}
      />
      <div className="min-h-screen bg-canvas">
        {header}
      <main className="mx-auto max-w-[900px] px-4 pt-24 pb-16 print:block print:max-w-none print:px-0 print:pt-0 print:pb-0">
        {/* The CV preview IS the editor. Inline + popover editing. */}
        <div className="rounded-3xl bg-paper shadow-lift print:hidden">
          <div className="px-8 py-6">
            <CvPreview
              cv={cv}
              fontSettings={fontSettings}
              advancedSettings={advancedSettings}
              editor={editorBindings}
            />
          </div>
        </div>

        <div className="print:hidden">
          <AdvancedPanel
            fontSettings={fontSettings}
            advancedSettings={advancedSettings}
            onChangeFont={(next) =>
              setCv((prev) => ({ ...prev, fontSettings: next }))
            }
            onChangeAdvanced={(next) =>
              setCv((prev) => ({ ...prev, advancedSettings: next }))
            }
          />
        </div>

        {pendingPrintJob && (
          <div className="hidden print:block" aria-hidden="true">
            <div className="mx-auto max-w-4xl">
              <div className="bg-slate-200 py-4 px-2 print:bg-transparent print:p-0">
                <div className={PREVIEW_SURFACE_CLASSNAMES}>
                  <CvPreview
                    cv={pendingPrintJob.cv}
                    fontSettings={pendingPrintJob.cv.fontSettings}
                    advancedSettings={
                      pendingPrintJob.cv.advancedSettings ??
                      DEFAULT_ADVANCED_SETTINGS
                    }
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
                  className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-paper hover:bg-accent-dark"
                  onClick={() => setShowValidationModal(false)}
                >
                  OK
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
