import { ungzip, inflate } from 'pako';
import { PDF_JSON_TEXT_END_MARKER, PDF_JSON_TEXT_START_MARKER } from './pdfMarkers';

export const base64ToUint8 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const loadPdfJs = async () => {
  const pdfjs: any = await import('pdfjs-dist');
  try {
    const workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }
  } catch (error) {
    console.warn('Failed to configure pdf.js worker', error);
  }
  return pdfjs;
};

export const bytesToBinaryString = (bytes: Uint8Array): string => {
  let result = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  return result;
};

const CHUNK_START_PREFIX = 'CV_C_S_';
const CHUNK_END_PREFIX = 'CV_C_E_';

export const extractChunkedPayloadFromText = (source: string): string | null => {
  if (!source) return null;
  const regex = new RegExp(
    `${CHUNK_START_PREFIX}(\\d+)([\\s\\S]*?)${CHUNK_END_PREFIX}\\1`,
    'g',
  );
  const chunks = new Map<number, string>();
  let match: RegExpExecArray | null;

  // Collect first occurrence for each chunk index.
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(source)) !== null) {
    const index = Number.parseInt(match[1], 10);
    const content = match[2];
    if (!chunks.has(index)) {
      chunks.set(index, content);
    }
  }

  if (chunks.size === 0) return null;

  const orderedIndices = [...chunks.keys()].sort((a, b) => a - b);
  if (orderedIndices[0] !== 0) return null;

  const combined = orderedIndices
    .map((i) => chunks.get(i) ?? '')
    .join('')
    .trim();
  if (!combined) return null;

  try {
    JSON.parse(combined);
    return combined;
  } catch {
    try {
      const decoded = decodeEmbeddedCvPayload(combined);
      JSON.parse(decoded);
      return decoded;
    } catch {
      return null;
    }
  }
};

export const tryExtractJsonFromPdfStreams = (
  bytes: Uint8Array,
): string | null => {
  const decoder = new TextDecoder('latin1');
  const text = decoder.decode(bytes);
  const streamKeyword = 'stream';
  const endstreamKeyword = 'endstream';

  let searchIndex = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const streamIndex = text.indexOf(streamKeyword, searchIndex);
    if (streamIndex === -1) break;

    const eolIndex = text.indexOf('\n', streamIndex + streamKeyword.length);
    if (eolIndex === -1) break;

    const dataStart = eolIndex + 1;
    const endIndex = text.indexOf(endstreamKeyword, dataStart);
    if (endIndex === -1) break;

    const streamBytes = bytes.subarray(dataStart, endIndex);

    try {
      const decompressed = inflate(streamBytes, { to: 'string' }) as string;
      // New chunked format.
      const fromChunks = extractChunkedPayloadFromText(decompressed);
      if (fromChunks) {
        return fromChunks;
      }

      // Legacy single-block marker format for backward compatibility.
      const textStart = decompressed.indexOf(PDF_JSON_TEXT_START_MARKER);
      if (textStart !== -1) {
        const textEnd = decompressed.indexOf(
          PDF_JSON_TEXT_END_MARKER,
          textStart + PDF_JSON_TEXT_START_MARKER.length,
        );
        if (textEnd !== -1) {
          const rawPayload = decompressed.slice(
            textStart + PDF_JSON_TEXT_START_MARKER.length,
            textEnd,
          );
          const trimmed = rawPayload.trim();
          if (!trimmed) {
            searchIndex = endIndex + endstreamKeyword.length;
            continue;
          }
          try {
            JSON.parse(trimmed);
            return trimmed;
          } catch {
            searchIndex = endIndex + endstreamKeyword.length;
            continue;
          }
        }
      }
    } catch {
      // Ignore streams that are not Flate-compressed text.
    }

    searchIndex = endIndex + endstreamKeyword.length;
  }

  return null;
};

export const decodeEmbeddedCvPayload = (payload: string): string => {
  const trimmed = payload.trim();
  if (!trimmed) {
    throw new Error('Embedded payload is empty');
  }

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Not plain JSON: try legacy base64+gzip payloads for backward compatibility.
  }

  const sanitized = trimmed.replace(/[^A-Za-z0-9+/=]/g, '');
  if (!sanitized) return trimmed;

  try {
    const bytes = base64ToUint8(sanitized);
    const decompressed = ungzip(bytes, { to: 'string' }) as string;
    return decompressed;
  } catch {
    return trimmed;
  }
};
