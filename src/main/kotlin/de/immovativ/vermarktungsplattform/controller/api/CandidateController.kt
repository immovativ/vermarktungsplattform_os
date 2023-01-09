package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.user.DelegateCreationRequest
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import de.immovativ.vermarktungsplattform.service.ProfileService
import de.immovativ.vermarktungsplattform.service.UserService
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import mu.KLogging
import org.kodein.di.instance

class CandidateController(application: Application) : EnhancedController(application) {
    companion object : KLogging()

    private val profileService by di.instance<ProfileService>()
    private val userService by di.instance<UserService>()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.PROJECT_GROUP) {
                get("/api/admin/candidates/list") {
                    profileService.retrieveList().toResponse(call, { HttpStatusCode.OK to it })
                }
                get("/api/admin/candidates/{id}") {
                    call.requirePathParameter("id") { candidateId ->
                        profileService.retrieveProfile(candidateId)
                            .fold({ t ->
                                logger.warn(t) { "Could not retrieve candidate profile $candidateId as admin" }
                                call.respond(HttpStatusCode.InternalServerError)
                            }, { profile ->
                                if (profile == null) {
                                    call.respond(HttpStatusCode.NotFound, "Not found")
                                } else {
                                    call.respond(HttpStatusCode.OK, profile)
                                }
                            })
                    }
                }

                get("/api/admin/candidate/delegate") {
                    profileService.retrieveDelegates().toResponse(call, { HttpStatusCode.OK to it })
                }

                post("/api/admin/candidate/delegate") {
                    val payload = call.receive<DelegateCreationRequest>()

                    userService.create(payload.toUserCreationRequest(), null, UserStatus.DELEGATED).fold(
                        {
                            when {
                                isDuplicateKeyError(it) -> call.respond(HttpStatusCode.Conflict)
                                else -> {
                                    logger.warn(it) { "Failed to create user" }
                                    call.respond(HttpStatusCode.InternalServerError)
                                }
                            }
                        },
                        {
                            call.respond(HttpStatusCode.Created, it)
                        }
                    )
                }
            }
        }
    }
}
