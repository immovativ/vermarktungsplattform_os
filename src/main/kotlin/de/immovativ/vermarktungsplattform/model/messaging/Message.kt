package de.immovativ.vermarktungsplattform.model.messaging

import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.utils.requireUUID
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@JvmInline
value class MessageId(val value: String = UUID.randomUUID().toString()) {
    init {
        requireUUID(value)
    }
}

@Serializable
data class CandidatureMessage(
    val messageId: MessageId,
    val candidatureId: CandidatureId,
    val contents: String,
    val direction: MessageDirection,
    val seenAt: Instant?,
    val created: Instant,
    val attachment: AttachmentMetadata?
)

@Serializable
data class CandidatureUnreadMessage(
    val candidatureId: CandidatureId,
    val candidatureState: CandidatureState,
    val conceptState: ConceptAssignmentState,
    val conceptId: ConceptAssignmentId,
    val conceptName: String,
    val userFirstName: String,
    val userLastName: String
)
