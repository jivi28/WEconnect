import { useState } from 'react'

function initials(name: string) {
  return name
    .replace(/^(Dr\.|Prof\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

interface AvatarProps {
  name: string
  imageUrl: string
  className?: string
  tone?: 'red' | 'grey'
}

export default function Avatar({ name, imageUrl, className = '', tone = 'grey' }: AvatarProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center font-bold ${
          tone === 'red' ? 'bg-brand-redSoft text-brand-red' : 'bg-soft text-graydark'
        } ${className}`}
      >
        {initials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      draggable={false}
    />
  )
}
