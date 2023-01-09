package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import kotlinx.serialization.json.JsonObject
import org.kodein.di.instance

class ConstructionSitesRepositoryTest : FunSpec() {
    init {
        test("upsert") {
            AppSpecSupport.withTestApplicationAndSetup { di ->
                val constructionSitesRepository by di.instance<ConstructionSitesRepository>()

                val constructionSite = ConstructionSite(
                    constructionAreaId = "420",
                    constructionSiteId = "42",
                    comment = "fkbr",
                    fid = "1",
                    text = "kuci",
                    shape = JsonObject(emptyMap())
                )

                constructionSitesRepository.createOrUpdate(constructionSite)

                constructionSitesRepository.find(
                    constructionAreaId = constructionSite.constructionAreaId,
                    constructionSiteId = constructionSite.constructionSiteId
                ) shouldBe constructionSite

                constructionSitesRepository.createOrUpdate(constructionSite.copy(comment = "sxoe"))

                constructionSitesRepository.find(
                    constructionAreaId = constructionSite.constructionAreaId,
                    constructionSiteId = constructionSite.constructionSiteId
                )
                    .shouldNotBeNull()
                    .comment shouldBe "sxoe"
            }
        }
    }
}
