import Feature from 'ol/Feature'
import GeoJSON from 'ol/format/GeoJSON'

export type ParcelType =
    'COMMUNITY_PROPERTY_NON_PUBLIC'|
    'COMMUNITY_PROPERTY_PUBLIC'|
    'COMMERCIAL'|
    'APPARTMENT_COMPLEX_BIG_1'|
    'APPARTMENT_COMPLEX_BIG_2'|
    'APPARTMENT_COMPLEX_BIG_3'|
    'APPARTMENT_COMPLEX_BIG_4'|
    'APPARTMENT_COMPLEX_SMALL'|
    'APPARTMENT_COMPLEX_MEDIUM'|
    'INNER_COURTYARD'|
    'NEIGHBOURHOOD_GARAGE'|
    'TOWNHOUSE_BIG'|
    'TOWNHOUS_SMALL';

export const ParcelTypeColors: Record<ParcelType, string> = {
  APPARTMENT_COMPLEX_BIG_1: 'rgb(255, 191, 127)',
  APPARTMENT_COMPLEX_BIG_2: 'rgb(255, 127, 127)',
  APPARTMENT_COMPLEX_BIG_3: 'rgb(255, 127, 255)',
  APPARTMENT_COMPLEX_BIG_4: 'rgb(192, 142, 217)',
  APPARTMENT_COMPLEX_MEDIUM: 'rgb(255, 255, 127)',
  APPARTMENT_COMPLEX_SMALL: 'rgb(169, 226, 255)',
  COMMERCIAL: 'rgb(127, 127, 127)',
  COMMUNITY_PROPERTY_NON_PUBLIC: 'rgb(191, 127, 127)',
  COMMUNITY_PROPERTY_PUBLIC: 'rgb(255, 183, 183)',
  INNER_COURTYARD: 'rgb(255, 255, 255)',
  NEIGHBOURHOOD_GARAGE: 'rgb(213, 213, 213)',
  TOWNHOUS_SMALL: 'rgb(169, 255, 169)',
  TOWNHOUSE_BIG: 'rgb(127, 226, 127)',
}

export const parcelTypeTranslations: Record<ParcelType, string> = {
  'COMMUNITY_PROPERTY_NON_PUBLIC': 'Gemeinbedarf (nicht-oeffentlich)',
  'COMMUNITY_PROPERTY_PUBLIC': 'Gemeinbedarf (oeffentlich)',
  'COMMERCIAL': 'Gewerbe / Büro / Sondernutzung',
  'APPARTMENT_COMPLEX_BIG_1': 'Geschosswohnen groß mit spez. Erschließung',
  'APPARTMENT_COMPLEX_BIG_2': 'Geschosswohnen groß mit integrierter KiTa',
  'APPARTMENT_COMPLEX_BIG_3': 'Geschosswohnen groß',
  'APPARTMENT_COMPLEX_BIG_4': 'Geschosswohnen groß mit durchgehender EG Nutzung',
  'APPARTMENT_COMPLEX_SMALL': 'Geschosswohnen klein',
  'APPARTMENT_COMPLEX_MEDIUM': 'Geschosswohnen mittel',
  'INNER_COURTYARD': 'gemeinschaftlicher Innenhof',
  'NEIGHBOURHOOD_GARAGE': 'Quartiersgarage',
  'TOWNHOUSE_BIG': 'Townhouse groß',
  'TOWNHOUS_SMALL': 'Townhouse klein',
}

export interface Parcel {
  parcelId: string,
  constructionAreaId: string
  constructionSiteId: string
  comment: string
  fid: string
  parcelType: ParcelType,
  area: string
  shape: any
}

const geoJsonClass: GeoJSON = new GeoJSON()

export function parcelsToFeatures(parcels: Parcel[]): Feature[] {
  return parcels.map((p) =>geoJsonClass.readFeature(p.shape))
}
