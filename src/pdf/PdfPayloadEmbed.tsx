import React, { useMemo } from 'react';

const PDF_EMBED_ELEMENT_ID = 'freecvbuilder-pdf-json';

const INVISIBLE_PAYLOAD_STYLE = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  display: 'block',
  fontFamily: 'monospace',
  fontSize: '4px',
  lineHeight: '5px',
  color: '#0f172a',
  opacity: 0.01,
  textShadow: '0 0 1px rgba(15, 23, 42, 0.01)',
  whiteSpace: 'pre' as const,
  wordBreak: 'normal' as const,
  overflowWrap: 'normal' as const,
  userSelect: 'none' as const,
  pointerEvents: 'none' as const,
  maxWidth: 'none' as const,
  maxHeight: 'none' as const,
  overflow: 'visible' as const,
};

const CHUNK_SIZE = 200;
const CHUNK_START_PREFIX = 'CV_C_S_';
const CHUNK_END_PREFIX = 'CV_C_E_';

interface PdfPayloadProps {
  payload: string;
}

// Hidden payload script kept in the DOM; the print-only text blocks are rendered separately for PDF embedding.
export const PdfPayloadPortal: React.FC<PdfPayloadProps> = ({ payload }) => {
  if (!payload) return null;
  const sanitized = payload.replace(/[<>&]/g, (char) => {
    if (char === '<') return '\\u003c';
    if (char === '>') return '\\u003e';
    return '\\u0026';
  });
  return (
    <script
      id={PDF_EMBED_ELEMENT_ID}
      type="application/json"
      data-source="freecvbuilder"
      aria-hidden="true"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

const buildChunkedPayloadBlocks = (payload: string): string[] => {
  if (!payload) return [];
  const blocks: string[] = [];
  for (let offset = 0; offset < payload.length; offset += CHUNK_SIZE) {
    const index = blocks.length;
    const slice = payload.slice(offset, offset + CHUNK_SIZE);
    blocks.push(`${CHUNK_START_PREFIX}${index}${slice}${CHUNK_END_PREFIX}${index}`);
  }
  return blocks;
};

export const PdfPayloadPrintBlock: React.FC<PdfPayloadProps> = ({
  payload,
}) => {
  if (!payload) return null;
  const blocks = useMemo(() => buildChunkedPayloadBlocks(payload), [payload]);
  return (
    <>
      {blocks.map((block, index) => (
        <div
          key={index}
          className="hidden print:block"
          style={{
            ...INVISIBLE_PAYLOAD_STYLE,
            // Force a new page before the first payload block to keep it off the visible CV pages.
            breakBefore: index === 0 ? 'page' : 'auto',
            pageBreakBefore: index === 0 ? 'always' : 'auto',
            breakInside: 'auto',
            pageBreakInside: 'auto',
          }}
        >
          {block}
        </div>
      ))}
    </>
  );
};
