package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import arrow.core.flatMap
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentId
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureAndConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureView
import de.immovativ.vermarktungsplattform.model.candidature.Candidature
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureAndConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithDetails
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminCommentRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRatingRequest
import de.immovativ.vermarktungsplattform.model.candidature.getFileUploadAnswerIds
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.user.ProvidedAuth
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.repository.AdminCandidatureRepository
import de.immovativ.vermarktungsplattform.repository.CandidatureRepository
import de.immovativ.vermarktungsplattform.repository.CandidatureTable
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentRepository
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable
import de.immovativ.vermarktungsplattform.repository.UserDataRepository
import de.immovativ.vermarktungsplattform.utils.TextSanitizer
import io.ktor.http.content.PartData
import io.ktor.http.content.streamProvider
import kotlinx.datetime.Clock
import mu.KotlinLogging
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import org.kodein.di.DI
import org.kodein.di.instance
import java.util.UUID

class CandidatureService(di: DI) {
    companion object {
        private val logger = KotlinLogging.logger { }
        private val nonDraft = CandidatureState.values().filterNot { it == CandidatureState.DRAFT }.toSet()
    }

    private val candidatureRepository by di.instance<CandidatureRepository>()
    private val adminCandidatureRepository by di.instance<AdminCandidatureRepository>()
    private val userDataRepository by di.instance<UserDataRepository>()
    private val conceptAssignmentRepository by di.instance<ConceptAssignmentRepository>()
    private val s3Service by di.instance<S3Service>()
    private val notificationService by di.instance<NotificationService>()

    fun getCandidatures(userId: UserId): Either<Throwable, List<CandidatureWithDetails>> = Either.catch {
        candidatureRepository.getCandidatures(userId)
    }

    fun findByIdAsAdmin(
        candidatureId: CandidatureId,
        states: Set<CandidatureState> = nonDraft
    ): Either<Throwable, AdminCandidatureView?> = Either.catchAndFlatten {
        val candidature = candidatureRepository.findCandidatureWithAttachmentsById(
            candidatureId,
            ProvidedAuth.LoggedInAdmin,
            states
        )

        if (candidature != null) {
            val conceptAssignment =
                conceptAssignmentRepository.findByIdForAdmin(candidature.candidature.conceptAssignmentId.value)

            if (conceptAssignment != null) {
                return@catchAndFlatten Either.Right(
                    AdminCandidatureAndConceptAssignmentWithAttachments(
                        candidature,
                        conceptAssignment
                    )
                )
            }
        }

        return@catchAndFlatten Either.Left(IllegalStateException("Candidature and concept assignment not found"))
    }.map { found ->
        val comment = adminCandidatureRepository.find(candidatureId)
        userDataRepository.findById(found.candidatureWithAttachments.candidature.userId)?.let { user ->
            AdminCandidatureView(found, email = user.first, user = user.second, comment = comment)
        }
    }

    fun findById(
        candidatureId: CandidatureId,
        auth: ProvidedAuth,
        state: Set<CandidatureState>
    ): Either<Throwable, CandidatureAndConceptAssignmentWithAttachments?> = Either.catchAndFlatten {
        val candidature = candidatureRepository.findCandidatureWithAttachmentsById(candidatureId, auth, state)

        if (candidature != null) {
            val conceptAssignment =
                conceptAssignmentRepository.findByIdForCandidate(candidature.candidature.conceptAssignmentId.value)

            if (conceptAssignment != null) {
                return@catchAndFlatten Either.Right(
                    CandidatureAndConceptAssignmentWithAttachments(
                        candidature,
                        conceptAssignment
                    )
                )
            }
        }

        return@catchAndFlatten Either.Left(IllegalStateException("Candidature and concept assignment not found"))
    }

    fun findById(
        conceptAssignmentId: ConceptAssignmentId,
        user: UserId,
        state: Set<CandidatureState>
    ): Either<Throwable, CandidatureAndConceptAssignmentWithAttachments?> = Either.catchAndFlatten {
        val candidature = candidatureRepository.findCandidatureWithAttachmentsById(conceptAssignmentId, user, state)

        if (candidature != null) {
            val conceptAssignment =
                conceptAssignmentRepository.findByIdForCandidate(candidature.candidature.conceptAssignmentId.value)

            if (conceptAssignment != null) {
                return@catchAndFlatten Either.Right(
                    CandidatureAndConceptAssignmentWithAttachments(
                        candidature,
                        conceptAssignment
                    )
                )
            }
        }

        return@catchAndFlatten Either.Left(IllegalStateException("Candidature and concept assignment not found"))
    }

    fun create(conceptAssignmentId: ConceptAssignmentId, userId: UserId): Either<Throwable, Candidature?> =
        Either.catch {
            val id = CandidatureId()
            val now = Clock.System.now()

            candidatureRepository.create(id, conceptAssignmentId, userId, now)
        }

    fun submit(candidatureId: CandidatureId) = Either.catch {
        candidatureRepository.submit(candidatureId)
    }

    fun revoke(candidatureId: CandidatureId) = Either.catch {
        candidatureRepository.revoke(candidatureId)
    }

    suspend fun addAttachment(
        candidatureId: CandidatureId,
        attachment: PartData.FileItem
    ): Either<Throwable, AttachmentMetadata?> {
        val attachmentId = UUID.randomUUID()

        return Either.catch {
            val fileName = attachment.originalFileName!!
            val contentType = attachment.contentType!!

            s3Service.upload(attachmentId.toString(), contentType, attachment.streamProvider().use { it.readBytes() })
                .fold({
                    logger.error(it) { "Failed to upload attachment" }
                }, {
                    logger.info { "Uploaded attachment $attachmentId (original: $fileName)" }
                })

            candidatureRepository.addAttachment(
                candidatureId = candidatureId,
                attachmentId = AttachmentId(attachmentId.toString()),
                attachmentName = fileName,
                contentType = contentType.toString()
            )

            candidatureRepository.findAttachment(candidatureId, AttachmentId(attachmentId.toString()))
        }.tapLeft {
            // something crashed, better remove the attachment if possible
            s3Service.tryDelete(attachmentId.toString())
        }
    }

    suspend fun removeAttachment(
        candidatureId: CandidatureId,
        attachmentId: AttachmentId
    ) = Either.catch {
        s3Service.tryDelete(attachmentId.value)
        candidatureRepository.removeAttachment(candidatureId, attachmentId)
    }

    fun edit(candidatureId: CandidatureId, request: EditCandidatureRequest) = Either.catch {
        candidatureRepository.edit(candidatureId, request)
    }

    suspend fun delete(candidatureId: CandidatureId, userId: UserId) = Either.catch {
        findById(candidatureId, ProvidedAuth.LoggedInUser(userId), setOf(CandidatureState.DRAFT))
            .flatMap {
                if (it === null) {
                    Either.Left(IllegalStateException("No candidature with given id for user found."))
                } else {
                    Either.Right(it)
                }
            }
            .tap { candidature ->
                candidature.candidatureWithAttachments.attachments.forEach {
                    removeAttachment(candidatureId, AttachmentId(it.id))
                        .tapLeft { exception -> return@catch Either.Left(exception) }
                }
                candidatureRepository.delete(candidatureId)
            }
    }

    fun reject(id: CandidatureId): Either<Throwable, AdminCandidatureView> = Either.catch {
        transaction {
            CandidatureTable
                .update({
                    CandidatureTable.id.eq(id.value).and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
                }) {
                    it[CandidatureTable.state] = CandidatureState.REJECTED
                }
        }
    }.flatMap {
        findByIdAsAdmin(id)
    }.map {
        it!!
    }.tap {
        notificationService.reject(it)
    }

    fun rate(id: CandidatureId, rating: AdminRatingRequest): Either<Throwable, AdminCandidatureView> = Either.catch {
        adminCandidatureRepository.setRating(id, rating.rating)
    }.flatMap {
        findByIdAsAdmin(id)
    }.map {
        it!!
    }

    fun comment(id: CandidatureId, comment: AdminCommentRequest): Either<Throwable, AdminCandidatureView> =
        Either.catch {
            adminCandidatureRepository.createOrUpdateComment(id, TextSanitizer.sanitize(comment.text))
        }.flatMap {
            findByIdAsAdmin(id)
        }.map {
            it!!
        }

    fun grant(id: CandidatureId, cid: ConceptAssignmentId): Either<Throwable, AdminCandidatureView> = Either.catch {
        transaction {
            CandidatureTable
                .update({
                    CandidatureTable.id.eq(id.value).and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
                }) {
                    it[CandidatureTable.state] = CandidatureState.ACCEPTED
                }
            // reject all others
            CandidatureTable
                .update({
                    CandidatureTable.conceptAssignmentId.eq(cid.value)
                        .and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
                }) {
                    it[CandidatureTable.state] = CandidatureState.REJECTED
                }
            // update assignment
            ConceptAssignmentTable
                .update({
                    ConceptAssignmentTable.id.eq(cid.value)
                }) {
                    it[ConceptAssignmentTable.state] = ConceptAssignmentState.FINISHED
                }
        }
    }.flatMap {
        findByIdAsAdmin(id)
    }.map {
        it!!
    }.tap {
        notificationService.grant(it)

        val candidatureIds = transaction {
            CandidatureTable
                .select {
                    (CandidatureTable.conceptAssignmentId eq cid.value) and (CandidatureTable.state eq CandidatureState.REJECTED)
                }
                .map { row -> row[CandidatureTable.id] }
        }

        for (candidatureId in candidatureIds) {
            notificationService.reject(CandidatureId(candidatureId))
        }
    }

    suspend fun copyTo(
        from: CandidatureAndConceptAssignmentWithAttachments,
        to: CandidatureAndConceptAssignmentWithAttachments
    ): Either<Throwable, Unit> {
        val copiedAttachments = mutableListOf<AttachmentMetadata>()

        return Either.catch {
            val editCandidatureRequest = EditCandidatureRequest(
                description = from.candidatureWithAttachments.candidature.description,
                answers = to.candidatureWithAttachments.candidature.answers
            )

            val fileUploadQuestionAnswerIds =
                from.candidatureWithAttachments.candidature.answers.getFileUploadAnswerIds()
            val attachmentsToCopy =
                from.candidatureWithAttachments.attachments.filterNot { it.id in fileUploadQuestionAnswerIds }

            attachmentsToCopy.forEach { attachment ->
                val targetKey = UUID.randomUUID().toString()

                s3Service.copy(attachment.id, targetKey)

                copiedAttachments.add(
                    AttachmentMetadata(
                        id = targetKey,
                        name = attachment.name,
                        contentType = attachment.contentType
                    )
                )
            }

            val toId = to.candidatureWithAttachments.candidature.id

            transaction {
                candidatureRepository.edit(toId, editCandidatureRequest)
                candidatureRepository.addAttachments(toId, copiedAttachments)
            }

            Unit
        }.tapLeft {
            // something crashed, better remove the attachments if possible
            copiedAttachments.forEach {
                s3Service.tryDelete(it.id)
            }
        }
    }
}
