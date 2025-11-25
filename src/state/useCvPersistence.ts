import { useEffect, useRef, useState } from 'react';
import type { CvData } from '../types';
import {
  CURRENT_CV_ID_STORAGE_KEY,
  SAVED_CVS_STORAGE_KEY,
  getCvDisplayName,
  type SavedCvRecord,
} from './cvStorage';
import { isRecord } from './cvModel';
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

export const writeSavedCvsToStorage = (records: SavedCvRecord[]) => {
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

export const useCvPersistence = (
  cv: CvData,
  mode: 'landing' | 'editor',
): UseCvPersistenceResult => {
  const [currentCvId, setCurrentCvId] = useState<string>(() => generateId());
  const [savedCvs, setSavedCvs] = useState<SavedCvRecord[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const skipInitialPersistRef = useRef(true);

  useEffect(() => {
    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }
    if (mode !== 'editor') {
      if (typeof window !== 'undefined' && saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      setHasUnsavedChanges(false);
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
    }, 2000);
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
