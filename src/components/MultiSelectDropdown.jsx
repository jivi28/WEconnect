import { useEffect, useRef, useState } from 'react'

export default function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOption(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option))
    } else {
      onChange([...selected, option])
    }
  }

  function removeOption(option) {
    onChange(selected.filter((o) => o !== option))
  }

  return (
    <div className="multiselect" ref={containerRef}>
      <button
        type="button"
        className={`multiselect-button ${open ? 'multiselect-button-active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>
          {label}
          {selected.length > 0 ? ` (${selected.length} selected)` : ''}
        </span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="multiselect-panel">
          {options.map((option) => (
            <label key={option} className="multiselect-option">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => toggleOption(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="tag-row">
          {selected.map((option) => (
            <span key={option} className="tag">
              {option}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removeOption(option)}
                aria-label={`Remove ${option}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
