import type { CvData } from '../types';

export const SAVED_CVS_STORAGE_KEY = 'freeCvBuilder:savedCvFiles';
export const CURRENT_CV_ID_STORAGE_KEY = 'freeCvBuilder:currentCvId';

export interface SavedCvRecord {
  id: string;
  name: string;
  updatedAt: number;
  cv: CvData;
}

export const cloneCvData = (data: CvData): CvData => {
  if (typeof structuredClone === 'function') {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data)) as CvData;
};

export const getCvDisplayName = (data: CvData): string =>
  data.personalInfo.fullName.trim() || 'Untitled CV';

export const createPdfFilename = (name?: string): string => {
  const base = name?.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-') ?? '';
  const sanitized = base.replace(/^-+|-+$/g, '') || 'my-cv';
  return `${sanitized}.pdf`;
};
