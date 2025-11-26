import type { CvData, SectionId } from '../types';
import { generateId } from '../utils/uuid';
import { DEFAULT_FONT_SETTINGS } from './cvModel';

export const createSampleCv = (): CvData => {
  const makeId = () => generateId();
  const customSections = [
    {
      id: makeId(),
      title: 'Community Leadership',
      body: `### Community Programs
- Organized quarterly meetups focused on accessibility testing.
- Built a mentorship circle pairing mid-level engineers with students.`,
    },
    {
      id: makeId(),
      title: 'Professional Development',
      body: `- Mentor three junior engineers through monthly growth sessions.
- Curate a "What's New in Frontend" internal newsletter every sprint.`,
    },
  ];
  const customSectionIds: SectionId[] = customSections.map(
    (section) => `custom:${section.id}` as SectionId,
  );

  return {
    personalInfo: {
      fullName: 'Jordan Rivera',
      jobTitle: 'Senior Frontend Engineer',
      summary:
        'Product-minded engineer with a focus on accessibility, design systems, and data visualization for SaaS platforms.',
      email: 'jordan.rivera@example.com',
      phone: '+1 (555) 000-1234',
      location: 'Remote / NYC timezone',
      website: 'https://jordanrivera.dev',
      linkedin: 'https://www.linkedin.com/in/jordanrivera',
      photoDataUrl: null,
    },
    experience: [
      {
        id: makeId(),
        jobTitle: 'Lead Frontend Engineer',
        company: 'Aurora Analytics',
        location: 'Remote',
        startDate: 'Mar 2021',
        endDate: '',
        isCurrent: true,
        description:
          '- Own the company design system and accessibility guidelines.\n- Partner with PMs to ship experimentation tooling used by 45+ teams.',
      },
      {
        id: makeId(),
        jobTitle: 'Senior UI Engineer',
        company: 'Northwind Labs',
        location: 'Austin, TX',
        startDate: 'Jan 2018',
        endDate: 'Feb 2021',
        isCurrent: false,
        description:
          '- Implemented streaming dashboards for IoT fleet metrics.\n- Lifted Lighthouse performance scores from 68 to 94.',
      },
      {
        id: makeId(),
        jobTitle: 'Frontend Chapter Lead',
        company: 'Summit HR',
        location: 'Denver, CO',
        startDate: 'Mar 2016',
        endDate: 'Dec 2017',
        isCurrent: false,
        description:
          '- Led a guild of 14 engineers focusing on design system adoption.\n- Shipped internal UI kit used by recruiting pods worldwide.',
      },
      {
        id: makeId(),
        jobTitle: 'Product Engineer',
        company: 'Beacon CRM',
        location: 'Remote',
        startDate: 'May 2014',
        endDate: 'Feb 2016',
        isCurrent: false,
        description:
          '- Built reporting dashboards that increased CSAT visibility.\n- Partnered with PMs to run weekly customer feedback sessions.',
      },
      {
        id: makeId(),
        jobTitle: 'UI Engineer II',
        company: 'Hudson Analytics',
        location: 'Chicago, IL',
        startDate: 'Jun 2012',
        endDate: 'Apr 2014',
        isCurrent: false,
        description:
          '- Migrated legacy Backbone flows to React without downtime.\n- Authored accessibility checklist adopted across the org.',
      },
      {
        id: makeId(),
        jobTitle: 'Frontend Engineer',
        company: 'Brightside Media',
        location: 'Seattle, WA',
        startDate: 'Jul 2010',
        endDate: 'May 2012',
        isCurrent: false,
        description:
          '- Created marketing landing page generator powering 200+ launches.\n- Introduced performance budgets and bundle analysis tooling.',
      },
      {
        id: makeId(),
        jobTitle: 'Web Developer',
        company: 'PixelSmith Studio',
        location: 'Portland, OR',
        startDate: 'Jun 2009',
        endDate: 'Jun 2010',
        isCurrent: false,
        description:
          '- Built client microsites with custom CMS widgets.\n- Mentored two interns on semantic HTML and CSS architecture.',
      },
      {
        id: makeId(),
        jobTitle: 'Junior Developer',
        company: 'InnoTech Labs',
        location: 'San Diego, CA',
        startDate: 'Aug 2007',
        endDate: 'May 2009',
        isCurrent: false,
        description:
          '- Coded UI components for medical device dashboards.\n- Wrote regression suites covering mission-critical workflows.',
      },
    ],
    education: [
      {
        id: makeId(),
        degree: 'B.S. Computer Science',
        institution: 'University of Washington',
        location: 'Seattle, WA',
        startYear: '2012',
        endYear: '2016',
        isCurrent: false,
        description:
          'Concentration in Human-Computer Interaction. Minor in Design.',
      },
    ],
    projects: [
      {
        id: makeId(),
        name: 'CaseBuilder',
        role: 'Product Engineer',
        techStack: 'React, Zustand, Tailwind',
        description:
          'Workflow builder for legal teams drafting repeatable case packets.',
        achievements:
          '- Cut drafting time by 60%\n- Adopted by 12 enterprise law firms within 6 months',
        link: 'https://casebuilder.app',
      },
    ],
    achievements: [
      {
        id: makeId(),
        name: 'Grace Hopper Scholar',
        organization: 'AnitaB.org',
        date: '2023',
        context:
          'Selected for contributions to inclusive developer tooling initiatives.',
      },
    ],
    publications: [
      {
        id: makeId(),
        title: 'Design Systems that Scale',
        venue: 'Frontend Futures Magazine',
        year: '2024',
        coAuthors: 'Ava Patel',
        link: 'https://frontendfutures.dev/design-systems',
      },
    ],
    talks: [
      {
        id: makeId(),
        title: 'Measuring UX in Developer Tools',
        event: 'React Summit',
        date: 'Jun 2024',
        role: 'Speaker',
        locationOrLink: 'Amsterdam / livestream replay',
      },
    ],
    volunteer: [
      {
        id: makeId(),
        organization: 'Girls Who Code',
        role: 'Mentor',
        location: 'Remote',
        startDate: '2022',
        endDate: '',
        isCurrent: true,
        responsibilities:
          '- Lead weekly sessions for twelve high-school students.\n- Designed project-based curriculum covering JS fundamentals.',
      },
    ],
    openSource: [
      {
        id: makeId(),
        name: 'Prisma Dashboard',
        role: 'Maintainer',
        techStack: 'Next.js, GraphQL, Prisma',
        description: 'Extensible admin UI for inspecting Prisma schemas.',
        achievements:
          '- Added real-time query console\n- Introduced plugin API adopted by community contributors',
        link: 'https://github.com/jordanrivera/prisma-dashboard',
      },
    ],
    skills: [
      { id: makeId(), name: 'TypeScript', level: 'Advanced' },
      { id: makeId(), name: 'React', level: 'Advanced' },
      { id: makeId(), name: 'Node.js', level: 'Intermediate' },
      { id: makeId(), name: 'Design Systems', level: 'Advanced' },
    ],
    languages: [
      { id: makeId(), name: 'English', level: 'Native' },
      { id: makeId(), name: 'Spanish', level: 'Professional' },
    ],
    customSections,
    sectionsOrder: [
      'personal',
      'experience',
      'projects',
      'education',
      'skills',
      'languages',
      'volunteer',
      'opensource',
      'achievements',
      'publications',
      'talks',
      ...customSectionIds,
    ],
    fontSettings: { ...DEFAULT_FONT_SETTINGS },
  };
};
