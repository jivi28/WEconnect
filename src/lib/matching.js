function toSet(arr) { return new Set((arr || []).map((t) => t.toLowerCase())) }

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return null
  const shared = [...a].filter((x) => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? null : shared / union
}

function exactMatch(a, b) {
  if (!a || !b) return null
  return a.toLowerCase() === b.toLowerCase() ? 1 : 0
}

function mappedCoverage(wantedTags, mapTable, availableTags) {
  if (!wantedTags || wantedTags.length === 0) return null
  const available = toSet(availableTags)
  const hits = wantedTags.filter((tag) => {
    const mapped = mapTable[tag.toLowerCase()] || []
    return mapped.some((m) => available.has(m))
  }).length
  return hits / wantedTags.length
}

const STUDENT_WANT_TO_EDUCATOR_OFFER = {
  'abschlussarbeit': ['projektarbeit-betreuung'],
  'praktikum': ['laborpraktikum'],
  'werkstudium': ['laborpraktikum', 'projektarbeit-betreuung'],
  'bachelorprogramm': ['projektarbeit-betreuung', 'laborpraktikum'],
  'masterprogramm': ['projektarbeit-betreuung', 'laborpraktikum'],
  'kostenlose bauteile': ['kostenlose bauteile für die lehre']
}

const EDUCATOR_OFFER_TO_ADMIN_SOUGHT = {
  'laborpraktikum': ['laborpraktikum-betreuer'],
  'projektarbeit-betreuung': ['projektarbeit-betreuer', 'professor/dozent'],
  'hochschulgruppen-förderung': ['hochschulgruppen-berater'],
  'gastvortrag / expertenvortrag': ['professor/dozent']
}

function topicalOverlap(a, b) {
  return jaccard(
    toSet([...(a.interests || []), ...(a.expertise_tags || [])]),
    toSet([...(b.interests || []), ...(b.expertise_tags || [])])
  )
}

function studentStudent(a, b) {
  return [
    { score: jaccard(toSet(a.looking_for), toSet(b.looking_for)), weight: 3 },
    { score: exactMatch(a.fieldOfStudy, b.fieldOfStudy), weight: 2 },
    { score: exactMatch(a.school, b.school), weight: 1 },
    { score: topicalOverlap(a, b), weight: 1 }
  ]
}

function studentEducator(student, educator) {
  return [
    { score: mappedCoverage(student.looking_for, STUDENT_WANT_TO_EDUCATOR_OFFER, educator.offers), weight: 3 },
    { score: exactMatch(student.fieldOfStudy, educator.subject), weight: 3 },
    { score: topicalOverlap(student, educator), weight: 1 }
  ]
}

function studentWurthEmployee(student, wurthEmployee) {
  return [
    { score: jaccard(toSet(student.looking_for), toSet(wurthEmployee.looking_for)), weight: 4 },
    { score: topicalOverlap(student, wurthEmployee), weight: 1 }
  ]
}

function educatorEducator(a, b) {
  return [
    { score: exactMatch(a.subject, b.subject), weight: 2 },
    { score: jaccard(toSet(a.expertise_tags), toSet(b.expertise_tags)), weight: 2 },
    { score: jaccard(toSet(a.offers), toSet(b.offers)), weight: 1 },
    { score: topicalOverlap(a, b), weight: 1 }
  ]
}

function educatorWurthEmployee(educator, wurthEmployee) {
  return [
    { score: mappedCoverage(educator.offers, EDUCATOR_OFFER_TO_ADMIN_SOUGHT, wurthEmployee.sought_educators), weight: 3 },
    { score: jaccard(toSet(educator.expertise_tags), toSet(wurthEmployee.expertise_tags)), weight: 3 },
    { score: topicalOverlap(educator, wurthEmployee), weight: 1 }
  ]
}

function wurthEmployeeWurthEmployee(a, b) {
  return [
    { score: exactMatch(a.site, b.site), weight: 1 },
    { score: exactMatch(a.businessUnit, b.businessUnit), weight: 1 },
    { score: jaccard(toSet(a.expertise_tags), toSet(b.expertise_tags)), weight: 2 },
    { score: jaccard(toSet(a.looking_for), toSet(b.looking_for)), weight: 1 },
    { score: jaccard(toSet(a.sought_educators), toSet(b.sought_educators)), weight: 1 },
    { score: topicalOverlap(a, b), weight: 1 }
  ]
}

export function computeMatchStrength(personA, personB) {
  let signals
  if (personA.role === personB.role) {
    if (personA.role === 'student') signals = studentStudent(personA, personB)
    else if (personA.role === 'educator') signals = educatorEducator(personA, personB)
    else signals = wurthEmployeeWurthEmployee(personA, personB)
  } else {
    const byRole = (role) => (personA.role === role ? personA : personB)
    if ([personA.role, personB.role].includes('student') && [personA.role, personB.role].includes('educator')) {
      signals = studentEducator(byRole('student'), byRole('educator'))
    } else if ([personA.role, personB.role].includes('student') && [personA.role, personB.role].includes('wurth_employee')) {
      signals = studentWurthEmployee(byRole('student'), byRole('wurth_employee'))
    } else {
      signals = educatorWurthEmployee(byRole('educator'), byRole('wurth_employee'))
    }
  }

  const valid = signals.filter((s) => s.score !== null)
  if (valid.length === 0) return 0
  const weightedSum = valid.reduce((s, sig) => s + sig.score * sig.weight, 0)
  const weightTotal = valid.reduce((s, sig) => s + sig.weight, 0)
  return Math.round((weightedSum / weightTotal) * 100)
}

export const strengthTier = (score) => (score >= 50 ? 'strong' : 'weak')
