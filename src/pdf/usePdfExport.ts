import { useCallback, useEffect, useState } from 'react';
import type { CvData } from '../types';
import { cloneCvData, createPdfFilename, getCvDisplayName } from '../state/cvStorage';

const waitForNextPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

interface UsePdfExportResult {
  isPreparingPdf: boolean;
  pendingPrintJob: { cv: CvData; name: string } | null;
  downloadCvPdf: (data: CvData, filenameHint?: string) => Promise<void>;
}

export const usePdfExport = (
  addToast: (message: string, tone: 'info' | 'error') => void,
): UsePdfExportResult => {
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [pendingPrintJob, setPendingPrintJob] = useState<{
    cv: CvData;
    name: string;
  } | null>(null);

  const downloadCvPdf = useCallback(
    async (data: CvData, filenameHint?: string) => {
      if (typeof window === 'undefined') return;
      const filename = createPdfFilename(
        filenameHint || getCvDisplayName(data),
      );
      const job = {
        cv: cloneCvData(data),
        name: filename,
      };
      setPendingPrintJob(job);
      addToast(
        `Browser print dialog opening. Choose "Save as PDF" and name the file ${filename}.`,
        'info',
      );
      setIsPreparingPdf(true);
      try {
        await waitForNextPaint();
        window.print();
      } catch (error) {
        console.error(error);
        setIsPreparingPdf(false);
        setPendingPrintJob(null);
        addToast('Could not open the print dialog. Try again.', 'error');
      }
    },
    [addToast],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finishPrint = () => {
      setIsPreparingPdf(false);
      setPendingPrintJob(null);
    };
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        finishPrint();
      }
    };
    window.addEventListener('afterprint', finishPrint);
    let mediaQuery: MediaQueryList | null = null;
    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('print');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleMediaChange);
      }
    }
    return () => {
      window.removeEventListener('afterprint', finishPrint);
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery?.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  return { isPreparingPdf, pendingPrintJob, downloadCvPdf };
};

