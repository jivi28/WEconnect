// Renders different fields depending on role. Used in both Signup and Profile,
// so the "different data saved per role" logic lives in one place.
// Add more role-specific fields here as the project needs them.
export const ROLE_FIELD_DEFS = {
  student: [
    { key: 'school', label: 'School', type: 'text' },
    { key: 'fieldOfStudy', label: 'Field of study', type: 'text' },
    { key: 'year', label: 'Year', type: 'text' }
  ],
  educator: [
    { key: 'institution', label: 'Institution', type: 'text' },
    { key: 'subject', label: 'Subject / department', type: 'text' }
  ],
  admin: [
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' }
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
          <input
            type={field.type}
            value={values[field.key] || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </label>
      ))}
    </div>
  )
}
