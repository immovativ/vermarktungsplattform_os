import {
  Candidature,
  CandidatureAndConceptAssignmentWithAttachments, EditCandidatureRequest,
} from '@protected/model/candidature/Candidature';
import axios, {AxiosResponse} from 'axios';
import {AttachmentMetadata} from '@protected/pages/projectgroup/queries/concept-assignment';

export async function listCandidatures(): Promise<readonly Candidature[]> {
  return axios.get('/api/candidate/candidatures').then((response) => response.data);
}

export async function getCandidature(id: string): Promise<CandidatureAndConceptAssignmentWithAttachments> {
  return axios.get(`/api/candidate/candidatures/${id}`).then((response) => response.data);
}

export async function editCandidature(payload: EditCandidatureRequest, id: string, candidateId: string | null = null): Promise<any> {
  const headers: Record<string, any> = {}
  if (candidateId != null) {
    headers['X-DELEGATED-ID'] = candidateId
  }
  return axios.put(`/api/candidate/candidatures/${id}`, payload, {headers})
}

export async function submitCandidature(id: string, candidateId: string | null = null): Promise<any> {
  const headers: Record<string, any> = {}
  if (candidateId != null) {
    headers['X-DELEGATED-ID'] = candidateId
  }
  return axios.put(`/api/candidate/candidatures/${id}/submit`, null, {headers})
}

export async function deleteCandidature(id: string, candidateId: string | null = null): Promise<any> {
  const headers: Record<string, any> = {}
  if (candidateId != null) {
    headers['X-DELEGATED-ID'] = candidateId
  }
  return axios.delete(`/api/candidate/candidatures/${id}`)
}

export async function revokeCandidature(id: string, candidateId: string | null = null): Promise<any> {
  const headers: Record<string, any> = {}
  if (candidateId != null) {
    headers['X-DELEGATED-ID'] = candidateId
  }
  return axios.put(`/api/candidate/candidatures/${id}/revoke`, null, {headers})
}

export async function copyCandidatureValues(from: string, to: string): Promise<any> {
  return axios.post(`/api/candidate/candidature/copy/${from}/${to}`)
}

export async function deleteAttachment(candidatureId: string, attachmentId: string, candidateId: string | null = null): Promise<any> {
  const headers: Record<string, any> = {}
  if (candidateId != null) {
    headers['X-DELEGATED-ID'] = candidateId
  }
  return axios.delete(`/api/candidate/candidatures/${candidatureId}/attachments/${attachmentId}`, {headers})
}

export async function uploadAttachment(id: string, file: File, candidateId: string | null = null): Promise<AxiosResponse<AttachmentMetadata>> {
  const headers: Record<string, any> = {
    'Content-Type': 'multipart/form-data',
  }

  if (candidateId != null) {
    headers['X-DELEGATED-ID'] = candidateId
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  return axios.post(`/api/candidate/candidatures/${id}/attachments`, formData, {
    headers: headers,
  });
}
