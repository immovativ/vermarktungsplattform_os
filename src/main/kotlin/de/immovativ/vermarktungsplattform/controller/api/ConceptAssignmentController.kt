package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.conceptassignment.AvailableConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.StartConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.UpdateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.PartData
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.http.content.LocalFileContent
import io.ktor.server.request.receive
import io.ktor.server.request.receiveMultipart
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import mu.KLogging

class ConceptAssignmentController(application: Application) : EnhancedController(application) {
    companion object : KLogging()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.PROJECT_GROUP) {
                post("/api/admin/concept-assignment") {
                    val payload = call.receive<CreateConceptAssignmentRequest>()
                    conceptAssignmentService.createDraft(payload).toResponse(call, { HttpStatusCode.OK to it })
                }

                get("/api/admin/concept-assignments") {
                    val justStates = call.request.queryParameters["state"]
                        ?.split(",")
                        ?.mapNotNull {
                            try {
                                ConceptAssignmentState.valueOf(it)
                            } catch (e: IllegalArgumentException) {
                                null
                            }
                        }
                    conceptAssignmentService.listAsProjectGroup(justStates)
                        .toResponse(call, { HttpStatusCode.OK to it })
                }

                delete("/api/admin/concept-assignment/{id}") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireDraftAssignment(assignmentId) { assignment ->

                            conceptAssignmentService.delete(assignment)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/questions") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireDraftAssignment(assignmentId) { assignment ->
                            val payload = call.receive<CandidatureQuestions>()

                            conceptAssignmentService.updateQuestions(assignment, payload)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/details") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireDraftAssignment(assignmentId) { assignment ->
                            val payload = call.receive<UpdateConceptAssignmentRequest>()

                            conceptAssignmentService.update(assignment, payload)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/start") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireAssignmentState(
                            assignmentId,
                            setOf(ConceptAssignmentState.DRAFT, ConceptAssignmentState.WAITING)
                        ) { assignment ->
                            val startPayload = call.receive<StartConceptAssignmentRequest>()

                            conceptAssignmentService.start(assignment, startPayload)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/abortAndDraft") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireAssignmentState(
                            assignmentId,
                            setOf(ConceptAssignmentState.REVIEW)
                        ) { assignment ->
                            conceptAssignmentService.abortAndCopyToDraft(assignment)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/abort") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireAssignmentState(
                            assignmentId,
                            setOf(ConceptAssignmentState.REVIEW)
                        ) { assignment ->
                            conceptAssignmentService.abort(assignment)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/unstart") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireAssignmentState(
                            assignmentId,
                            setOf(ConceptAssignmentState.WAITING)
                        ) { assignment ->
                            conceptAssignmentService.unstart(assignment)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/finishManually") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireAssignmentState(
                            assignmentId,
                            setOf(ConceptAssignmentState.ACTIVE)
                        ) { assignment ->
                            conceptAssignmentService.stopManually(assignment)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/attachment") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireDraftAssignment(assignmentId) { assignment ->
                            val multipart = call.receiveMultipart()

                            val firstPart = multipart.readPart()
                            if (firstPart != null && firstPart is PartData.FileItem) {
                                try {
                                    conceptAssignmentService.addAttachment(assignment, firstPart)
                                        .toResponse(call, { HttpStatusCode.OK to it })
                                } finally {
                                    firstPart.dispose()
                                }
                            } else {
                                call.respond(HttpStatusCode.BadRequest, "Expected one multipart file attachment")
                            }
                        }
                    }
                }

                post("/api/admin/concept-assignment/{id}/preview") {
                    call.requirePathParameter("id") { assignmentId ->
                        call.requireDraftAssignment(assignmentId) { assignment ->
                            val multipart = call.receiveMultipart()

                            val firstPart = multipart.readPart()
                            if (firstPart != null && firstPart is PartData.FileItem) {
                                try {
                                    conceptAssignmentService.addPreviewImage(assignment, firstPart)
                                        .toResponse(call, { HttpStatusCode.OK to it })
                                } finally {
                                    firstPart.dispose()
                                }
                            } else {
                                call.respond(HttpStatusCode.BadRequest, "Expected one multipart file attachment")
                            }
                        }
                    }
                }

                // need a dedicated "private" API since get is only public when state is active
                get("/api/admin/concept-assignment/{assignmentId}/attachment/{attachmentId}") {
                    call.requirePathParameters("assignmentId" to "attachmentId") { assignmentId, attachmentId ->
                        call.requireAttachment(assignmentId, attachmentId) { (_, attachment) ->
                            call.respondWithAttachmentDownload(attachment)
                        }
                    }
                }

                delete("/api/admin/concept-assignment/{assignmentId}/attachment/{attachmentId}") {
                    call.requirePathParameters("assignmentId" to "attachmentId") { assignmentId, attachmentId ->
                        call.requireDraftAssignment(assignmentId) { assignment ->
                            conceptAssignmentService
                                .removeAttachment(assignment, attachmentId)
                                .toResponse(call, { HttpStatusCode.OK to it })
                        }
                    }
                }

                get("/api/admin/concept-assignment/{id}") {
                    call.requirePathParameter("id") { assignmentId ->
                        conceptAssignmentService.find(assignmentId).fold({ t ->
                            logger.warn(t) { "Could not retrieve project assignment" }
                            call.respond(HttpStatusCode.InternalServerError)
                        }, { maybeProject ->
                            if (maybeProject == null) {
                                call.respond(HttpStatusCode.NotFound, "Not found")
                            } else {
                                call.respond(HttpStatusCode.OK, maybeProject)
                            }
                        })
                    }
                }

                get("/api/admin/concept-assignment/{assignmentId}/attachment/zip") {
                    call.requirePathParameter("assignmentId") { assignmentId ->
                        call.requireAssignmentExists(
                            assignmentId
                        ) {
                            call.downloadAttachmentsAsZip(it.attachments)
                        }
                    }
                }
            }

            withRoles(UserRole.CANDIDATE) {
                get("/api/assignment/{assignmentId}/attachment/zip") {
                    call.requirePrincipalId { principalId ->
                        call.requirePathParameter("assignmentId") { assignmentId ->
                            call.requireCandidatureOwnership(
                                ConceptAssignmentId(assignmentId),
                                UserId(principalId),
                                CandidatureState.values().toSet()
                            ) {
                                call.downloadAttachmentsAsZip(it.conceptAssignmentWithAttachments.attachments)
                            }
                        }
                    }
                }
            }
        }

        get("/api/assignments") {
            conceptAssignmentService.list().toResponse(call, { HttpStatusCode.OK to it })
        }

        get("/api/assignment/{assignmentId}") {
            call.requirePathParameter("assignmentId") { assignmentId ->
                call.requirePublicAssignment(assignmentId) {
                    call.respond(
                        HttpStatusCode.OK,
                        AvailableConceptDetails(
                            name = it.assignment.name,
                            parcels = it.assignment.parcels,
                            state = it.assignment.state,
                            id = it.assignment.id,
                            assignmentEnd = it.assignment.assignmentEnd,
                            assignmentStart = it.assignment.assignmentStart,
                            attachments = it.attachments,
                            details = it.assignment.details,
                            questions = it.assignment.questions,
                            conceptAssignmentType = it.assignment.conceptAssignmentType
                        )
                    )
                }
            }
        }

        get("/api/assignment/{assignmentId}/preview") {
            call.requirePathParameter("assignmentId") { assignmentId ->
                call.requirePublicAssignment(assignmentId) {
                    if (it.assignment.previewImage == null) {
                        call.respond(HttpStatusCode.NotFound)
                    } else {
                        val file = kotlin.io.path.createTempFile().toFile()
                        try {
                            s3Service.download(it.assignment.previewImage, file).fold(
                                {
                                    call.respond(HttpStatusCode.NotFound)
                                },
                                {
                                    call.respond(LocalFileContent(file, ContentType.Image.JPEG))
                                }
                            )
                        } finally {
                            file.delete()
                        }
                    }
                }
            }
        }

        get("/api/assignment/{assignmentId}/attachment/{attachmentId}") {
            call.requirePathParameters("assignmentId" to "attachmentId") { assignmentId, attachmentId ->
                call.requireAttachmentAndAssignmentActive(assignmentId, attachmentId) { attachment ->
                    call.respondWithAttachmentDownload(attachment)
                }
            }
        }
    }
}
