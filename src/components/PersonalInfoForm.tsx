import React, { useMemo, useState } from 'react';
import type { PersonalInfo } from '../types';

export interface PersonalInfoFormProps {
  personalInfo: PersonalInfo;
  onChange: (value: PersonalInfo) => void;
  onPhotoUpload: (file: File) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  personalInfo,
  onChange,
  onPhotoUpload,
}) => {
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedName, setTouchedName] = useState(false);

  const emailError = useMemo(() => {
    if (!touchedEmail) return '';
    if (!personalInfo.email.trim()) return 'Email is required.';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(personalInfo.email)) return 'Email format is invalid.';
    return '';
  }, [personalInfo.email, touchedEmail]);

  const nameError =
    touchedName && !personalInfo.fullName.trim()
      ? 'Full name is required.'
      : '';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Personal Info</h2>
        <p className="text-xs text-slate-500">
          This appears at the top of your CV.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`mt-1 block w-full rounded-md border px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nameError ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
              value={personalInfo.fullName}
              onChange={(e) =>
                onChange({ ...personalInfo, fullName: e.target.value })
              }
              onBlur={() => setTouchedName(true)}
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-600">{nameError}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Job Title
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={personalInfo.jobTitle}
              onChange={(e) =>
                onChange({ ...personalInfo, jobTitle: e.target.value })
              }
              placeholder="Software Engineer, Product Designer, etc."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Professional Summary / Objective
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={personalInfo.summary}
              onChange={(e) =>
                onChange({ ...personalInfo, summary: e.target.value })
              }
              placeholder="2–4 lines summarizing your experience and goals. Markdown supported."
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Tip: use {'**bold**'} for key phrases and {'*bullets*'} with markdown if needed.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={`mt-1 block w-full rounded-md border px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailError ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
                value={personalInfo.email}
                onChange={(e) =>
                  onChange({ ...personalInfo, email: e.target.value })
                }
                onBlur={() => setTouchedEmail(true)}
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Phone
              </label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={personalInfo.phone}
                onChange={(e) =>
                  onChange({ ...personalInfo, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={personalInfo.location}
                onChange={(e) =>
                  onChange({ ...personalInfo, location: e.target.value })
                }
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                LinkedIn URL
              </label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={personalInfo.linkedin}
                onChange={(e) =>
                  onChange({ ...personalInfo, linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/in/you"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Personal Website
              </label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={personalInfo.website}
                onChange={(e) =>
                  onChange({ ...personalInfo, website: e.target.value })
                }
                placeholder="https://your-portfolio.com"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Profile Photo
            </label>
            <div className="mt-2 flex flex-col items-center gap-2">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                {personalInfo.photoDataUrl ? (
                  <img
                    src={personalInfo.photoDataUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 text-center px-2">
                    No photo
                  </span>
                )}
              </div>
              <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPhotoUpload(file);
                  }}
                />
              </label>
              {personalInfo.photoDataUrl && (
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={() =>
                    onChange({ ...personalInfo, photoDataUrl: null })
                  }
                >
                  Remove
                </button>
              )}
              <p className="mt-1 text-[10px] text-slate-400 text-center">
                Recommended: square image at least 400×400px.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
