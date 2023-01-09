package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentId
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.Candidature
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithAttachments
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithDetails
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.candidature.getFileUploadAnswerIds
import de.immovativ.vermarktungsplattform.model.conceptassignment.AvailableConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptDetails
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.model.user.ProvidedAuth
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.repository.CandidatureTable.toCandidature
import de.immovativ.vermarktungsplattform.repository.CandidatureTable.toCandidatureWithDetails
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Join
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.batchInsert
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.util.UUID

object CandidatureAttachmentTable : Table("candidature_attachments") {
    val attachmentId: Column<String> = varchar("attachment_id", 36)
    val candidatureId: Column<String> = varchar("candidature_id", 36).references(CandidatureTable.id)
    val attachmentName: Column<String> = varchar("name", 255)
    val contentType: Column<String> = varchar("content_type", 255)
}

@Serializable
data class AnswersWrapper(
    val answers: Map<QuestionId, String>
)

object CandidatureTable : Table("candidatures") {
    val id = varchar("id", 36)
    val conceptAssignmentId = varchar("concept_assignment_id", 36).references(ConceptAssignmentTable.id)
    val userId = varchar("user_id", 36).references(UserTable.id)
    val state: Column<CandidatureState> =
        customEnumeration("state", null, { value -> CandidatureState.valueOf(value as String) }, { it.name })
    val description = text("description")
    val answers = jsonb("answers", AnswersWrapper::class)
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")

    val adminRating = integer("admin_rating").nullable()

    fun ResultRow.toCandidatureWithDetails(parcels: List<Parcel>) = CandidatureWithDetails(
        id = CandidatureId(this[id]),
        conceptDetails = AvailableConceptDetails(
            name = this[ConceptAssignmentTable.name],
            parcels = parcels,
            id = UUID.fromString(this[ConceptAssignmentTable.id]),
            state = this[ConceptAssignmentTable.state],
            assignmentEnd = this[ConceptAssignmentTable.assignmentEnd],
            assignmentStart = this[ConceptAssignmentTable.assignmentStart],
            attachments = emptyList(),
            details = ConceptDetails(
                buildingType = this[ConceptAssignmentTable.buildingType],
                allowedFloors = this[ConceptAssignmentTable.allowedFloors],
                allowedBuildingHeightMeters = this[ConceptAssignmentTable.allowedBuildingHeightMeters],
                energyText = this[ConceptAssignmentTable.energyText]
            ),
            questions = this[ConceptAssignmentTable.questions],
            conceptAssignmentType = this[ConceptAssignmentTable.conceptAssignmentType]
        ),
        userId = UserId(this[userId]),
        description = this[description],
        state = this[state],
        createdAt = this[createdAt],
        updatedAt = this[updatedAt]
    )

    fun ResultRow.toCandidature() = Candidature(
        id = CandidatureId(this[id]),
        userId = UserId(this[userId]),
        conceptAssignmentId = ConceptAssignmentId(this[conceptAssignmentId]),
        description = this[description],
        answers = this[answers].answers,
        state = this[state],
        createdAt = this[createdAt],
        updatedAt = this[updatedAt]
    )
}

class CandidatureRepository : TestCleanable {
    override fun deleteAllOnlyForTesting(): Unit = transaction {
        CandidatureAttachmentTable.deleteAll()
        CandidatureTable.deleteAll()
    }

    fun create(
        candidatureId: CandidatureId,
        conceptAssignmentId: ConceptAssignmentId,
        userId: UserId,
        now: Instant
    ): Candidature? = transaction {
        CandidatureTable.insert {
            it[id] = candidatureId.value
            it[CandidatureTable.conceptAssignmentId] = conceptAssignmentId.value
            it[CandidatureTable.userId] = userId.value
            it[state] = CandidatureState.DRAFT
            it[description] = ""
            it[answers] = AnswersWrapper(emptyMap())
            it[createdAt] = now
            it[updatedAt] = now
            it[adminRating] = null
        }

        return@transaction findCandidatureById(candidatureId, userId)
    }

    fun getCandidatures(userId: UserId): List<CandidatureWithDetails> = transaction {
        Join(
            table = CandidatureTable,
            otherTable = ConceptAssignmentTable,
            joinType = JoinType.INNER,
            onColumn = CandidatureTable.conceptAssignmentId,
            otherColumn = ConceptAssignmentTable.id
        ).innerJoin(ParcelToConceptAssignmentTable)
            .innerJoin(ParcelsTable)
            .select { CandidatureTable.userId eq userId.value }
            .toList()
            .groupBy { it[ConceptAssignmentTable.id] }
            .mapValues { (_, values) ->
                val row = values.first()
                val parcels = values.map {
                    Parcel(
                        fid = it[ParcelsTable.fid],
                        area = it[ParcelsTable.area],
                        parcelId = it[ParcelsTable.parcelId],
                        shape = it[ParcelsTable.shape],
                        constructionSiteId = it[ParcelsTable.constructionSiteId],
                        constructionAreaId = it[ParcelsTable.constructionAreaId],
                        parcelType = it[ParcelsTable.parcelType]
                    )
                }
                row.toCandidatureWithDetails(parcels)
            }
            .values
            .toList()
    }

    fun findUserIdAndConceptAssignmentIdBy(candidatureId: CandidatureId): Pair<UserId, ConceptAssignmentId>? =
        transaction {
            CandidatureTable
                .slice(CandidatureTable.userId, CandidatureTable.conceptAssignmentId)
                .select {
                    (CandidatureTable.id eq candidatureId.value)
                }
                .firstOrNull()
                ?.let { UserId(it[CandidatureTable.userId]) to ConceptAssignmentId(it[CandidatureTable.conceptAssignmentId]) }
        }
    fun delete(id: CandidatureId) {
        transaction {
            CandidatureTable
                .deleteWhere { CandidatureTable.id eq id.value }
        }
    }

    private fun findCandidatureById(id: CandidatureId, userId: UserId): Candidature? = CandidatureTable
        .select {
            (CandidatureTable.id eq id.value) and (CandidatureTable.userId eq userId.value)
        }
        .firstOrNull()
        ?.toCandidature()

    fun findCandidatureWithAttachmentsById(
        id: CandidatureId,
        auth: ProvidedAuth,
        states: Set<CandidatureState>
    ): CandidatureWithAttachments? =
        transaction {
            val authCheck: Op<Boolean> = when (auth) {
                ProvidedAuth.LoggedInAdmin -> Op.TRUE
                is ProvidedAuth.LoggedInUser -> (CandidatureTable.userId eq auth.id.value)
            }
            val maybeCandidature = CandidatureTable
                .select {
                    (CandidatureTable.id eq id.value) and
                        authCheck and
                        (CandidatureTable.state inList states)
                }
                .firstOrNull()
                ?.toCandidature()

            maybeCandidature?.let { candidature ->
                val fileUploadQuestionAnswerIds = candidature.answers.getFileUploadAnswerIds()

                val attachments = CandidatureAttachmentTable
                    .select {
                        (CandidatureAttachmentTable.candidatureId eq candidature.id.value) and
                            (CandidatureAttachmentTable.attachmentId notInList fileUploadQuestionAnswerIds)
                    }
                    .map {
                        AttachmentMetadata(
                            it[CandidatureAttachmentTable.attachmentId],
                            name = it[CandidatureAttachmentTable.attachmentName],
                            contentType = it[CandidatureAttachmentTable.contentType]
                        )
                    }

                CandidatureWithAttachments(
                    candidature = candidature,
                    attachments = attachments
                )
            }
        }

    fun findCandidatureWithAttachmentsById(
        conceptAssignmentId: ConceptAssignmentId,
        user: UserId,
        states: Set<CandidatureState>
    ): CandidatureWithAttachments? =
        transaction {
            val maybeCandidature = CandidatureTable
                .select {
                    (CandidatureTable.conceptAssignmentId eq conceptAssignmentId.value) and
                        (CandidatureTable.userId eq user.value) and
                        (CandidatureTable.state inList states)
                }
                .firstOrNull()
                ?.toCandidature()

            maybeCandidature?.let { candidature ->
                val attachments = CandidatureAttachmentTable
                    .select { CandidatureAttachmentTable.candidatureId eq candidature.id.value }
                    .map {
                        AttachmentMetadata(
                            it[CandidatureAttachmentTable.attachmentId],
                            name = it[CandidatureAttachmentTable.attachmentName],
                            contentType = it[CandidatureAttachmentTable.contentType]
                        )
                    }

                CandidatureWithAttachments(
                    candidature = candidature,
                    attachments = attachments
                )
            }
        }

    fun submit(candidatureId: CandidatureId) = transaction {
        CandidatureTable
            .update({
                CandidatureTable.id eq candidatureId.value
            }) {
                it[state] = CandidatureState.SUBMITTED
                it[updatedAt] = Clock.System.now()
            }
    }

    fun revoke(candidatureId: CandidatureId) = transaction {
        CandidatureTable
            .update({
                CandidatureTable.id eq candidatureId.value
            }) {
                it[state] = CandidatureState.DRAFT
                it[updatedAt] = Clock.System.now()
            }
    }

    fun addAttachment(
        candidatureId: CandidatureId,
        attachmentId: AttachmentId,
        attachmentName: String,
        contentType: String
    ) = transaction {
        CandidatureAttachmentTable.insert {
            it[CandidatureAttachmentTable.candidatureId] = candidatureId.value
            it[CandidatureAttachmentTable.attachmentId] = attachmentId.value
            it[CandidatureAttachmentTable.attachmentName] = attachmentName
            it[CandidatureAttachmentTable.contentType] = contentType
        }
    }

    fun addAttachments(
        candidatureId: CandidatureId,
        attachments: List<AttachmentMetadata>
    ) = transaction {
        CandidatureAttachmentTable.batchInsert(attachments) {
            this[CandidatureAttachmentTable.candidatureId] = candidatureId.value
            this[CandidatureAttachmentTable.attachmentId] = it.id
            this[CandidatureAttachmentTable.attachmentName] = it.name
            this[CandidatureAttachmentTable.contentType] = it.contentType
        }
    }

    fun removeAttachment(candidatureId: CandidatureId, attachmentId: AttachmentId) = transaction {
        CandidatureAttachmentTable
            .deleteWhere {
                (CandidatureAttachmentTable.candidatureId eq candidatureId.value) and
                    (CandidatureAttachmentTable.attachmentId eq attachmentId.value)
            }
    }

    fun findAttachment(candidatureId: CandidatureId, attachmentId: AttachmentId) = transaction {
        CandidatureAttachmentTable
            .select {
                (CandidatureAttachmentTable.candidatureId eq candidatureId.value) and
                    (CandidatureAttachmentTable.attachmentId eq attachmentId.value)
            }
            .firstOrNull()
            ?.let {
                AttachmentMetadata(
                    it[CandidatureAttachmentTable.attachmentId],
                    name = it[CandidatureAttachmentTable.attachmentName],
                    contentType = it[CandidatureAttachmentTable.contentType]
                )
            }
    }

    fun edit(candidatureId: CandidatureId, request: EditCandidatureRequest) = transaction {
        CandidatureTable
            .update({
                CandidatureTable.id eq candidatureId.value
            }) {
                it[description] = request.description
                it[answers] = AnswersWrapper(request.answers)
                it[updatedAt] = Clock.System.now()
            }
    }
}
