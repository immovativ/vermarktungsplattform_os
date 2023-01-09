import {
  AvailableConceptDetails,
  CandidatureAndConceptAssignmentWithAttachments,
} from '@protected/model/candidature/Candidature';
import axios, {AxiosResponse} from 'axios';
import {CandidatureStateResponse} from '@public/models/ConceptAssignmentDetail';

export async function createCandidature(
    conceptAssignmentId: string,
): Promise<AxiosResponse<CandidatureAndConceptAssignmentWithAttachments>> {
  return axios
      .post(`/api/candidate/candidatures/${conceptAssignmentId}`)
}

export async function getConceptAssignment(conceptAssignmentId: string): Promise<AvailableConceptDetails> {
  return axios
      .get(`/api/assignment/${conceptAssignmentId}`)
      .then((response) => response.data);
}

export async function getCandidatureState(conceptAssignmentId: string): Promise<CandidatureStateResponse | undefined> {
  return axios
      .get(`/api/candidate/candidatures/${conceptAssignmentId}/state`)
      .then((response) =>{
        return response.data;
      }, (error) => {
        if (error.response.status === 404) {
          return Promise.resolve(undefined);
        } else {
          return Promise.reject(error)
        }
      })
}
