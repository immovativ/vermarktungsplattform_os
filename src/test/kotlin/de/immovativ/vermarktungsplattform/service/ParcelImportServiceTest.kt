package de.immovativ.vermarktungsplattform

import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import de.immovativ.vermarktungsplattform.service.ConstructionSiteImportService
import de.immovativ.vermarktungsplattform.service.ParcelImportService
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.collections.shouldHaveAtLeastSize
import org.kodein.di.instance

object ParcelImportServiceTest : FunSpec() {
    init {
        test("import existing parcels") {
            withTestApplicationAndSetup { di ->

                val constructionSiteImportService = ConstructionSiteImportService(constructionSitesRepository, cookieClient)
                constructionSiteImportService.importFromLocal()

                val parcelsRepository by di.instance<ParcelsRepository>()
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
                val importService = ParcelImportService(parcelsRepository, constructionSitesRepository, cookieClient)
                importService.importFromLocal()

                val parcels = parcelsRepository.findAll()
                parcels shouldHaveAtLeastSize 1
            }
        }
    }
}
