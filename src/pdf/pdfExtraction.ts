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
  extractFromStreamContent?: (content: string) => string | null,
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
      const fromExtractor = extractFromStreamContent
        ? extractFromStreamContent(decompressed)
        : null;
      if (fromExtractor) return fromExtractor;

      // Default: new chunked format.
      const fromChunks = extractChunkedPayloadFromText(decompressed);
      if (fromChunks) {
        return fromChunks;
      }

      // Default: legacy single-block marker format for backward compatibility.
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
          if (trimmed) {
            try {
              JSON.parse(trimmed);
              return trimmed;
            } catch {
              // try next stream
            }
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
    return ungzip(bytes, { to: 'string' }) as string;
  } catch {
    return trimmed;
  }
};

const tryExtractEmbeddedJsonFromText = (source: string): string | null => {
  if (!source) return null;

  const fromChunks = extractChunkedPayloadFromText(source);
  if (fromChunks) return fromChunks;

  const legacyStart = 'FREECVBUILDER_JSON_TEXT_START';
  const legacyEnd = 'FREECVBUILDER_JSON_TEXT_END';
  const expand = (marker: string) =>
    marker
      .split('')
      .map((ch) => `${ch}[\\s\\u200B-\\u200D\\uFEFF]*`)
      .join('');
  const regex = new RegExp(
    `${expand(legacyStart)}([\\s\\S]*?)${expand(legacyEnd)}`,
    'gi',
  );

  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(source)) !== null) {
    const rawPayload = match[1];
    const cleaned = rawPayload.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    if (!cleaned) continue;
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch {
      try {
        const decoded = decodeEmbeddedCvPayload(cleaned);
        JSON.parse(decoded);
        return decoded;
      } catch {
        // Try next match.
      }
    }
  }

  return null;
};

const buildTextVariants = (text: string): string[] => {
  const asciiText = text.replace(/[^\x20-\x7E]/g, '');
  const normalized = text.replace(/\s+/g, '');
  const normalizedAscii = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  const asciiNormalized = asciiText.replace(/\s+/g, '');
  const alnumOnly = text.replace(/[^A-Za-z0-9{}\[\]":,._-]/g, '');
  const alnumNormalized = alnumOnly.replace(/\s+/g, '');
  return Array.from(
    new Set<string>([
      text,
      asciiText,
      normalized,
      normalizedAscii,
      asciiNormalized,
      alnumOnly,
      alnumNormalized,
    ]),
  ).filter(Boolean);
};

const tryExtractFromPdfStreamContent = (content: string): string | null => {
  const direct = tryExtractEmbeddedJsonFromText(content);
  if (direct) return direct;

  const stringLiterals = Array.from(content.matchAll(/\((.*?)\)/gs)).map(
    (match) => match[1],
  );
  if (stringLiterals.length) {
    const joined = stringLiterals.join('');
    const fromJoined = tryExtractEmbeddedJsonFromText(joined);
    if (fromJoined) return fromJoined;
    const squeezed = joined.replace(/[^A-Za-z0-9{}\[\]":,._-]/g, '');
    const fromSqueezed = tryExtractEmbeddedJsonFromText(squeezed);
    if (fromSqueezed) return fromSqueezed;
  }

  return null;
};

export const extractEmbeddedCvJsonFromPdf = async (
  bytes: Uint8Array,
): Promise<string | null> => {
  const seen = new Set<string>();
  const tryFromText = (text: string): string | null => {
    for (const variant of buildTextVariants(text)) {
      if (seen.has(variant)) continue;
      seen.add(variant);
      const result = tryExtractEmbeddedJsonFromText(variant);
      if (result) return result;
    }
    return null;
  };

  const rawText = bytesToBinaryString(bytes);
  let textContent: string | null = null;

  try {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    let extractedText = '';
    for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
      const page = await doc.getPage(pageIndex);
      const content = await page.getTextContent();
      extractedText += content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
    }
    textContent = extractedText;
    const fromPdfJs = tryFromText(extractedText);
    if (fromPdfJs) return fromPdfJs;
  } catch (pdfJsError) {
    console.error('Unable to extract PDF text layer via pdf.js', pdfJsError);
  }

  if (textContent) {
    const fromText = tryFromText(textContent);
    if (fromText) return fromText;
  }

  const fromRaw = tryFromText(rawText);
  if (fromRaw) return fromRaw;

  const fromStreams = tryExtractJsonFromPdfStreams(
    bytes,
    tryExtractFromPdfStreamContent,
  );
  if (fromStreams) return fromStreams;

  return null;
};

const convertImageToDataUrl = (image: any, pdfjs: any): string | null => {
  if (!image) return null;

  const renderDrawable = (drawable: CanvasImageSource) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const width = (drawable as any).width ?? 0;
    const height = (drawable as any).height ?? 0;
    if (!width || !height) return null;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(drawable, 0, 0);
    return canvas.toDataURL('image/png');
  };

  if (image instanceof ImageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }

  const bitmapImage =
    typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap
      ? image
      : typeof ImageBitmap !== 'undefined' && image?.bitmap instanceof ImageBitmap
        ? image.bitmap
        : null;
  if (bitmapImage) {
    const dataUrl = renderDrawable(bitmapImage);
    if (dataUrl) return dataUrl;
  }

  if (
    typeof HTMLImageElement !== 'undefined' &&
    image instanceof HTMLImageElement
  ) {
    const dataUrl = renderDrawable(image);
    if (dataUrl) return dataUrl;
  }

  const width = image.width ?? image.w;
  const height = image.height ?? image.h;
  const rawData = image.data ?? image?.bitmap?.data;
  if (!width || !height || !rawData) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = width;
  canvas.height = height;

  const imageKind = pdfjs?.ImageKind ?? {};
  const kind = image.kind;
  let imageData: ImageData | null = null;

  if (
    (imageKind.RGBA_32BPP && kind === imageKind.RGBA_32BPP) ||
    rawData.length === width * height * 4
  ) {
    imageData = new ImageData(new Uint8ClampedArray(rawData), width, height);
  } else if (
    (imageKind.RGB_24BPP && kind === imageKind.RGB_24BPP) ||
    rawData.length === width * height * 3
  ) {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let src = 0, dest = 0; src < rawData.length; src += 3, dest += 4) {
      rgba[dest] = rawData[src];
      rgba[dest + 1] = rawData[src + 1];
      rgba[dest + 2] = rawData[src + 2];
      rgba[dest + 3] = 255;
    }
    imageData = new ImageData(rgba, width, height);
  }

  if (!imageData) return null;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

export const extractProfileImageFromPdf = async (
  bytes: Uint8Array,
): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    if (!doc.numPages) return null;
    const page = await doc.getPage(1);
    const operatorList = await page.getOperatorList();
    const ops = pdfjs.OPS;
    if (!ops) return null;
    const inlineImages: any[] = [];
    const xObjectNames = new Set<string>();

    operatorList.fnArray.forEach((fn: number, index: number) => {
      const args = operatorList.argsArray[index];
      if (!args) return;
      if (
        fn === ops.paintInlineImageXObject ||
        fn === ops.paintInlineImageXObjectRepeat
      ) {
        inlineImages.push(args[0]);
      }
      if (
        fn === ops.paintImageXObject ||
        fn === ops.paintImageXObjectRepeat
      ) {
        const name = args[0];
        if (typeof name === 'string') {
          xObjectNames.add(name);
        }
      }
    });

    type Candidate = {
      dataUrl: string;
      width: number;
      height: number;
      source: 'inline' | 'xobject';
    };
    const candidates: Candidate[] = [];

    const pushCandidate = (image: any, source: Candidate['source']) => {
      if (!image) return;
      const width =
        image.width ??
        image.w ??
        image?.bitmap?.width ??
        (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap
          ? image.width
          : null);
      const height =
        image.height ??
        image.h ??
        image?.bitmap?.height ??
        (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap
          ? image.height
          : null);
      if (!width || !height) return;
      const dataUrl = convertImageToDataUrl(image, pdfjs);
      if (!dataUrl) return;
      candidates.push({ dataUrl, width, height, source });
    };

    for (const image of inlineImages) {
      pushCandidate(image, 'inline');
    }

    if (xObjectNames.size > 0) {
      for (const name of xObjectNames) {
        try {
          const image = page.objs.get(name);
          if (image) {
            pushCandidate(image, 'xobject');
          }
        } catch {
          // If an object is not yet available or cannot be retrieved,
          // skip it rather than risking a hang.
        }
      }
    }

    if (!candidates.length) return null;

    const scoreCandidate = (candidate: Candidate): number => {
      const area = candidate.width * candidate.height;
      const aspect =
        candidate.width >= candidate.height
          ? candidate.width / candidate.height
          : candidate.height / candidate.width;
      const aspectPenalty = 1 + Math.abs(aspect - 1);
      return area / aspectPenalty;
    };

    let best = candidates[0];
    for (let i = 1; i < candidates.length; i += 1) {
      const current = candidates[i];
      if (scoreCandidate(current) > scoreCandidate(best)) {
        best = current;
      }
    }

    return best.dataUrl;
  } catch (error) {
    console.error('Failed to extract profile image from PDF', error);
    return null;
  }
};
