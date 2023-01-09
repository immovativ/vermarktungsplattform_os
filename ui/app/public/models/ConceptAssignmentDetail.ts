import {BuildingType, ConceptAssignmentState, ConceptAssignmentType} from '@protected/pages/projectgroup/queries/concept-assignment';
import {CandidatureState} from '@protected/model/candidature/Candidature';
import { Parcel } from '@protected/model/Parcel';

export interface ConceptDetails {
  buildingType: BuildingType
  allowedFloors: number | undefined
  allowedBuildingHeightMeters: number | undefined
  energyText: string | undefined
}

export type PublicStates = Exclude<ConceptAssignmentState, 'DRAFT' | 'WAITING' |'ABORTED'>

export interface ConceptAssignmentDetail {
  id: string,
  name: string,
  parcels: Parcel[],
  assignmentEnd: string | undefined,
  assignmentStart: string | undefined,
  conceptDetails: ConceptDetails,
  previewImage: string | undefined
  conceptAssignmentType: ConceptAssignmentType

  state: PublicStates
}

export interface CandidatureStateResponse {
  candidatureId: string
  state: CandidatureState
}
