package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.messaging.MessageDirection
import de.immovativ.vermarktungsplattform.model.messaging.MessageId
import de.immovativ.vermarktungsplattform.model.messaging.MessageRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.service.MessagingService
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.PartData
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.request.receiveMultipart
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import mu.KLogging
import org.kodein.di.instance

class MessagingController(application: Application) : EnhancedController(application) {
    companion object : KLogging()

    private val messagingService by di.instance<MessagingService>()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.PROJECT_GROUP) {
                post("/api/admin/messaging/candidature/{id}/attachment") {
                    call.requirePathParameter("id") { candidatureId ->
                        val multipart = call.receiveMultipart()

                        val firstPart = multipart.readPart()
                        if (firstPart != null && firstPart is PartData.FileItem) {
                            try {
                                messagingService.addAttachment(
                                    CandidatureId(candidatureId),
                                    firstPart,
                                    MessageDirection.ADMIN_TO_USER
                                )
                                    .toResponse(call, { HttpStatusCode.OK to it })
                            } finally {
                                firstPart.dispose()
                            }
                        } else {
                            call.respond(HttpStatusCode.BadRequest, "Expected one multipart file attachment")
                        }
                    }
                }

                get("/api/admin/messaging/candidature/{cId}/message/{mId}/attachment") {
                    call.requirePathParameters("cId" to "mId") { candidatureId, messageId ->
                        messagingService
                            .getAttachmentAsAdmin(
                                MessageId(messageId),
                                CandidatureId(candidatureId)
                            ).fold({
                                logger.warn(it) { "Failed to retrieve message attachment for download" }
                                call.respond(HttpStatusCode.InternalServerError)
                            }) {
                                if (it == null) {
                                    call.respond(HttpStatusCode.NotFound)
                                } else {
                                    call.respondWithAttachmentDownload(it)
                                }
                            }
                    }
                }

                post("/api/admin/messaging/candidature/{id}") {
                    call.requirePathParameter("id") { candidatureId ->
                        val payload = call.receive<MessageRequest>()

                        messagingService
                            .createMessage(
                                CandidatureId(candidatureId),
                                payload,
                                direction = MessageDirection.ADMIN_TO_USER
                            ).toResponse(call, { HttpStatusCode.OK to it })
                    }
                }

                get("/api/admin/messaging/candidature/{id}/markRead") {
                    call.requirePathParameter("id") { candidatureId ->
                        messagingService
                            .markRead(
                                CandidatureId(candidatureId),
                                markDirectionRead = MessageDirection.USER_TO_ADMIN
                            ).toResponse(call, { b -> HttpStatusCode.OK to b })
                    }
                }

                get("/api/admin/messaging/candidature/{id}") {
                    call.requirePathParameter("id") { candidatureId ->

                        messagingService
                            .getMessages(
                                CandidatureId(candidatureId)
                            ).toResponse(call, { HttpStatusCode.OK to it })
                    }
                }

                get("/api/admin/messaging/unread") {
                    messagingService
                        .findUnread(
                            null
                        ).toResponse(call, { HttpStatusCode.OK to it })
                }
            }

            withRoles(UserRole.CANDIDATE) {
                get("/api/candidate/messaging/unread") {
                    call.requirePrincipalId { principalId ->
                        messagingService
                            .findUnread(
                                UserId(principalId)
                            ).toResponse(call, { b -> HttpStatusCode.OK to b })
                    }
                }

                get("/api/candidate/messaging/candidature/{id}/markRead") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("id") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) {
                                messagingService
                                    .markRead(
                                        it.candidatureWithAttachments.candidature.id,
                                        markDirectionRead = MessageDirection.ADMIN_TO_USER
                                    ).toResponse(call, { b -> HttpStatusCode.OK to b })
                            }
                        }
                    }
                }

                get("/api/candidate/messaging/candidature/{id}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("id") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) {
                                messagingService
                                    .getMessages(
                                        it.candidatureWithAttachments.candidature.id
                                    ).toResponse(call, { b -> HttpStatusCode.OK to b })
                            }
                        }
                    }
                }

                get("/api/candidate/messaging/candidature/{cId}/message/{mId}/attachment") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameters("cId" to "mId") { candidatureId, messageId ->
                            messagingService
                                .getAttachmentAsCandidate(
                                    MessageId(messageId),
                                    CandidatureId(candidatureId),
                                    UserId(principalId)
                                ).fold({
                                    logger.warn(it) { "Failed to retrieve message attachment for download" }
                                    call.respond(HttpStatusCode.InternalServerError)
                                }) {
                                    if (it == null) {
                                        call.respond(HttpStatusCode.NotFound)
                                    } else {
                                        call.respondWithAttachmentDownload(it)
                                    }
                                }
                        }
                    }
                }

                post("/api/candidate/messaging/candidature/{id}/attachment") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("id") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) {
                                val multipart = call.receiveMultipart()

                                val firstPart = multipart.readPart()
                                if (firstPart != null && firstPart is PartData.FileItem) {
                                    try {
                                        messagingService.addAttachment(
                                            CandidatureId(candidatureId),
                                            firstPart,
                                            MessageDirection.USER_TO_ADMIN
                                        )
                                            .toResponse(call, { HttpStatusCode.OK to it })
                                    } finally {
                                        firstPart.dispose()
                                    }
                                } else {
                                    call.respond(
                                        HttpStatusCode.BadRequest,
                                        "Expected one multipart file attachment"
                                    )
                                }
                            }
                        }
                    }
                }

                post("/api/candidate/messaging/candidature/{id}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("id") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) {
                                val payload = call.receive<MessageRequest>()
                                messagingService
                                    .createMessage(
                                        it.candidatureWithAttachments.candidature.id,
                                        payload,
                                        direction = MessageDirection.USER_TO_ADMIN
                                    ).toResponse(call, { b -> HttpStatusCode.OK to b })
                            }
                        }
                    }
                }
            }
        }
    }
}
