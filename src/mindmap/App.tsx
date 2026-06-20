import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import FilterPanel from './components/FilterPanel'
import NetworkGraph from './components/NetworkGraph'
import SelectedConnectionPanel from './components/SelectedConnectionPanel'
import type { ChipKey } from './components/FilterChips'
import { loadNetworkData } from './data/liveData'
import type { CurrentUser, Filters, Person, Role } from './types'

const INITIAL_FILTERS: Filters = {
  roles: { student: true, educator: true, expert: true },
  minStrength: 0,
  interestQuery: '',
  eventFilter: '',
  projectFilter: ''
}

export default function App() {
  // When embedded in the app's own iframe (Network tab's "Show network"),
  // the app already has its own persistent header — skip rendering this
  // page's header so there's only one. Visiting mindmap.html directly still
  // shows it.
  const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === '1'

  const [activeNav, setActiveNav] = useState('Network')
  const [activeChip, setActiveChip] = useState<ChipKey>('all')
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [allEvents, setAllEvents] = useState<string[]>([])
  const [allProjects, setAllProjects] = useState<string[]>([])

  useEffect(() => {
    loadNetworkData()
      .then((d) => {
        setCurrentUser(d.currentUser)
        setPeople(d.people)
        setAllEvents(d.allEvents)
        setAllProjects(d.allProjects)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      if (!filters.roles[person.role]) return false
      if (person.connectionStrength < filters.minStrength) return false
      if (activeChip === 'strongest' && person.connectionStrength < 75) return false
      if (activeChip !== 'all' && activeChip !== 'strongest' && person.role !== activeChip) return false
      if (filters.eventFilter && !person.sharedEvents.includes(filters.eventFilter)) return false
      if (filters.projectFilter && !person.projectNames.includes(filters.projectFilter)) return false
      if (filters.interestQuery) {
        const q = filters.interestQuery.toLowerCase()
        const haystack = [person.mainInterest, ...person.sharedInterests].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [filters, activeChip])

  const selectedPerson = selectedId ? people.find((p) => p.id === selectedId) ?? null : null

  function toggleRole(role: Role) {
    setFilters((f) => ({ ...f, roles: { ...f.roles, [role]: !f.roles[role] } }))
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-soft text-graydark">Loading network…</div>
  }

  if (loadError || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft text-graydark">
        Couldn't load your network — log in via the main app first, then open this page.
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-soft">
      {!isEmbedded && <Header currentUser={currentUser} activeNav={activeNav} onNavChange={setActiveNav} />}
      <Hero activeChip={activeChip} onChipChange={setActiveChip} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-6 pb-8 lg:flex-row">
        <div className="order-2 lg:order-1 lg:w-[280px] lg:shrink-0">
          <FilterPanel
            filters={filters}
            onToggleRole={toggleRole}
            onMinStrengthChange={(v) => setFilters((f) => ({ ...f, minStrength: v }))}
            onInterestQueryChange={(v) => setFilters((f) => ({ ...f, interestQuery: v }))}
            onEventFilterChange={(v) => setFilters((f) => ({ ...f, eventFilter: v }))}
            onProjectFilterChange={(v) => setFilters((f) => ({ ...f, projectFilter: v }))}
            events={allEvents}
            projects={allProjects}
          />
        </div>

        <div className="order-1 h-[560px] lg:order-2 lg:h-[calc(100vh-220px)] lg:flex-1">
          <NetworkGraph
            currentUser={currentUser}
            people={filteredPeople}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={setHoveredId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="order-3 lg:w-[300px] lg:shrink-0">
          <div className="lg:h-[calc(100vh-220px)]">
            <SelectedConnectionPanel person={selectedPerson} />
          </div>
        </div>
      </main>
    </div>
  )
}
