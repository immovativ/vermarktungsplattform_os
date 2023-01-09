package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.model.ConstructionSiteDetails
import de.immovativ.vermarktungsplattform.model.ConstructionSiteKey
import de.immovativ.vermarktungsplattform.model.toFeatureCollection
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.repository.ConstructionSiteDetailsRepository
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import de.immovativ.vermarktungsplattform.service.ConstructionSiteImportService
import de.immovativ.vermarktungsplattform.service.ParcelImportService
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import mu.KLogging
import org.kodein.di.instance

class ConstructionSiteController(application: Application) : EnhancedController(application) {
    private val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
    private val constructionSiteImportService by di.instance<ConstructionSiteImportService>()
    private val parcelImportService by di.instance<ParcelImportService>()
    private val parcelsRepository by di.instance<ParcelsRepository>()
    private val constructionSiteDetailsRepository by di.instance<ConstructionSiteDetailsRepository>()

    companion object : KLogging()

    suspend fun ApplicationCall.requireConstructionSiteExits(
        constructionSite: ConstructionSite?,
        handleValueWhenPresent: suspend (ConstructionSite) -> Unit
    ) {
        when (constructionSite) {
            null -> respond(HttpStatusCode.NotFound)
            else -> handleValueWhenPresent(constructionSite)
        }
    }

    override fun Route.getRoutes() {
        get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/details") {
            call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                call.requireConstructionSiteExits(
                    constructionSitesRepository.find(
                        constructionAreaId,
                        constructionSiteId
                    )
                ) {
                    when (val details = constructionSiteDetailsRepository.find(constructionAreaId, constructionSiteId)) {
                        null -> call.respond(
                            HttpStatusCode.OK,
                            ConstructionSiteDetails(
                                key = ConstructionSiteKey(
                                    constructionAreaId = constructionAreaId,
                                    constructionSiteId = constructionSiteId
                                ),
                                form = "",
                                zoningClassification = "",
                                levelOfBuiltDevelopment = "",
                                marketSegments = "",
                                energySupply = "",
                                mobility = "",
                                clearance = "",
                                areaBuildingBlock = "",
                                plotAreaToBeBuiltOn = "",
                                landPricePerSqm = ""
                            )
                        )
                        else -> call.respond(HttpStatusCode.OK, details)
                    }
                }
            }
        }

        authenticate("vmp_auth") {
            withRoles(UserRole.PROJECT_GROUP) {
                get("/api/construction-area/all/feature-collection") {
                    val constructionSites: List<ConstructionSite> = constructionSitesRepository.findAll()
                    call.respond(HttpStatusCode.OK, constructionSites.toFeatureCollection())
                }

                get("/api/construction-area/available/feature-collection") {
                    val constructionSites: List<ConstructionSite> = constructionSitesRepository.findWithoutAnchor()
                    call.respond(HttpStatusCode.OK, constructionSites.toFeatureCollection())
                }

                get("/api/construction-area/unavailable/feature-collection") {
                    val constructionSites: List<ConstructionSite> = constructionSitesRepository.findWithAnchor()
                    call.respond(HttpStatusCode.OK, constructionSites.toFeatureCollection())
                }

                get("/api/construction-area/all") {
                    val constructionSites: List<ConstructionSite> = constructionSitesRepository.findAll()
                    call.respond(HttpStatusCode.OK, constructionSites)
                }

                post("/api/construction-area/import") {
                    constructionSiteImportService.importFromRemote()
                    parcelImportService.importFromRemote()
                    call.respond(HttpStatusCode.NoContent)
                }

                get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/concept-assignments") {
                    call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) {
                            conceptAssignmentService
                                .listAsProjectGroupForConstructionSite(ConstructionSiteKey(constructionAreaId = constructionAreaId, constructionSiteId = constructionSiteId))
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }
                get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}") {
                    call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) { constructionSite ->
                            call.respond(HttpStatusCode.OK, constructionSite)
                        }
                    }
                }

                get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/parcels") {
                    call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) {
                            call.respond(HttpStatusCode.OK, parcelsRepository.findAllForConstructionSite(constructionAreaId, constructionSiteId))
                        }
                    }
                }

                post("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/details") {
                    call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) {
                            val payload = call.receive<ConstructionSiteDetails>()
                            constructionSiteDetailsRepository.createOrUpdate(payload)
                            call.respond(HttpStatusCode.NoContent)
                        }
                    }
                }

                get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/parcels/available") {
                    call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) {
                            call.respond(HttpStatusCode.OK, parcelsRepository.findAvailableForConstructionSite(constructionAreaId, constructionSiteId))
                        }
                    }
                }

                get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/parcels/unavailable") {
                    call.requirePathParameters("constructionAreaId" to "constructionSiteId") { constructionAreaId, constructionSiteId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) {
                            call.respond(HttpStatusCode.OK, parcelsRepository.findUnavailableForConstructionSite(constructionAreaId, constructionSiteId))
                        }
                    }
                }

                get("/api/construction-area/{constructionAreaId}/construction-site/{constructionSiteId}/parcels/{parcelId}") {
                    call.requirePathParameters(Triple("constructionAreaId", "constructionSiteId", "parcelId")) { constructionAreaId, constructionSiteId, parcelId ->
                        call.requireConstructionSiteExits(
                            constructionSitesRepository.find(
                                constructionAreaId,
                                constructionSiteId
                            )
                        ) {
                            when (val parcel = parcelsRepository.find(constructionAreaId, constructionSiteId, parcelId)) {
                                null -> call.respond(HttpStatusCode.NotFound)
                                else -> call.respond(HttpStatusCode.OK, parcel)
                            }
                        }
                    }
                }
            }
        }
    }
}
