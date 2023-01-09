import { ChatBoxCaller } from '@common/component/chat/ChatBox';
import { CandidatureState } from '@protected/model/candidature/Candidature';
import { AttachmentMetadata, ConceptAssignmentState } from '@protected/pages/projectgroup/queries/concept-assignment';
import axios, { AxiosResponse } from 'axios';

export type CandidatureMessageDirection = 'USER_TO_ADMIN' | 'ADMIN_TO_USER'

export interface CandidatureMessage {
    messageId: string
    candidatureId: string
    contents: string
    direction: CandidatureMessageDirection
    seenAt: string | null // null when not seen yet
    created: string
    attachment: AttachmentMetadata | null
}

export interface CandidatureUnreadMessage{
    candidatureId: string
    candidatureState: CandidatureState
    conceptState: ConceptAssignmentState
    conceptId: string
    conceptName: string
    userFirstName: string
    userLastName: string
}

export async function getUnread(caller: ChatBoxCaller): Promise<AxiosResponse<readonly CandidatureUnreadMessage[]>> {
  switch (caller) {
    case 'admin':
      return axios.get('/api/admin/messaging/unread')
    case 'candidate':
      return axios.get('/api/candidate/messaging/unread')
  }
}

export async function markRead(candidatureId: string, caller: ChatBoxCaller): Promise<AxiosResponse> {
  switch (caller) {
    case 'admin':
      return axios.get(`/api/admin/messaging/candidature/${candidatureId}/markRead`)
    case 'candidate':
      return axios.get(`/api/candidate/messaging/candidature/${candidatureId}/markRead`)
  }
}

export async function getMessages(candidatureId: string, caller: ChatBoxCaller): Promise<AxiosResponse<readonly CandidatureMessage[]>> {
  switch (caller) {
    case 'admin':
      return axios.get(`/api/admin/messaging/candidature/${candidatureId}`)
    case 'candidate':
      return axios.get(`/api/candidate/messaging/candidature/${candidatureId}`)
  }
}

export async function postMessage(candidatureId: string, caller: ChatBoxCaller, payload: {contents: string},
): Promise<AxiosResponse<readonly CandidatureMessage[]>> {
  switch (caller) {
    case 'admin':
      return axios.post(`/api/admin/messaging/candidature/${candidatureId}`, payload)
    case 'candidate':
      return axios.post(`/api/candidate/messaging/candidature/${candidatureId}`, payload)
  }
}

export function getAttachmentDownloadLink(messageId: string, candidatureId: string, caller: ChatBoxCaller): string {
  switch (caller) {
    case 'admin':
      return `/api/admin/messaging/candidature/${candidatureId}/message/${messageId}/attachment`
    case 'candidate':
      return `/api/candidate/messaging/candidature/${candidatureId}/message/${messageId}/attachment`
  }
}

export async function uploadAttachment(candidatureId: string, file: File, caller: ChatBoxCaller): Promise<AxiosResponse<readonly CandidatureMessage[]>> {
  const formData = new FormData()
  formData.append(file.name, file)
  switch (caller) {
    case 'admin':
      return axios
          .post(`/api/admin/messaging/candidature/${candidatureId}/attachment`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
    case 'candidate':
      return axios
          .post(`/api/candidate/messaging/candidature/${candidatureId}/attachment`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
  }
}
