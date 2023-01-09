package de.immovativ.vermarktungsplattform.model.conceptassignment

import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.UuidSerializer
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithUser
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState.ACTIVE
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState.FINISHED
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState.REVIEW
import de.immovativ.vermarktungsplattform.model.question.Question
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentType
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import java.util.UUID

enum class ConceptAssignmentState {
    DRAFT,
    WAITING,
    ACTIVE,
    REVIEW,
    FINISHED,
    ABORTED,
}

@Serializable
data class CandidateConceptAssignmentWithAttachments(
    val assignment: CandidateConceptAssignment,
    val attachments: List<AttachmentMetadata>
)

@Serializable
data class AdminConceptAssignmentWithAttachments(
    val assignment: AdminConceptAssignment,
    val attachments: List<AttachmentMetadata>,
    val candidatures: List<CandidatureWithUser>
)

@Serializable
data class CandidatureQuestions(
    val questions: List<Question>
) {
    // poor man's validation => only check for existing value
    fun validate(answers: Map<QuestionId, String>): Boolean {
        return questions.all { question ->
            if (question.required) {
                !answers[question.id].isNullOrBlank()
            } else {
                true
            }
        }
    }
}

@Serializable
data class ConceptAssignmentListResult(
    val assignment: AdminConceptAssignment,
    val candidatures: Long,
    val undecidedCandidatures: Long
)

@Serializable
data class CandidateConceptAssignment(
    @Serializable(with = UuidSerializer::class)
    val id: UUID,
    val name: String,
    val parcels: List<Parcel>,
    val state: ConceptAssignmentState,
    val assignmentEnd: Instant?, // not null when state is waiting+
    val assignmentStart: Instant?, // not null when state is waiting+
    val details: ConceptDetails,
    val questions: CandidatureQuestions?,
    val previewImage: String?
)

@Serializable
data class AdminConceptAssignment(
    @Serializable(with = UuidSerializer::class)
    val id: UUID,
    val name: String,
    val parcels: List<Parcel>,
    val state: ConceptAssignmentState,
    val assignmentEnd: Instant?, // not null when state is waiting+
    val assignmentStart: Instant?, // not null when state is waiting+
    val createdAt: Instant,
    val updatedAt: Instant,
    val details: ConceptDetails,
    val questions: CandidatureQuestions?,
    val previewImage: String?,
    val conceptAssignmentType: ConceptAssignmentType
)

@Serializable
data class UpdateConceptAssignmentRequest(
    val details: ConceptDetails
)

@Serializable
data class StartConceptAssignmentRequest(
    val startsAt: Instant,
    val endsAt: Instant
)

@Serializable
data class ParcelRef(
    val parcelId: String,
    val constructionSiteId: String,
    val constructionAreaId: String
)

@Serializable
data class CreateConceptAssignmentRequest(
    val name: String,
    val parcelRefs: List<ParcelRef>,
    val buildingType: BuildingType,
    val conceptAssignmentType: ConceptAssignmentType = ConceptAssignmentType.ANLIEGER
) {
    fun asDraft(parcels: List<Parcel>): AdminConceptAssignment = AdminConceptAssignment(
        id = UUID.randomUUID(),
        name = name,
        parcels = parcels,
        state = ConceptAssignmentState.DRAFT,
        assignmentEnd = null,
        assignmentStart = null,
        createdAt = Clock.System.now(),
        updatedAt = Clock.System.now(),
        details = ConceptDetails(
            buildingType = buildingType,
            allowedFloors = null,
            allowedBuildingHeightMeters = null,
            energyText = null
        ),
        questions = null,
        previewImage = null,
        conceptAssignmentType = conceptAssignmentType
    )
}

// from list (should be small data profile)
@kotlinx.serialization.Serializable
data class PublicConcept(
    val name: String,
    val parcels: List<Parcel>,
    @Serializable(with = UuidSerializer::class)
    val id: UUID,
    val assignmentEnd: Instant?,
    val assignmentStart: Instant?,
    val conceptDetails: ConceptDetails,
    val previewImage: String?,
    val state: ConceptAssignmentState,
    val conceptAssignmentType: ConceptAssignmentType
) {
    // this will intentionally break the "/api/assignments" endpoint,
    // when someone did change the filters in the SQL query
    init {
        require(state in setOf(ACTIVE, REVIEW, FINISHED)) {
            "Don't leak any information to the outside!"
        }
    }
}

@kotlinx.serialization.Serializable
data class AvailableConceptDetails(
    val name: String,
    val parcels: List<Parcel>,
    val state: ConceptAssignmentState,
    @Serializable(with = UuidSerializer::class)
    val id: UUID,
    val assignmentEnd: Instant?,
    val assignmentStart: Instant?,
    val attachments: List<AttachmentMetadata>,
    val details: ConceptDetails,
    val questions: CandidatureQuestions?,
    val conceptAssignmentType: ConceptAssignmentType
)
