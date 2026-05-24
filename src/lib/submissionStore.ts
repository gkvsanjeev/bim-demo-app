import type { Submission } from '../types/submission'

const STORE_KEY = 'skysafe_submissions'

const SEED: Submission[] = [
  {
    id: 'CAAS-20260523-A1B2C',
    buildingName: 'Changi Business Park Tower 3',
    address: '10 Changi Business Park Central 2, Singapore 486030',
    submitterName: 'John Tan',
    submitterEmail: 'john.tan@example.com',
    submittedAt: '2026-05-23T09:15:00Z',
    status: 'Under Review',
    fileName: 'changi_biz_park_t3.zip',
    fileSize: 4521000,
  },
  {
    id: 'CAAS-20260521-D3E4F',
    buildingName: 'Marina Bay Financial Centre 4',
    address: '8 Marina Blvd, Singapore 018981',
    submitterName: 'Sarah Lim',
    submitterEmail: 'sarah.lim@example.com',
    submittedAt: '2026-05-21T14:30:00Z',
    status: 'Submitted',
    fileName: 'mbfc4_bim.zip',
    fileSize: 7832000,
  },
  {
    id: 'CAAS-20260519-G5H6I',
    buildingName: 'Toa Payoh HDB Development',
    address: '456 Toa Payoh Lorong 8, Singapore 310456',
    submitterName: 'Michael Wong',
    submitterEmail: 'mwong@constructco.sg',
    submittedAt: '2026-05-19T11:00:00Z',
    status: 'Approved',
    fileName: 'toa_payoh_dev.zip',
    fileSize: 3200000,
  },
  {
    id: 'CAAS-20260515-J7K8L',
    buildingName: 'One Raffles Quay Extension',
    address: '1 Raffles Quay, Singapore 048583',
    submitterName: 'Grace Ng',
    submitterEmail: 'grace.ng@arch.sg',
    submittedAt: '2026-05-15T08:45:00Z',
    status: 'Returned',
    fileName: 'orq_extension.zip',
    fileSize: 6100000,
  },
]

export function getAllSubmissions(): Submission[] {
  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) {
    localStorage.setItem(STORE_KEY, JSON.stringify(SEED))
    return SEED
  }
  return JSON.parse(raw) as Submission[]
}

export function getUserSubmissions(email: string): Submission[] {
  return getAllSubmissions().filter((s) => s.submitterEmail === email)
}

export function addSubmission(sub: Submission): void {
  const all = getAllSubmissions()
  all.unshift(sub)
  localStorage.setItem(STORE_KEY, JSON.stringify(all))
}

export function generateApplicationId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `CAAS-${datePart}-${suffix}`
}
