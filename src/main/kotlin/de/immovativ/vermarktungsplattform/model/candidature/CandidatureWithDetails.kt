package de.immovativ.vermarktungsplattform.model.candidature

import de.immovativ.vermarktungsplattform.KtorJson
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminComment
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRating
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.AvailableConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidateConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.model.user.UserData
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString

@Serializable
data class CandidatureWithDetails(
    val id: CandidatureId,
    val conceptDetails: AvailableConceptDetails,
    val userId: UserId,
    val state: CandidatureState,
    val description: String,
    val createdAt: Instant,
    val updatedAt: Instant
)

fun Map<QuestionId, String>.getFileUploadAnswerIds() = this.values.mapNotNull {
    try {
        KtorJson.decodeFromString<AttachmentMetadata>(it).id
    } catch (e: Exception) {
        null
    }
}

@Serializable
data class Candidature(
    val id: CandidatureId,
    val conceptAssignmentId: ConceptAssignmentId,
    val userId: UserId,
    val state: CandidatureState,
    val description: String,
    val answers: Map<QuestionId, String>,
    val createdAt: Instant,
    val updatedAt: Instant
)

@Serializable
data class CandidateData(
    val firstName: String,
    val lastName: String,
    val company: String?,
    val street: String?,
    val houseNumber: String?,
    val zipCode: String?,
    val city: String?,
    val accountType: String,
    val email: String,
    val userStatus: UserStatus
)

@Serializable
data class CandidatureWithUser(
    val candidature: Candidature,
    val user: CandidateData,
    val rating: AdminRating?
)

@Serializable
data class CandidatureWithAttachments(
    val candidature: Candidature,
    val attachments: List<AttachmentMetadata>
)

@Serializable
data class CandidatureAndConceptAssignmentWithAttachments(
    val candidatureWithAttachments: CandidatureWithAttachments,
    val conceptAssignmentWithAttachments: CandidateConceptAssignmentWithAttachments
)

@Serializable
data class AdminCandidatureAndConceptAssignmentWithAttachments(
    val candidatureWithAttachments: CandidatureWithAttachments,
    val conceptAssignmentWithAttachments: AdminConceptAssignmentWithAttachments
)

@Serializable
data class AdminCandidatureView(
    val details: AdminCandidatureAndConceptAssignmentWithAttachments,
    val user: UserData,
    val email: String,
    val comment: AdminComment?
)

enum class CandidatureState {
    DRAFT,
    SUBMITTED,
    REJECTED,
    ACCEPTED
}
