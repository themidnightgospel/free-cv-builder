import React from 'react';
import type {
  AchievementEntry,
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  Language,
  LanguageLevel,
  ProjectEntry,
  PublicationEntry,
  Skill,
  SkillLevel,
  TalkEntry,
  VolunteerExperienceEntry,
} from '../../types';
import {
  CheckboxField,
  Field,
  MonthField,
  SelectField,
  TextAreaField,
  TextField,
} from './FormField';

const gridClass = 'grid grid-cols-2 gap-3';

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

const LANGUAGE_LEVELS: { value: LanguageLevel; label: string }[] = [
  { value: 'Native', label: 'Native' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Professional', label: 'Professional' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Basic', label: 'Basic' },
];

interface FormProps<T> {
  value: T;
  onChange: (next: T) => void;
}

export const ExperienceForm: React.FC<FormProps<ExperienceEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Job title">
      <TextField
        value={value.jobTitle}
        onChange={(v) => onChange({ ...value, jobTitle: v })}
      />
    </Field>
    <Field label="Company">
      <TextField
        value={value.company}
        onChange={(v) => onChange({ ...value, company: v })}
      />
    </Field>
    <Field label="Location" fullWidth>
      <TextField
        value={value.location}
        onChange={(v) => onChange({ ...value, location: v })}
      />
    </Field>
    <Field label="Start date">
      <MonthField
        value={value.startDate}
        onChange={(v) => onChange({ ...value, startDate: v })}
      />
    </Field>
    <Field label="End date">
      <MonthField
        value={value.isCurrent ? '' : value.endDate}
        onChange={(v) => onChange({ ...value, endDate: v })}
        disabled={value.isCurrent}
      />
    </Field>
    <div className="col-span-2">
      <CheckboxField
        label="I currently work here"
        checked={value.isCurrent}
        onChange={(checked) => onChange({ ...value, isCurrent: checked })}
      />
    </div>
    <Field label="Description (markdown supported)" fullWidth>
      <TextAreaField
        value={value.description}
        onChange={(v) => onChange({ ...value, description: v })}
        placeholder="- Owned the design system…&#10;- Shipped accessibility audit…"
        rows={5}
      />
    </Field>
  </div>
);

export const EducationForm: React.FC<FormProps<EducationEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Degree">
      <TextField
        value={value.degree}
        onChange={(v) => onChange({ ...value, degree: v })}
      />
    </Field>
    <Field label="Institution">
      <TextField
        value={value.institution}
        onChange={(v) => onChange({ ...value, institution: v })}
      />
    </Field>
    <Field label="Location" fullWidth>
      <TextField
        value={value.location}
        onChange={(v) => onChange({ ...value, location: v })}
      />
    </Field>
    <Field label="Start">
      <MonthField
        value={value.startYear}
        onChange={(v) => onChange({ ...value, startYear: v })}
      />
    </Field>
    <Field label="End">
      <MonthField
        value={value.isCurrent ? '' : value.endYear}
        onChange={(v) => onChange({ ...value, endYear: v })}
        disabled={value.isCurrent}
      />
    </Field>
    <div className="col-span-2">
      <CheckboxField
        label="In progress"
        checked={value.isCurrent}
        onChange={(checked) => onChange({ ...value, isCurrent: checked })}
      />
    </div>
    <Field label="Description (markdown supported)" fullWidth>
      <TextAreaField
        value={value.description}
        onChange={(v) => onChange({ ...value, description: v })}
        rows={4}
      />
    </Field>
  </div>
);

export const ProjectForm: React.FC<FormProps<ProjectEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Project name">
      <TextField
        value={value.name}
        onChange={(v) => onChange({ ...value, name: v })}
      />
    </Field>
    <Field label="Your role">
      <TextField
        value={value.role}
        onChange={(v) => onChange({ ...value, role: v })}
      />
    </Field>
    <Field label="Tech stack" fullWidth>
      <TextField
        value={value.techStack}
        onChange={(v) => onChange({ ...value, techStack: v })}
        placeholder="React, TypeScript, PostgreSQL"
      />
    </Field>
    <Field label="Link" fullWidth>
      <TextField
        type="url"
        value={value.link}
        onChange={(v) => onChange({ ...value, link: v })}
        placeholder="https://"
      />
    </Field>
    <Field label="Description (markdown)" fullWidth>
      <TextAreaField
        value={value.description}
        onChange={(v) => onChange({ ...value, description: v })}
        rows={3}
      />
    </Field>
    <Field label="Achievements (markdown)" fullWidth>
      <TextAreaField
        value={value.achievements}
        onChange={(v) => onChange({ ...value, achievements: v })}
        rows={3}
      />
    </Field>
  </div>
);

export const AchievementForm: React.FC<FormProps<AchievementEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Name">
      <TextField
        value={value.name}
        onChange={(v) => onChange({ ...value, name: v })}
      />
    </Field>
    <Field label="Organization">
      <TextField
        value={value.organization}
        onChange={(v) => onChange({ ...value, organization: v })}
      />
    </Field>
    <Field label="Date" fullWidth>
      <TextField
        value={value.date}
        onChange={(v) => onChange({ ...value, date: v })}
        placeholder="Mar 2024"
      />
    </Field>
    <Field label="Context (markdown)" fullWidth>
      <TextAreaField
        value={value.context}
        onChange={(v) => onChange({ ...value, context: v })}
        rows={3}
      />
    </Field>
  </div>
);

export const PublicationForm: React.FC<FormProps<PublicationEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Title" fullWidth>
      <TextField
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
      />
    </Field>
    <Field label="Venue">
      <TextField
        value={value.venue}
        onChange={(v) => onChange({ ...value, venue: v })}
      />
    </Field>
    <Field label="Year">
      <TextField
        value={value.year}
        onChange={(v) => onChange({ ...value, year: v })}
      />
    </Field>
    <Field label="Co-authors" fullWidth>
      <TextField
        value={value.coAuthors}
        onChange={(v) => onChange({ ...value, coAuthors: v })}
      />
    </Field>
    <Field label="Link" fullWidth>
      <TextField
        type="url"
        value={value.link}
        onChange={(v) => onChange({ ...value, link: v })}
        placeholder="https://"
      />
    </Field>
  </div>
);

export const TalkForm: React.FC<FormProps<TalkEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Title" fullWidth>
      <TextField
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
      />
    </Field>
    <Field label="Event">
      <TextField
        value={value.event}
        onChange={(v) => onChange({ ...value, event: v })}
      />
    </Field>
    <Field label="Date">
      <TextField
        value={value.date}
        onChange={(v) => onChange({ ...value, date: v })}
      />
    </Field>
    <Field label="Role" fullWidth>
      <TextField
        value={value.role}
        onChange={(v) => onChange({ ...value, role: v })}
        placeholder="Speaker, Panelist, Workshop facilitator"
      />
    </Field>
    <Field label="Location or link" fullWidth>
      <TextField
        value={value.locationOrLink}
        onChange={(v) => onChange({ ...value, locationOrLink: v })}
      />
    </Field>
  </div>
);

export const VolunteerForm: React.FC<FormProps<VolunteerExperienceEntry>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Organization">
      <TextField
        value={value.organization}
        onChange={(v) => onChange({ ...value, organization: v })}
      />
    </Field>
    <Field label="Role">
      <TextField
        value={value.role}
        onChange={(v) => onChange({ ...value, role: v })}
      />
    </Field>
    <Field label="Location" fullWidth>
      <TextField
        value={value.location}
        onChange={(v) => onChange({ ...value, location: v })}
      />
    </Field>
    <Field label="Start">
      <MonthField
        value={value.startDate}
        onChange={(v) => onChange({ ...value, startDate: v })}
      />
    </Field>
    <Field label="End">
      <MonthField
        value={value.isCurrent ? '' : value.endDate}
        onChange={(v) => onChange({ ...value, endDate: v })}
        disabled={value.isCurrent}
      />
    </Field>
    <div className="col-span-2">
      <CheckboxField
        label="Ongoing"
        checked={value.isCurrent}
        onChange={(checked) => onChange({ ...value, isCurrent: checked })}
      />
    </div>
    <Field label="Responsibilities (markdown)" fullWidth>
      <TextAreaField
        value={value.responsibilities}
        onChange={(v) => onChange({ ...value, responsibilities: v })}
        rows={4}
      />
    </Field>
  </div>
);

export const SkillForm: React.FC<FormProps<Skill>> = ({ value, onChange }) => (
  <div className={gridClass}>
    <Field label="Skill" fullWidth>
      <TextField
        value={value.name}
        onChange={(v) => onChange({ ...value, name: v })}
        placeholder="TypeScript"
      />
    </Field>
    <Field label="Level" fullWidth>
      <SelectField
        value={value.level}
        onChange={(level) =>
          onChange({ ...value, level: (level ?? undefined) as SkillLevel | undefined })
        }
        options={SKILL_LEVELS}
        placeholder="Optional"
      />
    </Field>
  </div>
);

export const LanguageForm: React.FC<FormProps<Language>> = ({
  value,
  onChange,
}) => (
  <div className={gridClass}>
    <Field label="Language" fullWidth>
      <TextField
        value={value.name}
        onChange={(v) => onChange({ ...value, name: v })}
        placeholder="Spanish"
      />
    </Field>
    <Field label="Proficiency" fullWidth>
      <SelectField
        value={value.level}
        onChange={(level) => {
          if (!level) return;
          onChange({ ...value, level: level as LanguageLevel });
        }}
        options={LANGUAGE_LEVELS}
      />
    </Field>
  </div>
);

export const CustomSectionForm: React.FC<FormProps<CustomSection>> = ({
  value,
  onChange,
}) => (
  <div className="space-y-3">
    <Field label="Title">
      <TextField
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
      />
    </Field>
    <Field label="Body (markdown)">
      <TextAreaField
        value={value.body}
        onChange={(v) => onChange({ ...value, body: v })}
        rows={6}
      />
    </Field>
  </div>
);
