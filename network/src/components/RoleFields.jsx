import { BUSINESS_UNITS, FIELDS_OF_STUDY, SEMESTERS, SITES } from '../constants/options'

// Renders different fields depending on role. Used in both Signup and Profile,
// so the "different data saved per role" logic lives in one place.
// Add more role-specific fields here as the project needs them.
export const ROLE_FIELD_DEFS = {
  student: [
    { key: 'school', label: 'School', type: 'text' },
    { key: 'fieldOfStudy', label: 'Field of study', type: 'select', options: FIELDS_OF_STUDY },
    { key: 'semester', label: 'Semester', type: 'select', options: SEMESTERS },
    { key: 'linkedinUrl', label: 'LinkedIn (optional)', type: 'text' }
  ],
  educator: [
    { key: 'institution', label: 'Institution', type: 'text' },
    { key: 'subject', label: 'Subject / department', type: 'select', options: FIELDS_OF_STUDY },
    { key: 'linkedinUrl', label: 'LinkedIn (optional)', type: 'text' }
  ],
  wurth_employee: [
    { key: 'site', label: 'Standort (site)', type: 'select', options: SITES },
    { key: 'businessUnit', label: 'Business unit / Abteilung', type: 'select', options: BUSINESS_UNITS },
    { key: 'linkedinUrl', label: 'LinkedIn (optional)', type: 'text' }
  ]
}

export default function RoleFields({ role, values, onChange }) {
  const defs = ROLE_FIELD_DEFS[role] || []

  if (defs.length === 0) return null

  return (
    <div className="role-fields">
      {defs.map((field) => (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          {field.type === 'select' ? (
            <select value={values[field.key] || ''} onChange={(e) => onChange(field.key, e.target.value)}>
              <option value="" disabled>
                Select…
              </option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  )
}
