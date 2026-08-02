import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = join(process.cwd(), 'src');

/**
 * Only the bundle entry is reached without a TS/TSX import — index.html loads
 * it. Everything else, App.tsx included, must be imported by something.
 */
const ENTRY_POINTS = new Set(['main.tsx']);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sourceFiles = walk(SRC).filter((f) => /\.tsx?$/.test(f));

const allSource = sourceFiles
  .map((f) => ({ file: f, text: readFileSync(f, 'utf8') }))
  .filter(({ file }) => !file.endsWith('.d.ts'));

/**
 * True when `text` references module `base` by path. Matches any string
 * literal rather than only `import ... from`, so side-effect imports,
 * dynamic imports and re-exports all count. The leading `/` is what keeps
 * prose containing the module name (`'Profile photo'`) from passing as a
 * reference — every local import specifier is path-qualified.
 */
export const referencesModule = (text: string, base: string): boolean =>
  new RegExp(`['"][^'"]*/${base}(\\.tsx?)?['"]`).test(text);

const isImportedSomewhere = (file: string): boolean => {
  const base = file.split(sep).pop()!.replace(/\.tsx?$/, '');
  return allSource.some(
    ({ file: other, text }) => other !== file && referencesModule(text, base),
  );
};

describe('referencesModule', () => {
  it.each([
    [`import x from '../utils/photo';`, true, 'relative import'],
    [`import './photo';`, true, 'side-effect import'],
    [`await import('./photo')`, true, 'dynamic import'],
    [`export * from './photo';`, true, 're-export'],
    [`import { a } from '../utils/photo.ts';`, true, 'explicit extension'],
    // Prose that merely contains the module name must not count as a
    // reference, or a genuinely dead module would go undetected.
    [`alt={personalInfo.fullName || 'Profile photo'}`, false, 'prose'],
    [`aria-label="Change profile photo"`, false, 'prose in an attribute'],
  ])('%s -> %s (%s)', (text, expected) => {
    expect(referencesModule(text as string, 'photo')).toBe(expected);
  });
});

describe('no dead modules under src/', () => {
  it('every module is reachable from an entry point', () => {
    const orphans = allSource
      .map(({ file }) => file)
      .filter((file) => !ENTRY_POINTS.has(file.split(sep).pop()!))
      .filter((file) => !isImportedSomewhere(file))
      .map((file) => relative(process.cwd(), file).split(sep).join('/'))
      .sort();

    expect(orphans, `unreferenced modules:\n${orphans.join('\n')}`).toEqual([]);
  });
});
