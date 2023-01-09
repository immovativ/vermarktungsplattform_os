package de.immovativ.vermarktungsplattform

import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.service.ConstructionSiteImportService
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.collections.shouldHaveAtLeastSize
import org.kodein.di.instance

object ConstructionSiteImportServiceTest : FunSpec() {
    init {
        test("import existing shapes") {
            withTestApplicationAndSetup { di ->
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
                val importService = ConstructionSiteImportService(constructionSitesRepository, cookieClient)
                importService.importFromLocal()

                constructionSitesRepository.findAll() shouldHaveAtLeastSize 1
            }
        }
    }
}
