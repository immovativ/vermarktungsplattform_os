import { CandidatureState, CandidatureWithAttachments } from '@protected/model/candidature/Candidature'
import axios, { AxiosResponse } from 'axios'
import {
  AdminConceptAssignmentDetail,
  AttachmentMetadata,
  BuildingType,
  CandidatureWithUser,
  ConceptAssignmentDetail,
  ConceptAssignmentState,
} from './concept-assignment'
import {Salutation, UserAccountType} from '@protected/pages/common/profile/queries/profile';
import { UserStatus } from '@protected/model/user/UserStatus';

export interface AdminCommentRequest {
  text: string | null
}

export interface AdminRatingRequest {
  rating: number | null
}
export interface AdminComment{
  text: string | null
  updated: string | null
}

export interface AdminConceptAssignmentWithAttachments {
  assignment: AdminConceptAssignmentDetail
  attachments: AttachmentMetadata[]
  candidatures: CandidatureWithUser[]
}

export interface AdminCandidatureAndConceptAssignmentWithAttachments {
  candidatureWithAttachments: CandidatureWithAttachments
  conceptAssignmentWithAttachments: AdminConceptAssignmentWithAttachments
}

export interface AdminCandidatureView{
    details: AdminCandidatureAndConceptAssignmentWithAttachments
    user: UserData
    email: string
    comment: AdminComment | null
}
export interface UserData {
    userId: string
    accountType: UserAccountType
    company: string | null
    street: string
    houseNumber: string
    zipCode: string
    city: string
    salutation: Salutation
    firstName: string
    lastName: string
    phoneNumber: string
    createdAt: string
    updatedAt: string
    userStatus: UserStatus
}

export async function getCandidatureDetailAsAdmin(id: string): Promise<AdminCandidatureView> {
  const response = await axios
      .get(`/api/admin/candidatures/${id}`)
  return response.data
}

export async function getAllCandidatureDetailAsAdmin(id: string): Promise<AdminCandidatureView> {
  const response = await axios
      .get(`/api/admin/candidatures/${id}/all`)
  return response.data
}

export async function grantCandidature(id: string): Promise<AxiosResponse<AdminCandidatureView>> {
  const response = await axios
      .put(`/api/admin/candidatures/${id}/grant`)
  return response
}

export async function rejectCandidature(id: string): Promise<AxiosResponse<AdminCandidatureView>> {
  const response = await axios
      .put(`/api/admin/candidatures/${id}/reject`)
  return response
}

export async function upsertComment(candidatureId: string, comment: AdminCommentRequest): Promise<AxiosResponse<AdminCandidatureView>> {
  const response = await axios
      .post(`/api/admin/candidatures/${candidatureId}/comment`, comment)
  return response
}

export async function upsertRating(candidatureId: string, rating: AdminRatingRequest): Promise<AxiosResponse<AdminCandidatureView>> {
  const response = await axios
      .post(`/api/admin/candidatures/${candidatureId}/rating`, rating)
  return response
}

export async function createDelegatedCandidature(userId: string, conceptAssignmentId: string): Promise<AxiosResponse<ConceptAssignmentDetail>> {
  const response = await axios.post<ConceptAssignmentDetail>(
      `/api/candidate/candidatures/${conceptAssignmentId}`,
      {},
      {
        headers: {
          'X-DELEGATED-ID': userId,
        },
      },
  )

  return response
}

export interface CandidateProfileCandidature {
    id: string
    conceptId: string
    conceptName: string
    state: CandidatureState
    updatedAt: string
    buildingType: BuildingType
}

export interface CandidateProfileData {
    email: string,
    userData: UserData,
    candidatures: readonly CandidateProfileCandidature[]
}

export async function getProfileAsAdmin(uid: string): Promise<CandidateProfileData> {
  const response = await axios
      .get(`/api/admin/candidates/${uid}`)
  return response.data
}


export interface CandidateListResultCandidature{
    conceptId: string
    candidatureId: string
    conceptName: string
    candidatureState: CandidatureState
    conceptState: ConceptAssignmentState
    updatedAt: string
    buildingType: BuildingType
}

export interface CandidateListResult{
    userId: string
    company: string | null
    street: string | null
    houseNumber: string | null
    zipCode: string | null
    city: string | null
    firstName: string
    lastName: string
    email: string
    candidatures: number
}

export async function getCandidateListAsAdmin(): Promise<readonly CandidateListResult[]> {
  const response = await axios
      .get('/api/admin/candidates/list')
  return response.data
}
