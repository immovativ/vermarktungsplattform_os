package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureStateResponse
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminCommentRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRatingRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
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
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import mu.KLogging

class CandidaturesController(application: Application) : EnhancedController(application) {
    companion object : KLogging()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.CANDIDATE, UserRole.PROJECT_GROUP) {
                post("/api/candidate/candidature/copy/{from}/{to}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameters("from" to "to") { from, to ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(from),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) { fromCandidature ->
                                call.requireCandidatureOwnership(
                                    candidatureId = CandidatureId(to),
                                    userId = UserId(principalId),
                                    states = setOf(CandidatureState.DRAFT)
                                ) { toCandidature ->
                                    candidatureService
                                        .copyTo(fromCandidature, toCandidature)
                                        .toResponse(call, HttpStatusCode.OK)
                                }
                            }
                        }
                    }
                }

                post("/api/candidate/candidatures/{conceptAssignmentId}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("conceptAssignmentId") { conceptAssignmentId ->
                            candidatureService
                                .create(ConceptAssignmentId(conceptAssignmentId), UserId(principalId))
                                .fold(
                                    {
                                        when {
                                            isDuplicateKeyError(it) -> call.respond(HttpStatusCode.Conflict)
                                            else -> {
                                                logger.warn(it) { "Could not retrieve candidature" }
                                                call.respond(HttpStatusCode.InternalServerError)
                                            }
                                        }
                                    },
                                    {
                                        when (it) {
                                            null -> call.respond(HttpStatusCode.NotFound)
                                            else -> call.respond(HttpStatusCode.Created, it)
                                        }
                                    }
                                )
                        }
                    }
                }

                get("/api/candidate/candidatures/{candidatureId}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) {
                                call.respond(HttpStatusCode.OK, it)
                            }
                        }
                    }
                }

                // Used to determine where to redirect the user from the public concept assignment page
                get("/api/candidate/candidatures/{conceptAssignmentId}/state") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("conceptAssignmentId") { conceptAssignmentId ->
                            call.requireCandidatureOwnership(
                                conceptAssignmentId = ConceptAssignmentId(conceptAssignmentId),
                                userId = UserId(principalId),
                                states = CandidatureState.values().toSet()
                            ) {
                                call.respond(
                                    HttpStatusCode.OK,
                                    CandidatureStateResponse(
                                        candidatureId = it.candidatureWithAttachments.candidature.id,
                                        state = it.candidatureWithAttachments.candidature.state
                                    )
                                )
                            }
                        }
                    }
                }

                get("/api/candidate/candidatures") {
                    call.requirePrincipalId { principalId ->
                        candidatureService
                            .getCandidatures(UserId(principalId))
                            .toResponse(call, { HttpStatusCode.OK to it })
                    }
                }

                put("/api/candidate/candidatures/{candidatureId}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.DRAFT)
                            ) {
                                val request = call.receive<EditCandidatureRequest>()

                                candidatureService
                                    .edit(it.candidatureWithAttachments.candidature.id, request)
                                    .toResponse(call, HttpStatusCode.OK)
                            }
                        }
                    }
                }

                delete("/api/candidate/candidatures/{candidatureId}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.DRAFT)
                            ) {
                                candidatureService
                                    .delete(it.candidatureWithAttachments.candidature.id, UserId(principalId))
                                    .toResponse(call, HttpStatusCode.NoContent)
                            }
                        }
                    }
                }

                put("/api/candidate/candidatures/{candidatureId}/submit") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.DRAFT)
                            ) {
                                val candidature = it.candidatureWithAttachments.candidature
                                val questions = it.conceptAssignmentWithAttachments.assignment.questions

                                if (candidature.description.isBlank()) {
                                    call.respond(
                                        HttpStatusCode.PreconditionFailed,
                                        "Description cannot be blank or empty"
                                    )
                                } else if (questions != null && !questions.validate(candidature.answers)) {
                                    call.respond(HttpStatusCode.PreconditionFailed, "Invalid answers")
                                } else {
                                    candidatureService
                                        .submit(it.candidatureWithAttachments.candidature.id)
                                        .toResponse(call, HttpStatusCode.OK)
                                }
                            }
                        }
                    }
                }

                put("/api/candidate/candidatures/{candidatureId}/revoke") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.SUBMITTED)
                            ) {
                                candidatureService
                                    .revoke(it.candidatureWithAttachments.candidature.id)
                                    .toResponse(call, HttpStatusCode.OK)
                            }
                        }
                    }
                }

                post("/api/candidate/candidatures/{candidatureId}/attachments") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.DRAFT)
                            ) { candidatureAndConceptAssignmentWithAttachments ->
                                val multipart = call.receiveMultipart()

                                val firstPart = multipart.readPart()
                                if (firstPart != null && firstPart is PartData.FileItem) {
                                    try {
                                        candidatureService
                                            .addAttachment(
                                                candidatureAndConceptAssignmentWithAttachments.candidatureWithAttachments.candidature.id,
                                                firstPart
                                            )
                                            .fold(
                                                {
                                                    call.respond(HttpStatusCode.InternalServerError)
                                                },
                                                {
                                                    when (it) {
                                                        null -> call.respond(HttpStatusCode.NotFound)
                                                        else -> call.respond(HttpStatusCode.Created, it)
                                                    }
                                                }
                                            )
                                    } finally {
                                        firstPart.dispose()
                                    }
                                } else {
                                    call.respond(HttpStatusCode.BadRequest, "Expected one multipart file attachment")
                                }
                            }
                        }
                    }
                }

                delete("/api/candidate/candidatures/{candidatureId}/attachments/{attachmentId}") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameters("candidatureId" to "attachmentId") { candidatureId, attachmentId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.DRAFT)
                            ) {
                                candidatureService
                                    .removeAttachment(
                                        it.candidatureWithAttachments.candidature.id,
                                        AttachmentId(attachmentId)
                                    )
                                    .toResponse(call, HttpStatusCode.OK)
                            }
                        }
                    }
                }

                get("/api/candidate/candidatures/{candidatureId}/attachments/zip") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("candidatureId") { candidatureId ->
                            call.requireCandidatureOwnership(
                                candidatureId = CandidatureId(candidatureId),
                                userId = UserId(principalId),
                                states = setOf(CandidatureState.SUBMITTED, CandidatureState.REJECTED, CandidatureState.ACCEPTED)
                            ) {
                                call.downloadAttachmentsAsZip(it.candidatureWithAttachments.attachments)
                            }
                        }
                    }
                }
            }

            withRoles(UserRole.CANDIDATE, UserRole.PROJECT_GROUP) {
                get("/api/candidate/candidatures/{candidatureId}/attachments/{attachmentId}") {
                    call.requirePathParameters("candidatureId" to "attachmentId") { candidatureId, attachmentId ->
                        call.requireAttachment(CandidatureId(candidatureId), AttachmentId(attachmentId)) { attachment ->
                            call.respondWithAttachmentDownload(attachment)
                        }
                    }
                }
            }

            withRoles(UserRole.PROJECT_GROUP) {
                get("/api/admin/candidatures/{id}") {
                    call.requirePathParameter("id") { candidatureId ->
                        candidatureService.findByIdAsAdmin(
                            CandidatureId(candidatureId)
                        ).fold({ t ->
                            logger.warn(t) { "Could not retrieve candidature $candidatureId as admin" }
                            call.respond(HttpStatusCode.InternalServerError)
                        }, { maybeCandidature ->
                            if (maybeCandidature == null) {
                                call.respond(HttpStatusCode.NotFound, "Not found")
                            } else {
                                call.respond(HttpStatusCode.OK, maybeCandidature)
                            }
                        })
                    }
                }

                get("/api/admin/candidatures/{id}/all") {
                    call.requirePathParameter("id") { candidatureId ->
                        candidatureService.findByIdAsAdmin(
                            CandidatureId(candidatureId),
                            CandidatureState.values().toSet()
                        ).fold({ t ->
                            logger.warn(t) { "Could not retrieve candidature $candidatureId as admin" }
                            call.respond(HttpStatusCode.InternalServerError)
                        }, { maybeCandidature ->
                            if (maybeCandidature == null) {
                                call.respond(HttpStatusCode.NotFound, "Not found")
                            } else {
                                call.respond(HttpStatusCode.OK, maybeCandidature)
                            }
                        })
                    }
                }

                post("/api/admin/candidatures/{id}/rating") {
                    call.requirePathParameter("id") { candidatureId ->
                        val id = CandidatureId(candidatureId)
                        val payload = call.receive<AdminRatingRequest>()
                        if (payload.isValid()) {
                            candidatureService
                                .rate(id, payload)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        } else {
                            call.respond(HttpStatusCode.BadRequest, "Invalid rating range (should be 1-5)")
                        }
                    }
                }

                post("/api/admin/candidatures/{id}/comment") {
                    call.requirePathParameter("id") { candidatureId ->
                        val id = CandidatureId(candidatureId)
                        val payload = call.receive<AdminCommentRequest>()
                        candidatureService
                            .comment(id, payload)
                            .toResponse(call, { HttpStatusCode.OK to it })
                    }
                }

                put("/api/admin/candidatures/{id}/reject") {
                    call.requirePathParameter("id") { candidatureId ->
                        val id = CandidatureId(candidatureId)
                        call.requireUndecidedCandidature(id) {
                            candidatureService
                                .reject(id)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }
                put("/api/admin/candidatures/{id}/grant") {
                    call.requirePathParameter("id") { candidatureId ->
                        val id = CandidatureId(candidatureId)
                        call.requireUndecidedCandidature(id) { view ->
                            candidatureService
                                .grant(
                                    id,
                                    ConceptAssignmentId(view.details.conceptAssignmentWithAttachments.assignment.id.toString())
                                )
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                get("/api/admin/candidatures/{candidatureId}/attachments/zip") {
                    call.requirePathParameter("candidatureId") { candidatureId ->
                        call.requireCandidature(CandidatureId(candidatureId)) {
                            call.downloadAttachmentsAsZip(it.details.candidatureWithAttachments.attachments)
                        }
                    }
                }
            }
        }
    }
}
