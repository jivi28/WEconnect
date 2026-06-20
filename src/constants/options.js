export const OPPORTUNITY_TYPES = [
  'Praktikum',
  'Werkstudium',
  'Abschlussarbeit',
  'Bachelorprogramm',
  'Masterprogramm',
  'Stipendium',
  'Kostenlose Bauteile',
  'Traineeprogramm',
  'Direkteinstieg'
]

export const FIELDS_OF_STUDY = [
  'Electrical Engineering',
  'Computer Science',
  'Mechanical Engineering',
  'Business/Economics',
  'Physics',
  'Mathematics',
  'Other'
]

export const SEMESTERS = [
  '1st semester',
  '2nd semester',
  '3rd semester',
  '4th semester',
  '5th semester',
  '6th semester',
  '7th semester',
  '8th semester+'
]

export const EDUCATOR_OFFERINGS = [
  'Gastvortrag / Expertenvortrag',
  'Laborpraktikum',
  'Projektarbeit-Betreuung',
  'Kostenlose Bauteile für die Lehre',
  'Exkursion zum Standort',
  'Hochschulgruppen-Förderung',
  'Karrieremessen & Recruiting-Events',
  'Lehrmaterial & Design-Tools',
  'Kits & Boards für den Unterricht',
  'Erfolgsgeschichten'
]

export const BUSINESS_UNITS = [
  'University Relations',
  'Recruiting',
  'R&D',
  'Marketing',
  'Sales',
  'Operations',
  'IT',
  'Human Resources'
]

export const TOPIC_AREAS = [
  'Power Distribution',
  'Embedded Systems',
  'IoT',
  'Automotive',
  'PCB Design',
  'RF & Wireless',
  'Sensors',
  'Renewable Energy',
  'Robotics',
  'EMC/EMI'
]

export const GENERAL_INTERESTS = [
  'Machine Learning',
  'Data Science',
  'Climate Policy',
  'Sustainability',
  'Web Design',
  'Entrepreneurship',
  'Robotics',
  'Product Design',
  'Research',
  'Other'
]

export const SITES = ['Waldenburg', 'Munich', 'Niedernhall', 'Waldzimmern']

export const CONTACT_CHANNELS = ['Platform inbox', 'Email']

// MOCK university-affiliation check for signup (Task 2) — not a real
// integration with any university system. A student/educator signup email
// whose domain matches one of these is auto-verified; everything else
// stays "pending". Matches the universities already used in the demo seed
// data (supabase/seed_network_profiles.sql).
export const UNIVERSITY_EMAIL_ALLOWLIST = [
  'tum.de',
  'kit.edu',
  'rwth-aachen.de',
  'uni-stuttgart.de',
  'tu-berlin.de'
]

// Derived from OPPORTUNITY_TYPES/EDUCATOR_OFFERINGS so these can't drift out of sync.
export const WURTH_SOUGHT_STUDENTS = OPPORTUNITY_TYPES.filter((t) => t !== 'Kostenlose Bauteile')

export const WURTH_SOUGHT_EDUCATORS = [
  'Professor/Dozent',
  'Laborpraktikum-Betreuer',
  'Projektarbeit-Betreuer',
  'Hochschulgruppen-Berater'
]

export const WURTH_OFFERS = EDUCATOR_OFFERINGS.filter((t) =>
  [
    'Gastvortrag / Expertenvortrag',
    'Exkursion zum Standort',
    'Kostenlose Bauteile für die Lehre',
    'Karrieremessen & Recruiting-Events'
  ].includes(t)
)
