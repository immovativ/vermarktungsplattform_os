import { ConstructionSiteDetails } from '@protected/model/ConstructionSite'
import { Parcel } from '@protected/model/Parcel'
import axios, { AxiosResponse } from 'axios'

export async function getParcels(cAreaId: string, cSiteId: string): Promise<Parcel[]> {
  return (await axios.get(`/api/construction-area/${cAreaId}/construction-site/${cSiteId}/parcels`)).data
}

export async function getConstructionSiteDetails(cAreaId: string, cSiteId: string): Promise<ConstructionSiteDetails> {
  return (await axios.get(`/api/construction-area/${cAreaId}/construction-site/${cSiteId}/details`)).data
}

export async function updateConstructionSiteDetails(cAreaId: string, cSiteId: string, payload: ConstructionSiteDetails): Promise<AxiosResponse> {
  return await axios.post(`/api/construction-area/${cAreaId}/construction-site/${cSiteId}/details`, payload)
}
