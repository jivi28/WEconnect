import { supabase } from '../../supabaseClient'
import { computeMatchStrength, strengthTier } from '../../lib/matching'
import type { CurrentUser, Person, Role } from '../types'

// Real data for the network graph, replacing the static mockData fixtures.
// Maps our actual schema (profiles.role and network_profiles.*) onto the
// shapes NetworkGraph/FilterPanel expect, so none
// of the visual components below needed to change.

function toMindmapRole(role: string): Role {
  return role === 'wurth_employee' ? 'expert' : (role as Role)
}

function opportunityTags(row: any): string[] {
  return [...(row.looking_for || []), ...(row.offers || []), ...(row.expertise_tags || []), ...(row.sought_educators || [])]
}

// computeMatchStrength() needs role and role_data flattened directly onto
// the person object (role_data lives on `profiles`, not `network_profiles`).
function toMatchPerson(
  networkRow: any,
  role: string | undefined,
  roleData: Record<string, unknown> | undefined
) {
  return { ...networkRow, role, ...(roleData || {}) }
}

export async function loadNetworkData() {
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id

  const [
    { data: myProfile },
    { data: myNetwork },
    { data: othersNetworkRaw }
  ] = await Promise.all([
    // Excludes `email`: the profiles table only grants that column to the
    // owning row's auth.uid() / wurth_employee accounts at the DB level (see
    // supabase/schema.sql), so a blanket select('*') would be rejected.
    // The signed-in user's own email comes from the auth session instead.
    supabase.from('profiles').select('id, name, role, role_data, created_at').eq('id', userId).single(),
    supabase.from('network_profiles').select('*').eq('user_id', userId).maybeSingle(),
    // No FK exists from network_profiles.user_id to profiles (both
    // reference auth.users, which isn't even exposed to the API), so
    // PostgREST can't auto-embed `profiles(...)` here — it silently errors
    // and returns null. Fetch profiles separately and merge below instead.
    supabase.from('network_profiles').select('*').neq('user_id', userId)
  ])

  const otherIds = (othersNetworkRaw || []).map((row: any) => row.user_id)
  const [{ data: otherProfiles }, { data: visibleEmails }] = otherIds.length
    ? await Promise.all([
        supabase.from('profiles').select('id, name, role, role_data').in('id', otherIds),
        // Server-side gated: get_profile_emails() only returns rows the
        // caller is actually allowed to see (self, wurth_employee seeing
        // anyone, or student/educator seeing a wurth_employee) — see
        // supabase/schema.sql. Everyone else's row is simply omitted, not
        // returned with a null email, so this can't leak who's hidden.
        supabase.rpc('get_profile_emails', { target_ids: otherIds })
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }]
  const profileById = Object.fromEntries((otherProfiles || []).map((p: any) => [p.id, p]))
  const emailById = Object.fromEntries((visibleEmails || []).map((row: any) => [row.id, row.email]))
  const othersNetwork = (othersNetworkRaw || []).map((row: any) => ({ ...row, profiles: profileById[row.user_id] || null }))

  const myInterests = new Set((myNetwork?.interests || []).map((t: string) => t.toLowerCase()))
  const myOpportunity = new Set(opportunityTags(myNetwork || {}).map((t) => t.toLowerCase()))

  const myPerson = toMatchPerson(myNetwork || {}, myProfile?.role, myProfile?.role_data)

  const currentUser: CurrentUser = {
    name: myProfile?.name || 'You',
    role: 'Student',
    email: authData.user?.email || '',
    imageUrl: '',
    mainInterests: (myNetwork?.interests || []).join(', ')
  }

  // computeMatchStrength() assumes well-formed tag arrays (no null entries,
  // string-typed role_data fields). Dummy/seed rows aren't guaranteed to be
  // clean, and Array.prototype.map aborts entirely on the first exception —
  // one malformed row would otherwise wipe out all 216 nodes instead of
  // just that one. Isolate each row so a bad row degrades, not crashes.
  const people: Person[] = (othersNetwork || []).flatMap((row: any): Person[] => {
    try {
      const sharedInterests = (row.interests || []).filter((t: string) => myInterests.has(String(t).toLowerCase()))
      const sharedOpportunity = opportunityTags(row).filter((t: string) => myOpportunity.has(String(t).toLowerCase()))
      const shared = [...sharedInterests, ...sharedOpportunity]
      const role = toMindmapRole(row.profiles?.role || 'student')

      const matchPerson = toMatchPerson(row, row.profiles?.role, row.profiles?.role_data)
      const connectionStrength = computeMatchStrength(myPerson, matchPerson)
      const tier = strengthTier(connectionStrength)

      let connectionReason = 'No shared tags yet'
      if (shared.length > 0) connectionReason = `${shared.length} shared tag(s)`
      else if (connectionStrength > 0) connectionReason = tier === 'strong' ? 'Strong profile match' : 'Some profile overlap'

      return [
        {
          id: row.profiles?.id || row.user_id,
          name: row.profiles?.name || 'Someone',
          role,
          imageUrl: '',
          mainInterest: row.interests?.[0] || row.expertise_tags?.[0] || row.offers?.[0] || '—',
          sharedInterests: shared,
          connectionStrength,
          connectionReason,
          email: emailById[row.profiles?.id || row.user_id]
        }
      ]
    } catch (err) {
      console.error('Skipping malformed network_profiles row while building mind map:', row, err)
      return []
    }
  })

  if (import.meta.env.DEV) {
    const scores = people.map((person) => person.connectionStrength)
    console.log('[mindmap debug]', {
      currentUserId: userId || null,
      currentUserHasProfile: Boolean(myProfile),
      currentUserHasNetworkProfile: Boolean(myNetwork),
      networkProfilesFetched: (othersNetworkRaw || []).length,
      profilesFetched: (otherProfiles || []).length,
      rowsMissingProfile: othersNetwork.filter((row: any) => !row.profiles).length,
      nodesBuilt: people.length,
      uniqueScores: [...new Set(scores)].sort((a, b) => b - a),
      highestScore: scores.length ? Math.max(...scores) : null,
      lowestScore: scores.length ? Math.min(...scores) : null
    })
  }

  return { currentUser, people }
}
