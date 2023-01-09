package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.config.AuthConfig.Companion.destroyAuth
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentId
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureView
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureAndConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.user.ProvidedAuth
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.repository.CandidatureRepository
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentRepository
import de.immovativ.vermarktungsplattform.service.CandidatureService
import de.immovativ.vermarktungsplattform.service.ConceptAssignmentService
import de.immovativ.vermarktungsplattform.service.S3Service
import io.ktor.http.ContentDisposition
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.http.content.LocalFileContent
import io.ktor.server.request.header
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondOutputStream
import mu.KLogging
import org.kodein.di.DI
import org.kodein.di.instance
import org.kodein.di.ktor.closestDI
import org.kodein.di.ktor.controller.AbstractDIController
import org.postgresql.util.PSQLException
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

abstract class EnhancedController(application: Application) : AbstractDIController(application) {
    companion object : KLogging()

    final override val di: DI by closestDI { application }
    val conceptAssignmentService by di.instance<ConceptAssignmentService>()
    val conceptAssignmentRepository by di.instance<ConceptAssignmentRepository>()
    val candidatureRepository by di.instance<CandidatureRepository>()
    val candidatureService by di.instance<CandidatureService>()
    val s3Service by di.instance<S3Service>()

    fun isDuplicateKeyError(e: Throwable?): Boolean {
        return e != null && e.cause is PSQLException && (e.cause as PSQLException).sqlState == "23505"
    }

    suspend fun ApplicationCall.requireAttachmentAndAssignmentActive(
        assignmentId: String,
        attachmentId: String,
        handleValueWhenPresent: suspend (AttachmentMetadata) -> Unit
    ) {
        requireAttachment(assignmentId = assignmentId, attachmentId = attachmentId) { stateWithAttachment ->
            when (stateWithAttachment.first) {
                ConceptAssignmentState.ACTIVE -> handleValueWhenPresent((stateWithAttachment.second))
                // do not disclose if attachment/assignment even exists here
                else -> respond(HttpStatusCode.NotFound, "Attachment or assignment not found")
            }
        }
    }

    suspend fun ApplicationCall.requireAttachment(
        assignmentId: String,
        attachmentId: String,
        handleValueWhenPresent: suspend (Pair<ConceptAssignmentState, AttachmentMetadata>) -> Unit
    ) {
        val attachmentWithState = conceptAssignmentRepository
            .findAttachmentWithState(assignmentId = assignmentId, attachmentId = attachmentId)
        if (attachmentWithState == null) {
            respond(HttpStatusCode.NotFound, "Attachment or assignment not found")
        } else {
            handleValueWhenPresent(attachmentWithState)
        }
    }

    suspend fun ApplicationCall.requireAttachment(
        candidatureId: CandidatureId,
        attachmentId: AttachmentId,
        handleValueWhenPresent: suspend (AttachmentMetadata) -> Unit
    ) {
        when (val attachment = candidatureRepository.findAttachment(candidatureId, attachmentId)) {
            null -> respond(HttpStatusCode.NotFound, "Attachment not found")
            else -> handleValueWhenPresent(attachment)
        }
    }

    suspend fun ApplicationCall.requirePublicAssignment(
        id: String,
        handleValueWhenPresent: suspend (AdminConceptAssignmentWithAttachments) -> Unit
    ) {
        conceptAssignmentService.find(id).fold(
            {
                logger.warn(it) { "Failed to require draft assignment" }
                respond(HttpStatusCode.InternalServerError)
            },
            {
                when (it) {
                    null -> respond(HttpStatusCode.NotFound)
                    else -> if (it.assignment.state == ConceptAssignmentState.ACTIVE) {
                        handleValueWhenPresent(it)
                    } else {
                        respond(HttpStatusCode.NotFound)
                    }
                }
            }
        )
    }

    suspend fun ApplicationCall.requireAssignmentExists(
        id: String,
        handleValueWhenPresent: suspend (AdminConceptAssignmentWithAttachments) -> Unit
    ) {
        conceptAssignmentService.find(id).fold(
            {
                logger.warn(it) { "Failed to require draft assignment" }
                respond(HttpStatusCode.InternalServerError)
            },
            {
                when (it) {
                    null -> respond(HttpStatusCode.NotFound)
                    else -> handleValueWhenPresent(it)
                }
            }
        )
    }

    suspend fun ApplicationCall.requireAssignmentState(
        id: String,
        allowedState: Set<ConceptAssignmentState>,
        handleValueWhenPresent: suspend (AdminConceptAssignmentWithAttachments) -> Unit
    ) {
        requireAssignmentExists(id) {
            if (allowedState.contains(it.assignment.state)) {
                handleValueWhenPresent(it)
            } else {
                respond(HttpStatusCode.FailedDependency, "wrong state")
            }
        }
    }

    suspend fun ApplicationCall.requireDraftAssignment(
        id: String,
        handleValueWhenPresent: suspend (AdminConceptAssignmentWithAttachments) -> Unit
    ) = requireAssignmentState(id, setOf(ConceptAssignmentState.DRAFT), handleValueWhenPresent)

    suspend fun ApplicationCall.requirePathParameter(name: String, handleValueWhenPresent: suspend (String) -> Unit) {
        val value: String? = parameters[name]

        if (value.isNullOrBlank()) {
            respond(HttpStatusCode.BadRequest, "Path params cannot be blank or empty")
        } else {
            handleValueWhenPresent(value)
        }
    }

    suspend fun ApplicationCall.requireUndecidedCandidature(
        candidatureId: CandidatureId,
        handleValueWhenPresent: suspend (AdminCandidatureView) -> Unit
    ) {
        candidatureService.findByIdAsAdmin(
            candidatureId
        ).fold({ t ->
            logger.warn(t) { "Could not retrieve candidature $candidatureId as admin" }
            respond(HttpStatusCode.InternalServerError)
        }, { maybeCandidature ->
            if (maybeCandidature == null) {
                respond(HttpStatusCode.NotFound, "Not found")
            } else {
                when {
                    maybeCandidature.details.conceptAssignmentWithAttachments.assignment.state != ConceptAssignmentState.REVIEW -> respond(
                        HttpStatusCode.FailedDependency,
                        "Wrong assignment state"
                    )
                    maybeCandidature.details.candidatureWithAttachments.candidature.state != CandidatureState.SUBMITTED -> respond(
                        HttpStatusCode.FailedDependency,
                        "Wrong candidature state"
                    )
                    else -> handleValueWhenPresent(maybeCandidature)
                }
            }
        })
    }

    suspend fun ApplicationCall.requireCandidature(
        candidatureId: CandidatureId,
        handleValueWhenPresent: suspend (AdminCandidatureView) -> Unit
    ) {
        candidatureService.findByIdAsAdmin(
            candidatureId
        ).fold({ t ->
            logger.warn(t) { "Could not retrieve candidature $candidatureId as admin" }
            respond(HttpStatusCode.InternalServerError)
        }, { maybeCandidature ->
            if (maybeCandidature == null) {
                respond(HttpStatusCode.NotFound, "Not found")
            } else {
                handleValueWhenPresent(maybeCandidature)
            }
        })
    }

    suspend fun ApplicationCall.requireCandidatureOwnership(
        candidatureId: CandidatureId,
        userId: UserId,
        states: Set<CandidatureState>,
        handleValueWhenPresent: suspend (CandidatureAndConceptAssignmentWithAttachments) -> Unit
    ) {
        candidatureService
            .findById(candidatureId, ProvidedAuth.LoggedInUser(userId), states)
            .fold(
                {
                    logger.warn(it) { "Could not retrieve candidature for candidatureId='${candidatureId.value}'" }
                    respond(HttpStatusCode.NotFound)
                },
                {
                    when (it) {
                        null -> respond(HttpStatusCode.NotFound)
                        else -> handleValueWhenPresent(it)
                    }
                }
            )
    }

    suspend fun ApplicationCall.downloadAttachmentsAsZip(attachments: List<AttachmentMetadata>) {
        response.header(
            HttpHeaders.ContentDisposition,
            ContentDisposition.Attachment.withParameter("filename", "attachments.zip").toString()
        )

        respondOutputStream(ContentType.parse("application/octet-stream")) {
            buffered().use { bufferedOutputStream ->
                ZipOutputStream(bufferedOutputStream).use { zipOutputStream ->
                    attachments.forEach { attachment ->
                        s3Service.download(attachment.id).use { attachmentInputStream ->
                            zipOutputStream.putNextEntry(ZipEntry(attachment.name))
                            attachmentInputStream.copyTo(zipOutputStream)
                            zipOutputStream.closeEntry()
                        }
                    }
                }
            }
        }
    }

    suspend fun ApplicationCall.requireCandidatureOwnership(
        conceptAssignmentId: ConceptAssignmentId,
        userId: UserId,
        states: Set<CandidatureState>,
        handleValueWhenPresent: suspend (CandidatureAndConceptAssignmentWithAttachments) -> Unit
    ) {
        candidatureService
            .findById(conceptAssignmentId, userId, states)
            .fold(
                {
                    logger.warn(it) { "Could not retrieve candidature for conceptAssignmentId='${conceptAssignmentId.value}'" }
                    respond(HttpStatusCode.NotFound)
                },
                {
                    when (it) {
                        null -> respond(HttpStatusCode.NotFound)
                        else -> handleValueWhenPresent(it)
                    }
                }
            )
    }

    suspend fun ApplicationCall.requirePathParameters(
        names: Pair<String, String>,
        handleValueWhenPresent: suspend (String, String) -> Unit
    ) {
        val v1: String? = parameters[names.first]
        val v2: String? = parameters[names.second]

        if (v1.isNullOrBlank() || v2.isNullOrBlank()) {
            respond(HttpStatusCode.BadRequest, "Path params cannot be blank or empty")
        } else {
            handleValueWhenPresent(v1, v2)
        }
    }

    suspend fun ApplicationCall.requirePathParameters(
        names: Triple<String, String, String>,
        handleValueWhenPresent: suspend (String, String, String) -> Unit
    ) {
        val v1: String? = parameters[names.first]
        val v2: String? = parameters[names.second]
        val v3: String? = parameters[names.third]

        if (v1.isNullOrBlank() || v2.isNullOrBlank() || v3.isNullOrBlank()) {
            respond(HttpStatusCode.BadRequest, "Path params cannot be blank or empty")
        } else {
            handleValueWhenPresent(v1, v2, v3)
        }
    }

    suspend fun ApplicationCall.requireQueryParameter(name: String, handleValueWhenPresent: suspend (String) -> Unit) {
        val value: String? = request.queryParameters[name]

        if (value.isNullOrBlank()) {
            respond(HttpStatusCode.BadRequest, "Query params cannot be blank or empty")
        } else {
            handleValueWhenPresent(value)
        }
    }

    suspend fun ApplicationCall.requirePrincipalEmail(whenSet: suspend (String) -> Unit) {
        val email = principal<JWTPrincipal>()?.get("email")
        if (email.isNullOrBlank()) {
            destroyAuth()
            respond(HttpStatusCode.Forbidden)
        } else {
            whenSet(email)
        }
    }

    suspend fun ApplicationCall.requirePrincipalId(whenSet: suspend (String) -> Unit) {
        val jwtRole = principal<JWTPrincipal>()?.get("role")
        val delegatedId = request.header("X-DELEGATED-ID")
        if (
            jwtRole?.let { UserRole.valueOf(it) } == UserRole.PROJECT_GROUP &&
            delegatedId != null
        ) {
            whenSet(delegatedId)
        } else {
            val userId = principal<JWTPrincipal>()?.get("id")
            if (userId.isNullOrBlank()) {
                destroyAuth()
                respond(HttpStatusCode.Forbidden)
            } else {
                whenSet(userId)
            }
        }
    }

    suspend fun ApplicationCall.respondWithAttachmentDownload(attachment: AttachmentMetadata) {
        val file = kotlin.io.path.createTempFile().toFile()

        // actual filename in download instead of just random tempfile
        response.header(
            HttpHeaders.ContentDisposition,
            ContentDisposition.Attachment.withParameter(
                ContentDisposition.Parameters.FileName,
                attachment.name
            ).toString()
        )

        try {
            s3Service.download(attachment.id, file).fold(
                {
                    respond(HttpStatusCode.NotFound)
                },
                {
                    respond(
                        LocalFileContent(
                            file,
                            ContentType.parse(attachment.contentType)
                        )
                    )
                }
            )
        } finally {
            file.delete()
        }
    }
}
