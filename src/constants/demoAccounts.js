// One-click demo accounts, one per role, so someone checking out the app
// never has to type credentials. The credentials are deliberately public —
// these accounts hold no real data. On first use AuthContext.demoLogin()
// auto-provisions the account through the normal signup path (pre-verified,
// onboarding skipped); if the Supabase project has email confirmation
// enabled that path can't work, so run supabase/seed_demo_accounts.sql once
// instead (it creates the same three accounts already confirmed).
export const DEMO_PASSWORD = 'demo-weconnect'

export const DEMO_ACCOUNTS = [
  {
    role: 'student',
    label: 'Student',
    color: 'var(--we-red)',
    email: 'demo.student@example.com',
    password: DEMO_PASSWORD,
    name: 'Demo Student',
    username: 'demo_student',
    roleData: {
      school: 'TU München',
      fieldOfStudy: 'Electrical Engineering',
      semester: '4th semester',
      affiliationId: 'DEMO-0001'
    }
  },
  {
    role: 'educator',
    label: 'Educator',
    color: '#e0a200',
    email: 'demo.educator@example.com',
    password: DEMO_PASSWORD,
    name: 'Demo Educator',
    username: 'demo_educator',
    roleData: {
      institution: 'KIT Karlsruhe',
      subject: 'Computer Science',
      affiliationId: 'DEMO-0002'
    }
  },
  {
    role: 'wurth_employee',
    label: 'Würth Employee',
    color: '#1d9d5b',
    email: 'demo.wurth@example.com',
    password: DEMO_PASSWORD,
    name: 'Demo Würth Employee',
    username: 'demo_wurth',
    roleData: {
      site: 'Waldenburg',
      businessUnit: 'University Relations',
      organization: 'Würth Elektronik'
    }
  }
]
