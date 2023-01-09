package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import de.immovativ.vermarktungsplattform.model.ConstructionSiteKey
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignment
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidateConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentListResult
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.PublicConcept
import de.immovativ.vermarktungsplattform.model.conceptassignment.StartConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.UpdateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import io.ktor.http.content.PartData
import io.ktor.http.content.streamProvider
import io.ktor.server.plugins.NotFoundException
import kotlinx.datetime.Clock
import mu.KLogging
import org.kodein.di.DI
import org.kodein.di.instance
import java.util.UUID

class ConceptAssignmentService(di: DI) {
    companion object : KLogging()

    private val repo by di.instance<ConceptAssignmentRepository>()
    private val s3Service by di.instance<S3Service>()
    private val parcelsRepository by di.instance<ParcelsRepository>()

    fun createDraft(request: CreateConceptAssignmentRequest): Either<Throwable, AdminConceptAssignment> {
        val parcels = request.parcelRefs.map {
            parcelsRepository.find(
                parcelId = it.parcelId,
                constructionAreaId = it.constructionAreaId,
                constructionSiteId = it.constructionSiteId
            ) ?: return Either.Left(
                NotFoundException(
                    "Given Parcel" +
                        " (parcel_id=${it.parcelId} construction_area_id=${it.constructionAreaId} construction_site_id=${it.constructionSiteId})" +
                        " not found"
                )
            )
        }

        return Either.catch {
            val created = request.asDraft(parcels)
            repo.createAndAssignParcels(created, parcels)
            created
        }
    }

    suspend fun removeAttachment(
        assignment: AdminConceptAssignmentWithAttachments,
        attachmentId: String
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> {
        return if (assignment.attachments.find { it.id == attachmentId } == null) {
            Either.Left(NotFoundException("Attachment not found"))
        } else {
            Either.catch {
                s3Service.tryDelete(attachmentId)
                repo.deleteAttachment(assignment.assignment.id, attachmentId)
                repo.findByIdForAdmin(assignment.assignment.id.toString())!!
            }
        }
    }

    suspend fun addPreviewImage(
        assignment: AdminConceptAssignmentWithAttachments,
        previewImage: PartData.FileItem
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> {
        val attachmentId = UUID.randomUUID()
        return Either.catch {
            val contentType = previewImage.contentType!!

            s3Service.upload(attachmentId.toString(), contentType, previewImage.streamProvider().use { it.readBytes() })
                .fold(
                    {
                        logger.error(it) { "Failed to upload attachment" }
                    },
                    {
                        logger.info { "Uploaded preview image $attachmentId" }
                    }
                )

            val newAssignment = assignment.assignment.copy(previewImage = attachmentId.toString())
            repo.update(assignment = assignment.copy(assignment = newAssignment), assignment.assignment.details)
        }.tapLeft {
            // something crashed, better remove the attachment if possible
            s3Service.tryDelete(attachmentId.toString())
        }.map {
            repo.findByIdForAdmin(assignment.assignment.id.toString())!!
        }
    }

    suspend fun addAttachment(
        assignment: AdminConceptAssignmentWithAttachments,
        attachment: PartData.FileItem
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> {
        val attachmentId = UUID.randomUUID()
        return Either.catch {
            val fileName = attachment.originalFileName!!
            val contentType = attachment.contentType!!

            s3Service.upload(attachmentId.toString(), contentType, attachment.streamProvider().use { it.readBytes() })
                .fold(
                    {
                        logger.error(it) { "Failed to upload attachment" }
                    },
                    {
                        logger.info { "Uploaded attachment $attachmentId (original: $fileName)" }
                    }
                )
            repo.attach(
                assignment.assignment.id.toString(),
                AttachmentMetadata(
                    id = attachmentId.toString(),
                    name = fileName,
                    contentType = contentType.toString()
                )
            )
        }.tapLeft {
            // something crashed, better remove the attachment if possible
            s3Service.tryDelete(attachmentId.toString())
        }.map {
            repo.findByIdForAdmin(assignment.assignment.id.toString())!!
        }
    }

    fun listAsProjectGroup(justStates: List<ConceptAssignmentState>?): Either<Throwable, List<ConceptAssignmentListResult>> =
        Either.catch {
            repo.findAll(justStates)
        }

    fun listAsProjectGroupForConstructionSite(constructionSiteKey: ConstructionSiteKey): Either<Throwable, List<ConceptAssignmentListResult>> =
        Either.catch {
            repo.findAll(constructionSiteKey = constructionSiteKey)
        }

    fun find(assignmentId: String): Either<Throwable, AdminConceptAssignmentWithAttachments?> = Either.catch {
        repo
            .findByIdForAdmin(assignmentId)
    }

    fun findPublic(assignmentId: String): Either<Throwable, CandidateConceptAssignmentWithAttachments?> = Either.catch {
        repo
            .findByIdForCandidate(assignmentId)
    }

    fun list(): Either<Throwable, List<PublicConcept>> = Either.catch {
        repo.list()
    }

    fun stopManually(assignment: AdminConceptAssignmentWithAttachments): Either<Throwable, AdminConceptAssignmentWithAttachments> =
        Either.catch {
            repo.stop(assignment.assignment.id.toString())
        }.map {
            repo.findByIdForAdmin(assignment.assignment.id.toString())!!
        }

    fun unstart(
        assignment: AdminConceptAssignmentWithAttachments
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> = Either.catch {
        repo.unstart(assignment)
    }.map {
        repo.findByIdForAdmin(assignment.assignment.id.toString())!!
    }

    fun abort(
        assignment: AdminConceptAssignmentWithAttachments
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> = Either.catch {
        repo.abort(assignment)
    }.map {
        repo.findByIdForAdmin(assignment.assignment.id.toString())!!
    }

    fun abortAndCopyToDraft(
        assignment: AdminConceptAssignmentWithAttachments
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> = Either.catch {
        val draft = AdminConceptAssignment(
            id = UUID.randomUUID(), name = assignment.assignment.name, parcels = assignment.assignment.parcels,
            state = ConceptAssignmentState.DRAFT,
            assignmentEnd = null, assignmentStart = null,
            createdAt = Clock.System.now(), updatedAt = Clock.System.now(),
            details = assignment.assignment.details,
            questions = assignment.assignment.questions,
            previewImage = assignment.assignment.previewImage,
            conceptAssignmentType = assignment.assignment.conceptAssignmentType
        )
        repo.abortAndCreateDraft(assignment, draft)
        repo.findByIdForAdmin(draft.id.toString())!!
    }

    fun start(
        assignment: AdminConceptAssignmentWithAttachments,
        startPayload: StartConceptAssignmentRequest
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> = Either.catch {
        repo.start(assignment, startPayload)
    }.map {
        repo.findByIdForAdmin(assignment.assignment.id.toString())!!
    }

    fun startStopEligibleAssignments(): Boolean {
        repo
            .activateEligible()
            .also {
                if (it > 0) {
                    logger.info { "Activated $it eligible assignments" }
                }
            }

        repo
            .stopEligible()
            .also {
                if (it > 0) {
                    logger.info { "Deactivated $it eligible assignments" }
                }
            }

        return false // we always handle everything in one go
    }

    suspend fun delete(assignment: AdminConceptAssignmentWithAttachments): Either<Throwable, Unit> = Either.catch {
        assignment.attachments.forEach {
            s3Service.tryDelete(it.id)
        }
        repo.deleteById(assignment.assignment.id.toString())
    }

    fun update(
        assignment: AdminConceptAssignmentWithAttachments,
        payload: UpdateConceptAssignmentRequest
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> = Either.catch {
        repo.update(assignment, payload.details)
    }.map {
        repo.findByIdForAdmin(assignment.assignment.id.toString())!!
    }

    fun updateQuestions(
        assignment: AdminConceptAssignmentWithAttachments,
        payload: CandidatureQuestions
    ): Either<Throwable, AdminConceptAssignmentWithAttachments> = Either.catch {
        repo.updateQuestions(assignment, payload)
    }.map {
        repo.findByIdForAdmin(assignment.assignment.id.toString())!!
    }
}
