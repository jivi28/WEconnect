import { supabase } from '../../supabaseClient'
import type { CurrentUser, Person, Role } from '../types'

// Real data for the network graph, replacing the static mockData fixtures.
// Maps our actual schema (profiles.role, network_profiles.*, events,
// projects) onto the shapes NetworkGraph/FilterPanel already expect, so none
// of the visual components below needed to change.

function toMindmapRole(role: string): Role {
  return role === 'admin' ? 'expert' : (role as Role)
}

function opportunityTags(row: any): string[] {
  return [...(row.looking_for || []), ...(row.offers || []), ...(row.expertise_tags || []), ...(row.sought_educators || [])]
}

export async function loadNetworkData() {
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id

  const [{ data: myProfile }, { data: myNetwork }, { data: othersNetwork }, { data: allEventRows }, { data: allProjectRows }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('network_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('network_profiles').select('*, profiles(id, name, role)').neq('user_id', userId),
      supabase.from('events').select('id, name'),
      supabase.from('projects').select('id, name')
    ])

  const myInterests = new Set((myNetwork?.interests || []).map((t: string) => t.toLowerCase()))
  const myOpportunity = new Set(opportunityTags(myNetwork || {}).map((t) => t.toLowerCase()))

  const currentUser: CurrentUser = {
    name: myProfile?.name || 'You',
    role: 'Student',
    email: myProfile?.email || '',
    imageUrl: '',
    mainInterests: (myNetwork?.interests || []).join(', ')
  }

  const people: Person[] = (othersNetwork || []).map((row: any) => {
    const sharedInterests = (row.interests || []).filter((t: string) => myInterests.has(t.toLowerCase()))
    const sharedOpportunity = opportunityTags(row).filter((t: string) => myOpportunity.has(t.toLowerCase()))
    const shared = [...sharedInterests, ...sharedOpportunity]
    const role = toMindmapRole(row.profiles?.role || 'student')

    return {
      id: row.profiles?.id || row.user_id,
      name: row.profiles?.name || 'Someone',
      role,
      email: '',
      imageUrl: '',
      mainInterest: row.interests?.[0] || row.expertise_tags?.[0] || row.offers?.[0] || '—',
      projectNames: [],
      sharedInterests: shared,
      sharedEvents: [],
      connectionStrength: Math.min(100, shared.length * 20),
      connectionReason: shared.length ? `${shared.length} shared tag(s)` : 'No shared tags yet'
    }
  })

  const allEvents = (allEventRows || []).map((e: any) => e.name)
  const allProjects = (allProjectRows || []).map((p: any) => p.name)

  return { currentUser, people, allEvents, allProjects }
}
