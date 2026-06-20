import type { CurrentUser, Person } from '../types'

export const currentUser: CurrentUser = {
  name: 'Anushree Goyal',
  role: 'Student',
  email: 'anushree.goyal@example.com',
  imageUrl: 'https://i.pravatar.cc/300?img=47',
  mainInterests: 'Electronics, AI, Embedded Systems, Innovation Projects'
}

export const people: Person[] = [
  // ---- Students ----
  {
    id: 'stu-1',
    name: 'Maya Schneider',
    role: 'student',
    email: 'maya.schneider@example.com',
    imageUrl: 'https://i.pravatar.cc/300?img=32',
    mainInterest: 'Embedded Systems',
    projectNames: ['Smart Sensor Board', 'IoT Energy Monitor'],
    sharedInterests: ['Embedded Systems', 'IoT', 'Sensor Design'],
    sharedEvents: ['Electronics Innovation Day'],
    connectionStrength: 87,
    connectionReason: '3 shared interests + 1 shared project'
  },
  {
    id: 'stu-2',
    name: 'Lukas Brunner',
    role: 'student',
    email: 'lukas.brunner@example.com',
    imageUrl: 'https://i.pravatar.cc/300?img=12',
    mainInterest: 'Robotics',
    projectNames: ['Autonomous Line Follower'],
    sharedInterests: ['Robotics', 'AI'],
    sharedEvents: [],
    connectionStrength: 64,
    connectionReason: '2 shared interests'
  },
  {
    id: 'stu-3',
    name: 'Sofia Lindgren',
    role: 'student',
    email: 'sofia.lindgren@example.com',
    imageUrl: 'https://i.pravatar.cc/300?img=45',
    mainInterest: 'Renewable Energy Systems',
    projectNames: ['Solar Microgrid Simulation'],
    sharedInterests: ['Sustainability'],
    sharedEvents: [],
    connectionStrength: 41,
    connectionReason: 'Shared interest: Sustainability'
  },
  {
    id: 'stu-4',
    name: 'Noah Petrov',
    role: 'student',
    email: 'noah.petrov@example.com',
    imageUrl: 'https://i.pravatar.cc/300?img=15',
    mainInterest: 'PCB Design',
    projectNames: ['Custom Audio Amp PCB'],
    sharedInterests: ['PCB Design', 'Electronics'],
    sharedEvents: ['Electronics Innovation Day'],
    connectionStrength: 73,
    connectionReason: 'Same event + 1 shared interest'
  },

  // ---- Educators ----
  {
    id: 'edu-1',
    name: 'Dr. Elena Vogt',
    role: 'educator',
    email: 'elena.vogt@wu.ac.at',
    imageUrl: 'https://i.pravatar.cc/300?img=49',
    mainInterest: 'Power Electronics Research',
    detailLine: 'Teaching: Power Electronics & Control Systems',
    projectNames: ['Power Electronics Lab', 'Grid Stability Study'],
    sharedInterests: ['Power Electronics'],
    sharedEvents: ['Electronics Innovation Day'],
    connectionStrength: 91,
    connectionReason: 'Research area match + same event'
  },
  {
    id: 'edu-2',
    name: 'Prof. Hannah Brandt',
    role: 'educator',
    email: 'hannah.brandt@wu.ac.at',
    imageUrl: 'https://i.pravatar.cc/300?img=44',
    mainInterest: 'Embedded AI Mentorship',
    detailLine: 'Mentorship: Embedded AI for Student Projects',
    projectNames: ['AI Mentorship Circle'],
    sharedInterests: ['Embedded Systems', 'AI'],
    sharedEvents: [],
    connectionStrength: 69,
    connectionReason: 'Mentorship topic match'
  },
  {
    id: 'edu-3',
    name: 'Dr. Markus Feld',
    role: 'educator',
    email: 'markus.feld@wu.ac.at',
    imageUrl: 'https://i.pravatar.cc/300?img=53',
    mainInterest: 'Materials Science',
    detailLine: 'Research: Semiconductor Materials',
    projectNames: ['Semiconductor Materials Study'],
    sharedInterests: [],
    sharedEvents: ['Materials & Manufacturing Summit'],
    connectionStrength: 33,
    connectionReason: 'Same event only'
  },
  {
    id: 'edu-4',
    name: 'Prof. Ingrid Wallner',
    role: 'educator',
    email: 'ingrid.wallner@wu.ac.at',
    imageUrl: 'https://i.pravatar.cc/300?img=29',
    mainInterest: 'Sustainable Engineering',
    detailLine: 'Teaching: Sustainable Engineering Systems',
    projectNames: ['Green Campus Initiative'],
    sharedInterests: ['Sustainability', 'Innovation Projects'],
    sharedEvents: [],
    connectionStrength: 58,
    connectionReason: '2 shared academic interests'
  },

  // ---- WU Elektronik experts ----
  {
    id: 'exp-1',
    name: 'Jonas Keller',
    role: 'expert',
    email: 'jonas.keller@we-online.com',
    imageUrl: 'https://i.pravatar.cc/300?img=14',
    mainInterest: 'Power Modules',
    detailLine: 'Department: Power Electronics',
    projectNames: ['EV Charging PCB', 'Smart Factory Demo'],
    sharedInterests: [],
    sharedEvents: ['Electronics Innovation Day'],
    connectionStrength: 78,
    connectionReason: 'Same event: Electronics Innovation Day'
  },
  {
    id: 'exp-2',
    name: 'Clara Huber',
    role: 'expert',
    email: 'clara.huber@we-online.com',
    imageUrl: 'https://i.pravatar.cc/300?img=33',
    mainInterest: 'Embedded Connectivity (RF)',
    detailLine: 'Department: RF & Wireless',
    projectNames: ['IoT Energy Monitor', 'Wireless Sensor Gateway'],
    sharedInterests: ['Embedded Systems', 'IoT'],
    sharedEvents: ['Electronics Innovation Day'],
    connectionStrength: 84,
    connectionReason: 'Shared project area + same event'
  },
  {
    id: 'exp-3',
    name: 'Tobias Reiner',
    role: 'expert',
    email: 'tobias.reiner@we-online.com',
    imageUrl: 'https://i.pravatar.cc/300?img=51',
    mainInterest: 'Inductors & Magnetics',
    detailLine: 'Department: Magnetics R&D',
    projectNames: ['Smart Factory Demo'],
    sharedInterests: [],
    sharedEvents: [],
    connectionStrength: 28,
    connectionReason: 'Adjacent expertise area'
  },
  {
    id: 'exp-4',
    name: 'Priya Nair',
    role: 'expert',
    email: 'priya.nair@we-online.com',
    imageUrl: 'https://i.pravatar.cc/300?img=24',
    mainInterest: 'Smart Factory Automation',
    detailLine: 'Department: Industrial IoT',
    projectNames: ['Smart Factory Demo', 'Predictive Maintenance Sensor'],
    sharedInterests: ['Innovation Projects'],
    sharedEvents: ['Industry 4.0 Roundtable'],
    connectionStrength: 55,
    connectionReason: 'Shared interest + same event'
  }
]

export const allEvents = Array.from(new Set(people.flatMap((p) => p.sharedEvents))).sort()
export const allProjects = Array.from(new Set(people.flatMap((p) => p.projectNames))).sort()
