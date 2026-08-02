import { useEffect, useRef, useState } from 'react';
import type { CvData } from '../types';
import {
  CURRENT_CV_ID_STORAGE_KEY,
  SAVED_CVS_STORAGE_KEY,
  getCvDisplayName,
  type SavedCvRecord,
} from './cvStorage';
import { hasMeaningfulCv, isRecord } from './cvModel';
import { generateId } from '../utils/uuid';

export const readSavedCvsFromStorage = (): SavedCvRecord[] => {
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

/**
 * Returns whether the write actually landed. Storage can reject a write when
 * the quota is exceeded; callers must not report the CV as saved in that case.
 */
export const writeSavedCvsToStorage = (
  records: SavedCvRecord[],
): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(
      SAVED_CVS_STORAGE_KEY,
      JSON.stringify(records),
    );
    return true;
  } catch (error) {
    console.error('Failed to persist CVs', error);
    return false;
  }
};

export const persistCurrentCvId = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CURRENT_CV_ID_STORAGE_KEY, id);
  } catch (error) {
    console.error('Failed to store current CV id', error);
  }
};

interface UseCvPersistenceResult {
  currentCvId: string;
  savedCvs: SavedCvRecord[];
  hasUnsavedChanges: boolean;
  setCurrentCvId: (id: string) => void;
  setSavedCvs: React.Dispatch<React.SetStateAction<SavedCvRecord[]>>;
}

/**
 * Persists the given CV to localStorage immediately. Used both by the
 * debounced autosave and by the synchronous "flush before leaving" path so
 * navigation away from the editor never drops the user's work.
 *
 * Returns whether the CV is now safely on disk.
 */
const writeSnapshot = (
  cv: CvData,
  currentCvId: string,
  setSavedCvs: React.Dispatch<React.SetStateAction<SavedCvRecord[]>>,
): boolean => {
  if (typeof window === 'undefined') return false;
  if (!currentCvId) return false;
  const records = readSavedCvsFromStorage();
  if (!hasMeaningfulCv(cv)) {
    const filtered = records.filter((record) => record.id !== currentCvId);
    persistCurrentCvId(currentCvId);
    // Nothing stored for an empty CV, so there is nothing that can be lost.
    if (filtered.length === records.length) return true;
    const removed = writeSavedCvsToStorage(filtered);
    if (removed) setSavedCvs(filtered);
    return removed;
  }
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
  const persisted = writeSavedCvsToStorage(nextRecords);
  persistCurrentCvId(currentCvId);
  // Only mirror into React state what storage actually accepted, so the
  // in-memory list cannot drift ahead of what a reload would restore.
  if (persisted) setSavedCvs(nextRecords);
  return persisted;
};

export const useCvPersistence = (
  cv: CvData,
  mode: 'landing' | 'editor',
): UseCvPersistenceResult => {
  const [currentCvId, setCurrentCvId] = useState<string>(() => generateId());
  const [savedCvs, setSavedCvs] = useState<SavedCvRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const skipInitialPersistRef = useRef(true);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    const prevMode = prevModeRef.current;
    prevModeRef.current = mode;

    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }

    if (mode !== 'editor') {
      if (typeof window !== 'undefined' && saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // Flush any in-flight save when leaving the editor so a quick "upload
      // PDF then click Back" doesn't silently drop the just-imported CV.
      const flushed =
        prevMode === 'editor'
          ? writeSnapshot(cv, currentCvId, setSavedCvs)
          : true;
      setHasUnsavedChanges(!flushed);
      return;
    }

    if (typeof window === 'undefined') return;
    if (!currentCvId) return;
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      const persisted = writeSnapshot(cv, currentCvId, setSavedCvs);
      // A rejected write must keep reading as "Unsaved" rather than claiming
      // the work is safe when a reload would lose it.
      setHasUnsavedChanges(!persisted);
      saveTimeoutRef.current = null;
    }, 1000);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [cv, currentCvId, mode]);

  return {
    currentCvId,
    savedCvs,
    hasUnsavedChanges,
    setCurrentCvId,
    setSavedCvs,
  };
};
