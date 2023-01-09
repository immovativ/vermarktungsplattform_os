import axios, { AxiosResponse } from 'axios'
import { ConceptAssignmentState } from './concept-assignment'

type PublicationEvent = {startOrStop: string, id: string} | null
export interface AdminDashboardResult{
    assignmentsByState: ByState
    nextPublication: PublicationEvent
    nextFinish: PublicationEvent
    candidaturesInReview: number
    candidaturesOnActiveAssignments: number
}
type ByState = {
    [S in ConceptAssignmentState]: number | undefined
}

export async function getAdminDashboard(): Promise<AxiosResponse<AdminDashboardResult>> {
  const response = await axios
      .get('/api/admin/dashboard')
  return response
}
