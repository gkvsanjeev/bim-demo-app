export type SubmissionStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Returned'

export interface Submission {
  id: string
  buildingName: string
  address: string
  submitterName: string
  submitterEmail: string
  submittedAt: string
  status: SubmissionStatus
  fileName: string
  fileSize: number
}
