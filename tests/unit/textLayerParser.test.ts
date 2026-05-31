import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractLinesFromPdfTextLayer,
  parseCvFromPdfTextLayer,
  parseCvFromTextLines,
} from '../../src/pdf/textLayerParser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, '..', 'fixtures', 'legacy-bitchiko.pdf');

const loadFixtureBytes = async (): Promise<Uint8Array> => {
  const buffer = await fs.readFile(FIXTURE_PATH);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};

describe('parseCvFromTextLines', () => {
  it('parses header + summary + experience block from raw lines', () => {
    const lines = [
      'Jane Doe',
      'Senior Engineer',
      'Email: jane@example.com Location: NYC',
      'Portfolio: https://jane.dev LinkedIn: https://linkedin.com/in/jane',
      'PROFESSIONAL SUMMARY',
      'Builds reliable systems with empathy.',
      'EXPERIENCE',
      'Staff Engineer',
      'Acme • Remote',
      'Jan 2022 – Present',
      '- Led design system migration',
      '- Mentored 4 engineers',
      'EDUCATION',
      'B.S. Computer Science',
      'MIT • Cambridge, MA',
      '2014 – 2018',
      'SKILLS',
      'TypeScript – Advanced React – Advanced',
      'LANGUAGES',
      'English – Native Spanish – Professional',
    ];

    const cv = parseCvFromTextLines(lines);

    expect(cv.personalInfo.fullName).toBe('Jane Doe');
    expect(cv.personalInfo.jobTitle).toBe('Senior Engineer');
    expect(cv.personalInfo.email).toBe('jane@example.com');
    expect(cv.personalInfo.location).toBe('NYC');
    expect(cv.personalInfo.website).toBe('https://jane.dev');
    expect(cv.personalInfo.linkedin).toBe('https://linkedin.com/in/jane');
    expect(cv.personalInfo.summary).toContain('Builds reliable systems');

    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].jobTitle).toBe('Staff Engineer');
    expect(cv.experience[0].company).toBe('Acme');
    expect(cv.experience[0].location).toBe('Remote');
    expect(cv.experience[0].startDate).toBe('Jan 2022');
    expect(cv.experience[0].isCurrent).toBe(true);
    expect(cv.experience[0].description).toContain('Led design system migration');

    expect(cv.education).toHaveLength(1);
    expect(cv.education[0].degree).toBe('B.S. Computer Science');
    expect(cv.education[0].institution).toBe('MIT');
    expect(cv.education[0].location).toBe('Cambridge, MA');
    expect(cv.education[0].startYear).toBe('2014');
    expect(cv.education[0].endYear).toBe('2018');

    expect(cv.skills.length).toBeGreaterThanOrEqual(2);
    const skillNames = cv.skills.map((s) => s.name);
    expect(skillNames).toEqual(expect.arrayContaining(['TypeScript', 'React']));

    expect(cv.languages.length).toBeGreaterThanOrEqual(2);
    const languageNames = cv.languages.map((l) => l.name);
    expect(languageNames).toEqual(expect.arrayContaining(['English', 'Spanish']));
  });
});

describe('extractLinesFromPdfTextLayer (legacy fixture)', () => {
  it('extracts non-empty lines from the legacy PDF export', async () => {
    const bytes = await loadFixtureBytes();
    const lines = await extractLinesFromPdfTextLayer(bytes);
    expect(lines.length).toBeGreaterThan(20);
    expect(lines[0]).toBe('Bitchiko Tchelidze');
    expect(lines).toContain('PROFESSIONAL SUMMARY');
    expect(lines).toContain('EXPERIENCE');
  });
});

describe('parseCvFromPdfTextLayer (legacy fixture)', () => {
  it('recovers personal info from the legacy PDF', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv).not.toBeNull();
    if (!cv) return;
    expect(cv.personalInfo.fullName).toBe('Bitchiko Tchelidze');
    expect(cv.personalInfo.jobTitle).toBe('Senior .NET Software Engineer');
    expect(cv.personalInfo.email).toBe('bubachelidze1@gmail.com');
    expect(cv.personalInfo.location).toBe('Tbilisi, Georgia');
    expect(cv.personalInfo.website).toContain('bitchiko.dev');
    expect(cv.personalInfo.linkedin).toContain('linkedin.com/in/bitchiko-tchelidze');
  });

  it('recovers professional summary', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv?.personalInfo.summary).toContain('Software Architect');
  });

  it('recovers experience entries with company, dates and description', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv).not.toBeNull();
    if (!cv) return;
    expect(cv.experience.length).toBeGreaterThanOrEqual(3);
    const first = cv.experience[0];
    expect(first.jobTitle).toBe('Software Architect');
    expect(first.company.toLowerCase()).toContain('mettler');
    expect(first.startDate).toBe('May 2022');
    expect(first.isCurrent).toBe(true);
    expect(first.description).toContain('Mettler-Toledo');
  });

  it('recovers open source contributions', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv).not.toBeNull();
    if (!cv) return;
    expect(cv.openSource.length).toBeGreaterThanOrEqual(1);
    const imposter = cv.openSource[0];
    expect(imposter.name).toBe('Imposter');
    expect(imposter.link).toContain('github.com/themidnightgospel/Imposter');
  });

  it('lists every recovered section in sectionsOrder', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv).not.toBeNull();
    if (!cv) return;
    expect(cv.sectionsOrder).toContain('personal');
    expect(cv.sectionsOrder).toContain('experience');
    expect(cv.sectionsOrder).toContain('opensource');
  });

  it('recovers all eight experience entries with correct titles and companies', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv).not.toBeNull();
    if (!cv) return;
    const summarized = cv.experience.map((e) => ({
      jobTitle: e.jobTitle,
      company: e.company,
    }));
    expect(summarized).toEqual([
      { jobTitle: 'Software Architect', company: 'Mettler-Toledo International, Inc' },
      { jobTitle: 'Data Engineer', company: 'Templafy' },
      { jobTitle: 'Senior .NET Back End Developer', company: 'Leap Event Technology' },
      { jobTitle: 'Remote Lead Back End Developer', company: 'Li3ib LLC' },
      { jobTitle: 'Remote Lead Back End Developer', company: 'BCC Elektro-speciaalzaken BV' },
      { jobTitle: 'Remote Senior Software Developer', company: 'WebCreek' },
      { jobTitle: 'Back End Developer', company: 'Wandio' },
      { jobTitle: '.NET Software Developer', company: 'DoSo Management' },
    ]);
  });

  it('keeps the Technologies: line in the description, not in the next entry title', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    expect(cv).not.toBeNull();
    if (!cv) return;
    const wandio = cv.experience.find((e) => e.company === 'Wandio');
    expect(wandio).toBeDefined();
    expect(wandio?.description).toMatch(/Technologies:\s*ASP\.NET Core/);
    expect(cv.experience.map((e) => e.jobTitle)).not.toContain(
      expect.stringMatching(/^Technologies:/i),
    );
  });

  it('handles wrapped sentences without leaking them into the next header', async () => {
    const bytes = await loadFixtureBytes();
    const cv = await parseCvFromPdfTextLayer(bytes);
    if (!cv) throw new Error('parse failed');
    const templafy = cv.experience.find((e) => e.company === 'Templafy');
    expect(templafy?.description).toMatch(
      /Azure’s data\necosystem, strengthening my architectural perspective on data-driven systems$/,
    );
  });
});

describe('parseCvFromTextLines — entry header parsing edge cases', () => {
  it('does not steal description lines as the next entry header', () => {
    const cv = parseCvFromTextLines([
      'Jane Doe',
      'Engineer',
      'EXPERIENCE',
      'Staff Engineer',
      'Acme • Remote',
      'Jan 2022 – Present',
      '- Owned design system',
      'Technologies: TypeScript, React, Node.js',
      'Although this was short, I learned a lot from the experience here',
      'about building reliable systems and shipping quickly to production',
      'Tech Lead',
      'Beta Co • NYC',
      'Mar 2019 – Dec 2021',
      '- Led backend platform team',
    ]);
    expect(cv.experience).toHaveLength(2);
    expect(cv.experience[0].jobTitle).toBe('Staff Engineer');
    expect(cv.experience[0].company).toBe('Acme');
    expect(cv.experience[0].description).toContain('Technologies: TypeScript');
    expect(cv.experience[0].description).toContain(
      'about building reliable systems',
    );
    expect(cv.experience[1].jobTitle).toBe('Tech Lead');
    expect(cv.experience[1].company).toBe('Beta Co');
    expect(cv.experience[1].location).toBe('NYC');
  });

  it('detects current role via Present', () => {
    const cv = parseCvFromTextLines([
      'Pat',
      'Dev',
      'EXPERIENCE',
      'Engineer',
      'X Co • Remote',
      'Jan 2024 – Present',
      '- Doing things',
    ]);
    expect(cv.experience[0].isCurrent).toBe(true);
    expect(cv.experience[0].endDate).toBe('');
    expect(cv.experience[0].startDate).toBe('Jan 2024');
  });

  it('parses education entries with year ranges', () => {
    const cv = parseCvFromTextLines([
      'Pat',
      'Dev',
      'EDUCATION',
      'B.S. Computer Science',
      'University of X • City',
      '2014 – 2018',
      'Honors thesis on distributed systems.',
    ]);
    expect(cv.education).toHaveLength(1);
    expect(cv.education[0].degree).toBe('B.S. Computer Science');
    expect(cv.education[0].institution).toBe('University of X');
    expect(cv.education[0].location).toBe('City');
    expect(cv.education[0].startYear).toBe('2014');
    expect(cv.education[0].endYear).toBe('2018');
    expect(cv.education[0].description).toContain('Honors thesis');
  });
});
