package de.immovativ.vermarktungsplattform.utils

import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.ParcelType
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import kotlinx.serialization.json.JsonObject

class ConstructionSiteFixtures(
    private val constructionSitesRepository: ConstructionSitesRepository,
    private val parcelsRepository: ParcelsRepository
) {

    fun persistConstructionSite(constructionAreaId: String, constructionSiteId: String): ConstructionSite {
        val constructionSite = ConstructionSite(
            constructionAreaId = constructionAreaId,
            constructionSiteId = constructionSiteId,
            comment = "fkbr",
            fid = "1",
            text = "kuci",
            shape = JsonObject(emptyMap())
        )
        constructionSitesRepository.createOrUpdate(constructionSite)
        return constructionSite
    }

    fun persistParcel(constructionSite: ConstructionSite, parcelId: String) {
        val parcel = Parcel(
            constructionAreaId = constructionSite.constructionAreaId,
            constructionSiteId = constructionSite.constructionSiteId,
            parcelId = parcelId,
            fid = "1",
            area = "100",
            shape = JsonObject(emptyMap()),
            parcelType = ParcelType.APPARTMENT_COMPLEX_BIG_1
        )
        parcelsRepository.createOrUpdate(parcel)
    }
}
