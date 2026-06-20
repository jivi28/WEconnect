import Avatar from './Avatar'
import ArrowButton from './ArrowButton'
import type { CurrentUser } from '../types'

const NAV_ITEMS = ['Network', 'Events', 'Projects', 'Interests']

interface HeaderProps {
  currentUser: CurrentUser
  activeNav: string
  onNavChange: (item: string) => void
}

export default function Header({ currentUser, activeNav, onNavChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-ink">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand-red text-[13px] font-extrabold tracking-tight text-white">
            WE
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[14px] font-extrabold uppercase tracking-tight text-white">
              WU Elektronik <span className="text-brand-red">Connect</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-graymed">
              Connection Network
            </p>
          </div>
        </div>

        <div className="hidden max-w-md flex-1 items-center rounded-sm bg-white/10 px-3 py-2 lg:flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#959595" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search people, projects, events..."
            className="ml-2 w-full bg-transparent text-sm text-white placeholder:text-graymed focus:outline-none"
          />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => onNavChange(item)}
              className={`border-b-2 px-3 py-2 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                activeNav === item
                  ? 'border-brand-red text-white'
                  : 'border-transparent text-graymed hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            className="rounded-sm p-2 text-graymed transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <button className="group hidden items-center gap-0 overflow-hidden sm:flex">
            <span className="bg-white px-3.5 py-[7px] text-[12px] font-bold uppercase tracking-wide text-ink">
              Find Connections
            </span>
            <ArrowButton size={28} />
          </button>

          <button className="flex items-center gap-2 rounded-full ring-1 ring-white/20 hover:ring-brand-red">
            <Avatar
              name={currentUser.name}
              imageUrl={currentUser.imageUrl}
              tone="red"
              className="h-8 w-8 rounded-full text-xs"
            />
          </button>
        </div>
      </div>
    </header>
  )
}
