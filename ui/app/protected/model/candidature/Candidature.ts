import {
  AttachmentMetadata, ConceptAssignmentDetail, ConceptAssignmentState,
  ConceptAssignmentType,
  ConceptDetails,
} from '@protected/pages/projectgroup/queries/concept-assignment';
import { Parcel } from '../Parcel';

export const CandidatureStates = ['DRAFT', 'SUBMITTED', 'REJECTED', 'ACCEPTED'] as const
export type CandidatureState = typeof CandidatureStates[number]
export const CandidatureStateTranslations: Record<CandidatureState, string> = {
  DRAFT: 'Nicht eingereicht',
  SUBMITTED: 'Eingereicht',
  ACCEPTED: 'Zuschlag erteilt',
  REJECTED: 'Bewerbung konnte nicht berücksichtigt werden',
}

export interface AvailableConceptDetails {
  id: string,
  name: string,
  parcels: Parcel[],
  state: ConceptAssignmentState,
  assignmentEnd: string | undefined,
  assignmentStart: string | undefined,
  details: ConceptDetails
  conceptAssignmentType: ConceptAssignmentType
}

export interface Candidature {
  id: string
  conceptDetails: AvailableConceptDetails
  userId: string
  state: CandidatureState
  description: string
  answers: { [key: string]: string }
  createdAt: string
  updatedAt: string
}

export interface CandidatureWithAttachments {
  candidature: Candidature
  attachments: AttachmentMetadata[]
}

export interface ConceptAssignmentWithAttachments {
  assignment: ConceptAssignmentDetail
  attachments: AttachmentMetadata[]
}

export interface CandidatureAndConceptAssignmentWithAttachments {
  candidatureWithAttachments: CandidatureWithAttachments
  conceptAssignmentWithAttachments: ConceptAssignmentWithAttachments
}

export interface EditCandidatureRequest {
  description: string
  answers: { [key: string]: string }
}
