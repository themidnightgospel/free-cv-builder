/*
 * Test CV seeder for Free CV Builder.
 *
 * HOW TO USE
 * ----------
 * 1. Open the running app (npm run dev) in the browser.
 * 2. Open devtools -> Console.
 * 3. Paste the ENTIRE contents of this file and hit Enter.
 *
 * The script upserts each CV below into localStorage by a STABLE id, so:
 *   - it never wipes your other saved CVs,
 *   - re-running it just refreshes the test data (no duplicates),
 *   - it then points `currentCvId` at the first CV and reloads, dropping you
 *     straight into the editor with it.
 *
 * Add more personas by pushing another { id, name, cv } onto TEST_CVS.
 */
(() => {
  const SAVED_KEY = 'freeCvBuilder:savedCvFiles';
  const CURRENT_KEY = 'freeCvBuilder:currentCvId';

  const DEFAULT_FONT_SETTINGS = {
    fullName: 28,
    jobTitle: 12,
    contactDetail: 12,
    sectionTitle: 12,
    sectionItemTitle: 14,
    sectionDetail: 12,
  };

  const DEFAULT_ADVANCED_SETTINGS = {
    sectionGapPx: 8,
    lineHeight: 1.5,
    accentColor: '#2563eb',
    showSectionDividers: false,
    pagePaddingXPx: 16,
    pagePaddingYPx: 12,
    paragraphSpacingPx: 4,
  };

  // ---------------------------------------------------------------------------
  // Persona 1: Python backend engineer, ~7 years, 4 roles, Tbilisi.
  // ---------------------------------------------------------------------------
  const pythonBackendCv = {
    personalInfo: {
      fullName: 'Giorgi Beridze',
      jobTitle: 'Senior Backend Engineer',
      summary:
        'Backend engineer with 7 years building and scaling Python web services. ' +
        'Focused on clean REST/GraphQL APIs, reliable data models, and the boring ' +
        'operational details that keep services up — observability, queues, and ' +
        'sensible database design. Comfortable owning a service end to end and ' +
        'mentoring the engineers around it.',
      email: 'giorgi.beridze@example.com',
      phone: '+995 555 12 34 56',
      location: 'Tbilisi, Georgia',
      website: 'https://github.com/gberidze',
      linkedin: 'https://www.linkedin.com/in/giorgi-beridze',
      photoDataUrl: null,
    },
    experience: [
      {
        id: 'exp-1',
        jobTitle: 'Senior Backend Engineer / Tech Lead',
        company: 'Brightloop',
        location: 'Remote (Berlin HQ)',
        startDate: 'Oct 2024',
        endDate: '',
        isCurrent: true,
        description:
          '- Lead a 4-engineer backend team building the billing and subscriptions platform on FastAPI and PostgreSQL.\n' +
          '- Designed an event-driven payments flow on Kafka + Celery, cutting reconciliation lag from hours to under a minute.\n' +
          '- Introduced contract tests and a staged rollout pipeline, dropping production incidents on releases by ~70%.\n' +
          '- Mentor two mid-level engineers through weekly design reviews and pairing.',
      },
      {
        id: 'exp-2',
        jobTitle: 'Senior Backend Engineer',
        company: 'Orbi Pay',
        location: 'Tbilisi, Georgia',
        startDate: 'Jul 2022',
        endDate: 'Sep 2024',
        isCurrent: false,
        description:
          '- Built core ledger and transfer APIs (Django REST Framework) for a fintech app serving 200k+ users.\n' +
          '- Migrated a monolith hot path to async FastAPI services, improving p95 latency from 480ms to 120ms.\n' +
          '- Hardened the auth stack (OAuth2, rate limiting, idempotency keys) ahead of a PCI audit.\n' +
          '- Set up Grafana/Prometheus dashboards and on-call runbooks adopted across the backend org.',
      },
      {
        id: 'exp-3',
        jobTitle: 'Backend Engineer',
        company: 'Saturn Digital',
        location: 'Tbilisi, Georgia',
        startDate: 'Jan 2021',
        endDate: 'Jun 2022',
        isCurrent: false,
        description:
          '- Shipped REST APIs in Django + PostgreSQL for a B2B logistics dashboard.\n' +
          '- Moved scheduled jobs onto Celery + Redis, replacing brittle cron scripts and cutting failed runs to near zero.\n' +
          '- Containerized services with Docker and helped move CI to GitHub Actions, halving deploy time.',
      },
      {
        id: 'exp-4',
        jobTitle: 'Junior Python Developer',
        company: 'Kavea Tech',
        location: 'Tbilisi, Georgia',
        startDate: 'Aug 2019',
        endDate: 'Dec 2020',
        isCurrent: false,
        description:
          '- Built internal tools and Flask microservices for a small product team.\n' +
          '- Wrote the first pytest suite for the codebase, raising coverage from ~10% to 65%.\n' +
          '- Automated weekly reporting with pandas, saving the ops team several hours a week.',
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'B.Sc. Computer Science',
        institution: 'Georgian Technical University',
        location: 'Tbilisi, Georgia',
        startYear: '2015',
        endYear: '2019',
        isCurrent: false,
        description: 'Focus on databases and distributed systems.',
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'pgwatch-lite',
        role: 'Author',
        techStack: 'Python, FastAPI, PostgreSQL, Prometheus',
        description:
          'A small self-hosted dashboard that tracks slow queries and connection pool health for Postgres.',
        achievements:
          '- ~600 GitHub stars\n- Used by a handful of small teams in production',
        link: 'https://github.com/gberidze/pgwatch-lite',
      },
    ],
    achievements: [],
    publications: [],
    talks: [],
    volunteer: [],
    openSource: [],
    skills: [
      { id: 'sk-1', name: 'Python', level: 'Advanced' },
      { id: 'sk-2', name: 'Django / DRF', level: 'Advanced' },
      { id: 'sk-3', name: 'FastAPI', level: 'Advanced' },
      { id: 'sk-4', name: 'PostgreSQL', level: 'Advanced' },
      { id: 'sk-5', name: 'Redis', level: 'Advanced' },
      { id: 'sk-6', name: 'Celery', level: 'Advanced' },
      { id: 'sk-7', name: 'Docker', level: 'Advanced' },
      { id: 'sk-8', name: 'Kubernetes', level: 'Intermediate' },
      { id: 'sk-9', name: 'AWS', level: 'Intermediate' },
      { id: 'sk-10', name: 'Kafka', level: 'Intermediate' },
      { id: 'sk-11', name: 'GraphQL', level: 'Intermediate' },
      { id: 'sk-12', name: 'pytest', level: 'Advanced' },
    ],
    languages: [
      { id: 'lang-1', name: 'Georgian', level: 'Native' },
      { id: 'lang-2', name: 'English', level: 'Professional' },
      { id: 'lang-3', name: 'Russian', level: 'Intermediate' },
    ],
    customSections: [],
    sectionsOrder: [
      'personal',
      'experience',
      'projects',
      'skills',
      'education',
      'languages',
    ],
    fontSettings: { ...DEFAULT_FONT_SETTINGS },
    advancedSettings: { ...DEFAULT_ADVANCED_SETTINGS },
  };

  // ---------------------------------------------------------------------------
  // Registry of test CVs. Add more personas here later.
  // `id` MUST stay stable so re-running upserts instead of duplicating.
  // ---------------------------------------------------------------------------
  const TEST_CVS = [
    {
      id: 'test-python-backend',
      name: 'Giorgi Beridze',
      cv: pythonBackendCv,
    },
  ];

  // --- upsert into localStorage --------------------------------------------
  let existing = [];
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) existing = parsed;
  } catch (err) {
    console.warn('[seed] could not parse existing saved CVs, starting fresh', err);
  }

  const now = Date.now();
  const byId = new Map(existing.map((r) => [r.id, r]));
  for (const entry of TEST_CVS) {
    byId.set(entry.id, {
      id: entry.id,
      name: entry.name,
      updatedAt: now,
      cv: entry.cv,
    });
  }

  const next = Array.from(byId.values());
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  window.localStorage.setItem(CURRENT_KEY, TEST_CVS[0].id);

  console.log(
    `[seed] upserted ${TEST_CVS.length} test CV(s); ${next.length} total saved. Reloading…`,
  );
  window.location.reload();
})();
