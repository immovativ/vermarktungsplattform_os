package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.user.ActivationResult
import de.immovativ.vermarktungsplattform.model.user.PasswordChangeRequest
import de.immovativ.vermarktungsplattform.model.user.UpdatePersonalDataRequest
import de.immovativ.vermarktungsplattform.model.user.UserActivationRequest
import de.immovativ.vermarktungsplattform.model.user.UserCreationRequest
import de.immovativ.vermarktungsplattform.model.user.UserDataUpdateRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
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
import io.ktor.server.routing.put
import mu.KLogging
import org.kodein.di.instance

class UserController(application: Application) : EnhancedController(application) {
    companion object : KLogging()

    private val userService by di.instance<UserService>()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.PROJECT_GROUP) {
                post("/api/admin/user/{userId}/activate-delegate") {
                    call.requirePathParameter("userId") { userId ->
                        userService.activateDelegate(userId).fold({
                            logger.warn(it) { "Failed to retrieve profile for userId '$userId'" }
                            call.respond(HttpStatusCode.InternalServerError)
                        }, { call.respond(HttpStatusCode.NoContent) })
                    }
                }
            }

            get("/api/self") {
                call.requirePrincipalEmail { email ->
                    userService.profileInfo(email).fold(
                        {
                            logger.warn(it) { "Failed to retrieve own profile for principal email '$email'" }
                            call.respond(HttpStatusCode.InternalServerError)
                        }
                    ) { profile ->
                        if (profile == null) {
                            call.respond(HttpStatusCode.NotFound)
                        } else {
                            call.respond(HttpStatusCode.OK, profile)
                        }
                    }
                }
            }

            post("/api/self/updatePassword") {
                val payload = call.receive<PasswordChangeRequest>()
                call.requirePrincipalEmail { email ->
                    userService.attemptPasswordUpdate(payload, email).fold(
                        {
                            logger.warn(it) { "Failed to update password for principal email '$email'" }
                            call.respond(HttpStatusCode.InternalServerError)
                        }
                    ) { updated -> // false is "business" error (wrong pw, not active, user doesn't exist)
                        call.respond(if (updated) HttpStatusCode.NoContent else HttpStatusCode.Forbidden)
                    }
                }
            }
            post("/api/self/updatePersonalData") {
                val payload = call.receive<UpdatePersonalDataRequest>()
                call.requirePrincipalEmail { email ->
                    userService.updatePersonalData(email, payload).toResponse(call)
                }
            }

            // This API updates values in the `user_data` - table, which not all user have.
            put("/api/self/userData") {
                call.requirePrincipalId { principalId ->
                    val payload = call.receive<UserDataUpdateRequest>()
                    userService.updateUserData(UserId(principalId), payload).toResponse(call)
                }
            }

            get("/api/self/userData") {
                call.requirePrincipalId { principalId ->
                    userService
                        .userData(UserId(principalId))
                        .fold(
                            {
                                logger.warn(it) { "Failed to retrieve user data for principal id '$principalId'" }
                                call.respond(HttpStatusCode.InternalServerError)
                            },
                            {
                                when (it) {
                                    null -> call.respond(HttpStatusCode.NotFound)
                                    else -> call.respond(HttpStatusCode.OK, it)
                                }
                            }
                        )
                }
            }
        }

        post("/api/user") {
            val maybeConceptAssignmentId = call.request.queryParameters["conceptAssignmentId"]?.let { ConceptAssignmentId(it) }

            val payload = call.receive<UserCreationRequest>()

            userService.create(payload, maybeConceptAssignmentId).fold(
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
                    call.respond(HttpStatusCode.Created)
                }
            )
        }

        post("/api/user/activate") {
            val userActivationRequest = call.receive<UserActivationRequest>()

            userService
                .activate(userActivationRequest)
                .fold(
                    {
                        logger.warn(it) { "Failed to activate user" }
                        call.respond(HttpStatusCode.InternalServerError)
                    },
                    {
                        when (it) {
                            is ActivationResult.Successful -> {
                                logger.debug { "User with email ${it.email} was successfully activated" }
                                call.respond(HttpStatusCode.OK)
                            }
                            else -> {
                                logger.warn { "Cannot activate user. Reason: ($it)" }
                                call.respond(HttpStatusCode.Forbidden)
                            }
                        }
                    }
                )
        }
    }
}
