import { CandidatureState } from '@protected/model/candidature/Candidature'
import { Parcel } from '@protected/model/Parcel'
import { UserStatus } from '@protected/model/user/UserStatus'
import { UserAccountType } from '@protected/pages/common/profile/queries/profile'
import { Question } from '@protected/pages/common/questions/questions'
import axios, { AxiosResponse } from 'axios'

export type Translation<T extends string> = Record<T, string>

export const BuildingTypeTranslations: Translation<BuildingType> = {
  'GGW': 'Großer Geschosswohnungsbau',
  'MGW': 'Mittlerer Geschosswohnungsbau',
  'KGW': 'Kleiner Geschosswohnungsbau',
  'GTH': 'Großes Townhouse',
  'KTH': 'Kleines Townhouse',
  'WH': 'Wohnheim',
}
export type BuildingType = 'GGW' | 'MGW' | 'KGW' | 'GTH' | 'KTH' | 'WH'

export interface ParcelRef {
  parcelId: string
  constructionAreaId: string
  constructionSiteId: string
}

export interface CreateConceptAssignmentRequest{
    name: string
    buildingType: BuildingType
    parcelRefs: ParcelRef[]
    conceptAssignmentType: ConceptAssignmentType
}

export interface UpdateConceptAssignmentRequest{
  details: ConceptDetails
}

export interface ConceptDetails{
    buildingType: BuildingType
    allowedFloors: number | null
    allowedBuildingHeightMeters: number | null
    energyText: string | null
}

export interface AttachmentMetadata {
    id: string, // also == s3 key
    name: string, // filename
    contentType: string
}

export interface CandidatureMetadata {
    id: string,
    conceptAssignmentId: string,
    userId: string,
    state: CandidatureState
    description: string,
    createdAt: string,
    updatedAt: string,
}

export interface CandidatureWithUser {
    candidature: CandidatureMetadata
    user: {
      firstName: string,
      lastName: string,
      company: string,
      street: string,
      houseNumber: string,
      zipCode: string,
      city: string,
      accountType: UserAccountType,
      userStatus: UserStatus
    }
    rating: number | null
}

export interface AdminConceptAssignmentDetailWithAttachments {
  attachments: readonly AttachmentMetadata[]
  assignment: AdminConceptAssignmentDetail
  candidatures: readonly CandidatureWithUser[]
}

export interface CandidatureQuestions {
  questions: readonly Question[]
}

export type ConceptAssignmentState = 'DRAFT' | 'WAITING' | 'ACTIVE' | 'REVIEW' | 'FINISHED' | 'ABORTED'
export type ConceptAssignmentType = 'ANCHOR' | 'ANLIEGER'

export const ConceptAssignmentTypeTranslation: Translation<ConceptAssignmentType> = {
  ANCHOR: 'Ankerobjekt',
  ANLIEGER: 'Anliegerobjekt',
}

export const ConceptAssignmentStateTranslation: Translation<ConceptAssignmentState> = {
  ACTIVE: 'Öffentlich',
  DRAFT: 'Entwurf',
  FINISHED: 'Zuschlag erteilt',
  REVIEW: 'In Prüfung',
  WAITING: 'Wartet auf Veröffentlichung',
  ABORTED: 'Abgebrochen',
}

export interface AdminConceptAssignmentListResult{
  assignment: AdminConceptAssignmentDetail
  candidatures: number
  undecidedCandidatures: number
}

export interface AdminConceptAssignmentDetail{
    id: string
    name: string
    parcels: Parcel[]
    state: ConceptAssignmentState
    assignmentEnd: string | undefined
    assignmentStart: string | undefined
    createdAt: string
    updatedAt: string
    details: ConceptDetails
    questions?: CandidatureQuestions
    conceptAssignmentType: ConceptAssignmentType
}

export interface ConceptAssignmentDetail{
  id: string
  name: string
  parcels: Parcel[]
  state: ConceptAssignmentState
  assignmentEnd: string | undefined
  assignmentStart: string | undefined
  details: ConceptDetails
  questions?: CandidatureQuestions
}

export async function updateDraft(id: string, payload: UpdateConceptAssignmentRequest): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${id}/details`, payload)

  return response
}

export async function updateDraftQuestions(id: string, payload: CandidatureQuestions): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${id}/questions`, payload)

  return response
}

export async function createDraft(payload: CreateConceptAssignmentRequest): Promise<AxiosResponse<AdminConceptAssignmentDetail>> {
  const response = await axios
      .post('/api/admin/concept-assignment', payload)

  return response
}

export async function listForOverviewMap(): Promise<readonly AdminConceptAssignmentListResult[]> {
  const response = await axios
      .get('/api/admin/concept-assignments', {params: {state: 'REVIEW,ACTIVE,FINISHED,WAITING'}})
  return response.data
}


export async function listReview(): Promise<readonly AdminConceptAssignmentListResult[]> {
  const response = await axios
      .get('/api/admin/concept-assignments', {params: {state: 'REVIEW'}})
  return response.data
}

export async function listActiveWaiting(): Promise<readonly AdminConceptAssignmentListResult[]> {
  const response = await axios
      .get('/api/admin/concept-assignments', {params: {state: 'ACTIVE,WAITING'}})
  return response.data
}

export async function listDone(): Promise<readonly AdminConceptAssignmentListResult[]> {
  const response = await axios
      .get('/api/admin/concept-assignments', {params: {state: 'ABORTED,FINISHED'}})
  return response.data
}

export async function listDrafts(): Promise<readonly AdminConceptAssignmentListResult[]> {
  const response = await axios
      .get('/api/admin/concept-assignments', {params: {state: 'DRAFT'}})
  return response.data
}

export async function listForConstructionSite(constructionAreaId: string, constructionSiteId: string): Promise<readonly AdminConceptAssignmentListResult[]> {
  const response = await axios
      .get(`/api/construction-area/${constructionAreaId}/construction-site/${constructionSiteId}/concept-assignments`)
  return response.data
}

export async function listAll(): Promise<readonly AdminConceptAssignmentListResult[]> {
  return axios.get('/api/admin/concept-assignments').then((response) => response.data)
}

export async function getDetail(id: string): Promise<AdminConceptAssignmentDetailWithAttachments> {
  const response = await axios
      .get(`/api/admin/concept-assignment/${id}`)
  return response.data
}

export async function deleteAttachment(cid: string, attachId: string): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .delete(`/api/admin/concept-assignment/${cid}/attachment/${attachId}`)
  return response
}

export async function deleteDraft(cid: string): Promise<AxiosResponse> {
  const response = await axios.delete(`/api/admin/concept-assignment/${cid}`)
  return response
}

export async function stopManually(cid: string): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/finishManually`)
  return response
}

export async function unstart(cid: string): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/unstart`)
  return response
}

export async function start(cid: string, payload: {startsAt: Date, endsAt: Date}): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/start`, payload)
  return response
}

export async function justAbort(cid: string): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/abort`)
  return response
}

export async function abortAndDraft(cid: string): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/abortAndDraft`)
  return response
}

export async function uploadAttachment(cid: string, file: File): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const formData = new FormData()
  formData.append(file.name, file);
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
  return response
}

export async function uploadPreviewImage(cid: string, preview: Blob): Promise<AxiosResponse<AdminConceptAssignmentDetailWithAttachments>> {
  const formData = new FormData()
  formData.append('preview', preview);
  const response = await axios
      .post(`/api/admin/concept-assignment/${cid}/preview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
  return response
}
