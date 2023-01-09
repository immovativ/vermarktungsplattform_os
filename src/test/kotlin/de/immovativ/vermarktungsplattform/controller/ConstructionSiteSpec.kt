package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.ParcelType
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.assertions.json.shouldContainJsonKey
import io.kotest.assertions.json.shouldContainJsonKeyValue
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.shouldBe
import kotlinx.serialization.json.JsonObject
import org.kodein.di.instance

class ConstructionSiteSpec : FunSpec() {
    init {
        test("Fetch construction site") {
            withTestApplicationAndSetup { di ->
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
                val constructionSite = testConstructionSite()
                constructionSitesRepository.createOrUpdate(constructionSite)

                val respone = constructionSiteApis.getConstructionSite(
                    constructionAreaId = constructionSite.constructionAreaId,
                    constructionSiteId = constructionSite.constructionSiteId
                )

                respone shouldBe constructionSite
            }
        }

        test("fetch feature collection for all") {
            withTestApplicationAndSetup { di ->
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()

                val constructionSite1 = testConstructionSite().copy(constructionSiteId = "1")
                val constructionSite2 = testConstructionSite().copy(constructionSiteId = "2")
                constructionSitesRepository.createOrUpdate(constructionSite1)
                constructionSitesRepository.createOrUpdate(constructionSite2)

                val collection = constructionSiteApis.getFeatureCollectionForAll()

                collection.shouldContainJsonKeyValue("$.type", "FeatureCollection")
                collection.shouldContainJsonKeyValue("$.name", "baufelder")
                collection.shouldContainJsonKey("$.features[0]")
                collection.shouldContainJsonKey("$.features[1]")
            }
        }

        test("Fetch single parcel") {
            withTestApplicationAndSetup { di ->
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
                val parcelsRepository by di.instance<ParcelsRepository>()

                val constructionSite = testConstructionSite()
                constructionSitesRepository.createOrUpdate(constructionSite)

                val parcel = testParcel(constructionSite)
                parcelsRepository.createOrUpdate(parcel)

                val respone = constructionSiteApis.getParcel(
                    constructionAreaId = constructionSite.constructionAreaId,
                    constructionSiteId = constructionSite.constructionSiteId,
                    parcelId = parcel.parcelId
                )

                respone shouldBe parcel
            }
        }

        test("Fetch all parcels for a construction site") {
            withTestApplicationAndSetup { di ->
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
                val parcelsRepository by di.instance<ParcelsRepository>()

                val constructionSite = testConstructionSite()
                constructionSitesRepository.createOrUpdate(constructionSite)

                val parcel1 = testParcel(constructionSite).copy(parcelId = "lars r. bender")
                val parcel2 = testParcel(constructionSite).copy(parcelId = "kuci")
                parcelsRepository.createOrUpdate(parcel1)
                parcelsRepository.createOrUpdate(parcel2)

                val respone = constructionSiteApis.getAllParcels(
                    constructionAreaId = constructionSite.constructionAreaId,
                    constructionSiteId = constructionSite.constructionSiteId
                )

                respone shouldContainExactlyInAnyOrder listOf(parcel1, parcel2)
            }
        }
    }

    private fun testConstructionSite() = ConstructionSite(
        constructionAreaId = "420",
        constructionSiteId = "42",
        comment = "fkbr",
        fid = "1",
        text = "kuci",
        shape = JsonObject(emptyMap())
    )

    private fun testParcel(cs: ConstructionSite) = Parcel(
        constructionAreaId = cs.constructionAreaId,
        constructionSiteId = cs.constructionSiteId,
        parcelId = "96",
        fid = "1",
        area = "100",
        shape = JsonObject(emptyMap()),
        parcelType = ParcelType.APPARTMENT_COMPLEX_BIG_1
    )
}
