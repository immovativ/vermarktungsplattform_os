package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.messaging.CandidatureMessage
import de.immovativ.vermarktungsplattform.model.messaging.CandidatureUnreadMessage
import de.immovativ.vermarktungsplattform.model.messaging.MessageDirection
import de.immovativ.vermarktungsplattform.model.messaging.MessageId
import de.immovativ.vermarktungsplattform.model.messaging.MessageRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.repository.MessageRepository
import io.ktor.http.content.PartData
import io.ktor.http.content.streamProvider
import mu.KLogging
import org.kodein.di.DI
import org.kodein.di.instance
import java.util.UUID

class MessagingService(di: DI) {
    companion object : KLogging()

    private val repo by di.instance<MessageRepository>()
    private val s3Service by di.instance<S3Service>()
    private val notificationService by di.instance<NotificationService>()

    fun createMessage(
        candidatureId: CandidatureId,
        message: MessageRequest,
        direction: MessageDirection
    ): Either<Throwable, List<CandidatureMessage>> = Either.catch {
        repo.createMessage(candidatureId, message, direction)
    }.tap {
        if (direction == MessageDirection.ADMIN_TO_USER) {
            notificationService.newMessage(candidatureId)
        }
    }

    fun getMessages(candidatureId: CandidatureId): Either<Throwable, List<CandidatureMessage>> = Either.catch {
        repo.findMessages(candidatureId)
    }

    fun findUnread(candidate: UserId?): Either<Throwable, List<CandidatureUnreadMessage>> = Either.catch {
        repo.findUnread(candidate)
    }

    fun markRead(id: CandidatureId, markDirectionRead: MessageDirection): Either<Throwable, Unit> = Either.catch {
        repo.markRead(id, markDirectionRead)
    }

    suspend fun addAttachment(
        id: CandidatureId,
        attachment: PartData.FileItem,
        direction: MessageDirection
    ): Either<Throwable, List<CandidatureMessage>> {
        val attachmentId = "msg-${UUID.randomUUID()}"
        return Either.catch {
            val fileName = attachment.originalFileName!!
            val contentType = attachment.contentType!!

            s3Service.upload(attachmentId, contentType, attachment.streamProvider().use { it.readBytes() })
                .fold(
                    {
                        logger.error(it) { "Failed to upload message attachment" }
                    },
                    {
                        logger.info { "Uploaded message attachment $attachmentId (original: $fileName)" }
                    }
                )
            repo.createAttachment(
                id,
                AttachmentMetadata(
                    id = attachmentId,
                    name = fileName,
                    contentType = contentType.toString()
                ),
                direction
            )
        }.tapLeft {
            // something crashed, better remove the attachment if possible
            s3Service.tryDelete(attachmentId)
        }
    }

    suspend fun getAttachmentAsAdmin(
        messageId: MessageId,
        candidatureId: CandidatureId
    ): Either<Throwable, AttachmentMetadata?> = Either.catch {
        repo.findAttachment(messageId, candidatureId, null)
    }
    suspend fun getAttachmentAsCandidate(
        messageId: MessageId,
        candidatureId: CandidatureId,
        userId: UserId
    ): Either<Throwable, AttachmentMetadata?> = Either.catch {
        repo.findAttachment(messageId, candidatureId, userId)
    }
}
