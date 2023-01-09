import { Translation } from '@protected/pages/projectgroup/queries/concept-assignment'

export interface ConstructionSite {
  constructionAreaId: string
  constructionSiteId: string
  comment: string
  fid: string
  text: string
  shape: any
}

export type ConstructionSiteKey = Pick<ConstructionSite, 'constructionAreaId' | 'constructionSiteId'>

export interface ConstructionSiteDetails {
  key: ConstructionSiteKey
  //    Bebauungsform
  form: string,
  //    Art der baulichen Nutzung
  zoningClassification: string,
  //    Maß der baulichen Nutzung
  levelOfBuiltDevelopment: string,
  //    Marktsegmente
  marketSegments: string,
  //    Energieversorgung
  energySupply: string,
  //    Mobilität
  mobility: string,
  //    Freiraum
  clearance: string,
  //    Fläche Baublock [m2]
  areaBuildingBlock: string,
  // Überbaubare Fläche [m2]
  plotAreaToBeBuiltOn: string,
  // Grundstückspreis [€/m2]
  landPricePerSqm: string
}


export type ConstructionSiteDetailsKeys = keyof Omit<ConstructionSiteDetails, 'key'>

export const ConstructionSiteDetailsKeysTranslation: Translation<ConstructionSiteDetailsKeys> = {
  form: 'Bebauungsform',
  zoningClassification: 'Art der baulichen Nutzung',
  levelOfBuiltDevelopment: 'Maß der baulichen Nutzung',
  marketSegments: 'Marktsegmente',
  energySupply: 'Energieversorgung',
  mobility: 'Mobilität',
  clearance: 'Freiraum',
  areaBuildingBlock: 'Fläche Baublock [㎡]',
  plotAreaToBeBuiltOn: 'Überbaubare Fläche [㎡]',
  landPricePerSqm: 'Grundstückspreis [€/㎡]',
}
