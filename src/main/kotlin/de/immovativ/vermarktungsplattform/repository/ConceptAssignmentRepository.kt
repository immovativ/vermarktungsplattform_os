package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.ConstructionSiteKey
import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.CandidateData
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithUser
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRating
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignment
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidateConceptAssignment
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidateConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentListResult
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.PublicConcept
import de.immovativ.vermarktungsplattform.model.conceptassignment.StartConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.question.FileUploadQuestion
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import de.immovativ.vermarktungsplattform.repository.CandidatureTable.toCandidature
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.assignmentEnd
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.assignmentStart
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.conceptAssignmentType
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.createdAt
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.name
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.previewImage
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.questions
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.state
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable.updatedAt
import kotlinx.datetime.Clock
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Join
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.alias
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.andWhere
import org.jetbrains.exposed.sql.count
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.util.UUID

enum class ConceptAssignmentType {
    ANCHOR,
    ANLIEGER
}

object ConceptAssignmentAttachmentTable : Table("concept_assignment_attachments") {
    val attachmentId: Column<String> = varchar("attachment_id", 36)
    val assignmentId: Column<String> = varchar("assignment_id", 36).references(ConceptAssignmentTable.id)
    val attachmentName: Column<String> = varchar("name", 255)
    val contentType: Column<String> = varchar("content_type", 255)
}

object ParcelToConceptAssignmentTable : Table("parcels_to_concept_assignments") {
    val id: Column<Int> = integer("id")
    val parcelId: Column<String> = varchar("parcel_id", 20) references ParcelsTable.parcelId
    val constructionAreaId: Column<String> = varchar("construction_area_id", 20) references ParcelsTable.constructionAreaId
    val constructionSiteId: Column<String> = varchar("construction_site_id", 20) references ParcelsTable.constructionSiteId
    val conceptAssignmentId: Column<String> = varchar("concept_assignment_id", 36) references ConceptAssignmentTable.id

    override val primaryKey = PrimaryKey(id)
}

object ConceptAssignmentTable : Table("concept_assignments") {
    val id: Column<String> = varchar("id", 36)
    val name: Column<String> = varchar("name", 255)
    val state: Column<ConceptAssignmentState> =
        customEnumeration("state", null, { value -> ConceptAssignmentState.valueOf(value as String) }, { it.name })
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
    val assignmentStart = timestamp("assignment_start").nullable()
    val assignmentEnd = timestamp("assignment_end").nullable()

    val questions: Column<CandidatureQuestions?> = jsonb("questions", CandidatureQuestions::class).nullable()

    val buildingType: Column<BuildingType> =
        customEnumeration("building_type", null, { value -> BuildingType.valueOf(value as String) }, { it.name })

    val allowedFloors: Column<Int?> = integer("allowed_floors").nullable()
    val allowedBuildingHeightMeters: Column<Double?> = double("allowed_building_height_meters").nullable()
    val energyText: Column<String?> = text("energy_text").nullable()
    val previewImage: Column<String?> = text("preview_image").nullable()

    val conceptAssignmentType: Column<ConceptAssignmentType> = enumerationByName("concept_assignment_type", 40, ConceptAssignmentType::class)
}

class ConceptAssignmentRepository : TestCleanable {

    override val priority: Int
        get() = 20

    fun create(assignment: AdminConceptAssignment) = transaction {
        createNoTransaction(assignment)
    }

    private fun createNoTransaction(assignment: AdminConceptAssignment) = ConceptAssignmentTable.insert {
        it[id] = assignment.id.toString()
        it[name] = assignment.name
        it[state] = assignment.state
        it[createdAt] = assignment.createdAt
        it[updatedAt] = assignment.updatedAt
        it[assignmentStart] = assignment.assignmentStart
        it[assignmentEnd] = assignment.assignmentEnd

        it[buildingType] = assignment.details.buildingType
        it[allowedFloors] = assignment.details.allowedFloors
        it[allowedBuildingHeightMeters] = assignment.details.allowedBuildingHeightMeters
        it[energyText] = assignment.details.energyText

        it[questions] = assignment.questions
        it[previewImage] = assignment.previewImage
        it[conceptAssignmentType] = assignment.conceptAssignmentType
    }

    fun createAndAssignParcels(assignment: AdminConceptAssignment, parcels: List<Parcel>) = transaction {
        createNoTransaction(assignment)
        parcels.forEach {
            assignParcel(assignment.id.toString(), it)
        }
    }

    fun assignParcel(assignmentId: String, p: Parcel) = ParcelToConceptAssignmentTable.insert {
        it[this.parcelId] = p.parcelId
        it[this.constructionAreaId] = p.constructionAreaId
        it[this.constructionSiteId] = p.constructionSiteId
        it[this.conceptAssignmentId] = assignmentId
    }

    override fun deleteAllOnlyForTesting(): Unit = transaction {
        ParcelToConceptAssignmentTable.deleteAll()
        ConceptAssignmentAttachmentTable.deleteAll()
        ConceptAssignmentTable.deleteAll()
    }

    fun attach(assignmentId: String, attachment: AttachmentMetadata) = transaction {
        ConceptAssignmentAttachmentTable
            .insert {
                it[ConceptAssignmentAttachmentTable.attachmentId] = attachment.id
                it[ConceptAssignmentAttachmentTable.assignmentId] = assignmentId
                it[ConceptAssignmentAttachmentTable.attachmentName] = attachment.name
                it[ConceptAssignmentAttachmentTable.contentType] = attachment.contentType
            }
    }

    fun findAll(justState: List<ConceptAssignmentState>? = null, constructionSiteKey: ConstructionSiteKey? = null): List<ConceptAssignmentListResult> = transaction {
        val candidatureCount = CandidatureTable.slice(CandidatureTable.id.count())
            .select {
                CandidatureTable.conceptAssignmentId.eq(ConceptAssignmentTable.id)
                    .and(CandidatureTable.state.neq(CandidatureState.DRAFT))
            }
        val candidatureCountSub = SubQueryExpression<Long>(candidatureCount.alias("cc"))

        val undecidedCandidatureCount = CandidatureTable.slice(CandidatureTable.id.count())
            .select {
                CandidatureTable.conceptAssignmentId.eq(ConceptAssignmentTable.id)
                    .and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
            }
        val undecidedCandidatureCountSub = SubQueryExpression<Long>(undecidedCandidatureCount.alias("ucc"))

        val relevantFields =
            ConceptAssignmentTable
                .innerJoin(ParcelToConceptAssignmentTable)
                .innerJoin(ParcelsTable)
                .slice(ConceptAssignmentTable.fields + candidatureCountSub + undecidedCandidatureCountSub + ParcelsTable.fields)
        val selection = relevantFields
            .selectAll()
            .let { selection ->
                if (justState.isNullOrEmpty()) {
                    selection
                } else {
                    selection.andWhere { ConceptAssignmentTable.state.inList(justState) }
                }
            }.let { selection ->
                if (constructionSiteKey == null) {
                    selection
                } else {
                    selection
                        .andWhere { ParcelsTable.constructionAreaId eq constructionSiteKey.constructionAreaId }
                        .andWhere { ParcelsTable.constructionSiteId eq constructionSiteKey.constructionSiteId }
                }
            }

        selection
            .toList()
            .groupBy {
                it[ConceptAssignmentTable.id]
            }.mapValues { (_, values) ->
                val conceptAssignmentRow = values.first()
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
                ConceptAssignmentListResult(
                    assignment = mapFull(conceptAssignmentRow, parcels),
                    candidatures = conceptAssignmentRow[candidatureCountSub],
                    undecidedCandidatures = conceptAssignmentRow[undecidedCandidatureCountSub]
                )
            }
            .values
            .toList()
            .sortedWith(compareBy(nullsLast()) { it.assignment.assignmentStart })
    }

    private fun mapRestricted(it: ResultRow, parcels: List<Parcel>): CandidateConceptAssignment =
        CandidateConceptAssignment(
            id = UUID.fromString(it[ConceptAssignmentTable.id]),
            name = it[name],
            parcels = parcels,
            state = it[state],
            assignmentEnd = it[assignmentEnd],
            assignmentStart = it[assignmentStart],
            details = ConceptDetails(
                buildingType = it[ConceptAssignmentTable.buildingType],
                allowedFloors = it[ConceptAssignmentTable.allowedFloors],
                allowedBuildingHeightMeters = it[ConceptAssignmentTable.allowedBuildingHeightMeters],
                energyText = it[ConceptAssignmentTable.energyText]
            ),
            questions = it[questions],
            previewImage = it[previewImage]
        )

    private fun mapFull(it: ResultRow, parcels: List<Parcel>): AdminConceptAssignment =
        AdminConceptAssignment(
            id = UUID.fromString(it[ConceptAssignmentTable.id]),
            name = it[name],
            parcels = parcels,
            state = it[state],
            assignmentEnd = it[assignmentEnd],
            assignmentStart = it[assignmentStart],
            createdAt = it[createdAt],
            updatedAt = it[updatedAt],
            details = ConceptDetails(
                buildingType = it[ConceptAssignmentTable.buildingType],
                allowedFloors = it[ConceptAssignmentTable.allowedFloors],
                allowedBuildingHeightMeters = it[ConceptAssignmentTable.allowedBuildingHeightMeters],
                energyText = it[ConceptAssignmentTable.energyText]
            ),
            questions = it[questions],
            previewImage = it[previewImage],
            conceptAssignmentType = it[conceptAssignmentType]
        )

    fun findAttachmentWithState(
        assignmentId: String,
        attachmentId: String
    ): Pair<ConceptAssignmentState, AttachmentMetadata>? = transaction {
        Join(
            ConceptAssignmentTable,
            otherTable = ConceptAssignmentAttachmentTable,
            joinType = JoinType.INNER,
            onColumn = ConceptAssignmentTable.id,
            otherColumn = ConceptAssignmentAttachmentTable.assignmentId
        )
            .select {
                ConceptAssignmentAttachmentTable.assignmentId.eq(assignmentId)
                    .and(ConceptAssignmentAttachmentTable.attachmentId.eq(attachmentId))
            }
            .limit(1)
            .map {
                it[ConceptAssignmentTable.state] to AttachmentMetadata(
                    it[ConceptAssignmentAttachmentTable.attachmentId],
                    name = it[ConceptAssignmentAttachmentTable.attachmentName],
                    contentType = it[ConceptAssignmentAttachmentTable.contentType]
                )
            }.firstOrNull()
    }

    fun findByIdForCandidate(assignmentId: String): CandidateConceptAssignmentWithAttachments? = transaction {
        val parcels = ParcelToConceptAssignmentTable
            .leftJoin(ParcelsTable)
            .select { ParcelToConceptAssignmentTable.conceptAssignmentId.eq(assignmentId) }
            .map {
                Parcel(
                    fid = it[ParcelsTable.fid],
                    area = it[ParcelsTable.area],
                    parcelType = it[ParcelsTable.parcelType],
                    parcelId = it[ParcelsTable.parcelId],
                    shape = it[ParcelsTable.shape],
                    constructionSiteId = it[ParcelsTable.constructionSiteId],
                    constructionAreaId = it[ParcelsTable.constructionAreaId]
                )
            }

        val assignment = ConceptAssignmentTable
            .select { ConceptAssignmentTable.id.eq(assignmentId) }
            .limit(1)
            .map {
                mapRestricted(it, parcels)
            }
            .firstOrNull()
        assignment?.let { found ->
            val attachments = ConceptAssignmentAttachmentTable
                .select { ConceptAssignmentAttachmentTable.assignmentId.eq(assignmentId) }
                .map {
                    AttachmentMetadata(
                        it[ConceptAssignmentAttachmentTable.attachmentId],
                        name = it[ConceptAssignmentAttachmentTable.attachmentName],
                        contentType = it[ConceptAssignmentAttachmentTable.contentType]
                    )
                }
            CandidateConceptAssignmentWithAttachments(found, attachments)
        }
    }

    fun findByIdForAdmin(assignmentId: String): AdminConceptAssignmentWithAttachments? = transaction {
        val parcels = ParcelToConceptAssignmentTable
            .leftJoin(ParcelsTable)
            .select { ParcelToConceptAssignmentTable.conceptAssignmentId.eq(assignmentId) }
            .map {
                Parcel(
                    fid = it[ParcelsTable.fid],
                    area = it[ParcelsTable.area],
                    parcelType = it[ParcelsTable.parcelType],
                    parcelId = it[ParcelsTable.parcelId],
                    shape = it[ParcelsTable.shape],
                    constructionSiteId = it[ParcelsTable.constructionSiteId],
                    constructionAreaId = it[ParcelsTable.constructionAreaId]
                )
            }

        val assignment = ConceptAssignmentTable
            .select { ConceptAssignmentTable.id.eq(assignmentId) }
            .limit(1)
            .map {
                mapFull(it, parcels)
            }
            .firstOrNull()

        val candidatures: List<CandidatureWithUser> =
            CandidatureTable
                .join(
                    UserDataTable,
                    onColumn = CandidatureTable.userId,
                    otherColumn = UserDataTable.userId,
                    joinType = JoinType.INNER
                )
                .join(
                    UserTable,
                    onColumn = CandidatureTable.userId,
                    otherColumn = UserTable.id,
                    joinType = JoinType.INNER
                )
                .slice(CandidatureTable.fields + UserDataTable.firstName + UserDataTable.lastName + UserDataTable.company + UserDataTable.street + UserDataTable.houseNumber + UserDataTable.zipCode + UserDataTable.city + UserDataTable.accountType + UserTable.email + UserTable.status)
                .select {
                    CandidatureTable.conceptAssignmentId.eq(assignmentId)
                        .and(CandidatureTable.state.neq(CandidatureState.DRAFT) or UserTable.status.eq(UserStatus.DELEGATED))
                }
                .orderBy(CandidatureTable.createdAt, SortOrder.DESC)
                .map {
                    CandidatureWithUser(
                        it.toCandidature(),
                        CandidateData(
                            firstName = it[UserDataTable.firstName],
                            lastName = it[UserDataTable.lastName],
                            company = it[UserDataTable.company],
                            street = it[UserDataTable.street],
                            houseNumber = it[UserDataTable.houseNumber],
                            zipCode = it[UserDataTable.zipCode],
                            city = it[UserDataTable.city],
                            accountType = it[UserDataTable.accountType],
                            email = it[UserTable.email],
                            userStatus = it[UserTable.status]
                        ),
                        rating = it[CandidatureTable.adminRating]?.let { r -> AdminRating(r) }
                    )
                }
        assignment?.let { found ->
            val attachments = ConceptAssignmentAttachmentTable
                .select { ConceptAssignmentAttachmentTable.assignmentId.eq(assignmentId) }
                .map {
                    AttachmentMetadata(
                        it[ConceptAssignmentAttachmentTable.attachmentId],
                        name = it[ConceptAssignmentAttachmentTable.attachmentName],
                        contentType = it[ConceptAssignmentAttachmentTable.contentType]
                    )
                }
            AdminConceptAssignmentWithAttachments(found, attachments, candidatures)
        }
    }

    fun list(): List<PublicConcept> = transaction {
        ConceptAssignmentTable
            .leftJoin(ParcelToConceptAssignmentTable)
            .leftJoin(ParcelsTable)
            .slice(ConceptAssignmentTable.fields + ParcelsTable.fields)
            .select {
                state inList setOf(
                    ConceptAssignmentState.ACTIVE,
                    ConceptAssignmentState.REVIEW,
                    ConceptAssignmentState.FINISHED
                )
            }
            .toList()
            .groupBy { it[ConceptAssignmentTable.id] }
            .mapValues { (_, values) ->
                val row = values.first()
                val parcels = values.map {
                    Parcel(
                        fid = it[ParcelsTable.fid],
                        area = it[ParcelsTable.area],
                        parcelType = it[ParcelsTable.parcelType],
                        parcelId = it[ParcelsTable.parcelId],
                        shape = it[ParcelsTable.shape],
                        constructionSiteId = it[ParcelsTable.constructionSiteId],
                        constructionAreaId = it[ParcelsTable.constructionAreaId]
                    )
                }

                PublicConcept(
                    id = UUID.fromString(row[ConceptAssignmentTable.id]),
                    name = row[name],
                    parcels = parcels,
                    assignmentEnd = row[assignmentEnd],
                    assignmentStart = row[assignmentStart],
                    previewImage = row[previewImage],
                    conceptDetails = ConceptDetails(
                        buildingType = row[ConceptAssignmentTable.buildingType],
                        allowedFloors = row[ConceptAssignmentTable.allowedFloors],
                        allowedBuildingHeightMeters = row[ConceptAssignmentTable.allowedBuildingHeightMeters],
                        energyText = row[ConceptAssignmentTable.energyText]
                    ),
                    state = row[ConceptAssignmentTable.state],
                    conceptAssignmentType = row[ConceptAssignmentTable.conceptAssignmentType]
                )
            }.values.toList()
    }

    fun deleteAttachment(id: UUID, attachmentId: String) = transaction {
        ConceptAssignmentAttachmentTable
            .deleteWhere {
                ConceptAssignmentAttachmentTable.assignmentId.eq(id.toString())
                    .and(ConceptAssignmentAttachmentTable.attachmentId.eq(attachmentId))
            }
    }

    fun stop(id: String) = transaction {
        ConceptAssignmentTable
            .update({
                ConceptAssignmentTable.id.eq(id)
                    .and(ConceptAssignmentTable.state.eq(ConceptAssignmentState.ACTIVE))
            }) {
                it[ConceptAssignmentTable.assignmentEnd] = Clock.System.now()
                it[ConceptAssignmentTable.state] = ConceptAssignmentState.REVIEW
            }
    }

    fun unstart(assignment: AdminConceptAssignmentWithAttachments) = transaction {
        ConceptAssignmentTable
            .update({
                ConceptAssignmentTable.id.eq(assignment.assignment.id.toString())
                    .and(ConceptAssignmentTable.state.eq(ConceptAssignmentState.WAITING))
            }) {
                it[ConceptAssignmentTable.assignmentStart] = null
                it[ConceptAssignmentTable.assignmentEnd] = null
                it[ConceptAssignmentTable.state] = ConceptAssignmentState.DRAFT
            }
    }

    fun start(assignment: AdminConceptAssignmentWithAttachments, startPayload: StartConceptAssignmentRequest) =
        transaction {
            val nextState = if (Clock.System.now() >= startPayload.startsAt) {
                ConceptAssignmentState.ACTIVE
            } else {
                ConceptAssignmentState.WAITING
            }
            ConceptAssignmentTable
                .update({ ConceptAssignmentTable.id.eq(assignment.assignment.id.toString()) }) {
                    it[ConceptAssignmentTable.assignmentStart] = startPayload.startsAt
                    it[ConceptAssignmentTable.assignmentEnd] = startPayload.endsAt
                    it[ConceptAssignmentTable.state] = nextState
                }
        }

    fun activateEligible() = transaction {
        ConceptAssignmentTable
            .update({
                ConceptAssignmentTable.state.eq(ConceptAssignmentState.WAITING)
                    .and(ConceptAssignmentTable.assignmentStart.lessEq(Clock.System.now()))
            }) {
                it[ConceptAssignmentTable.state] = ConceptAssignmentState.ACTIVE
            }
    }

    fun stopEligible() = transaction {
        ConceptAssignmentTable
            .update({
                ConceptAssignmentTable.state.eq(ConceptAssignmentState.ACTIVE)
                    .and(ConceptAssignmentTable.assignmentEnd.lessEq(Clock.System.now()))
            }) {
                it[ConceptAssignmentTable.state] = ConceptAssignmentState.REVIEW
            }
    }

    fun deleteById(assignmentId: String) = transaction {
        ParcelToConceptAssignmentTable.deleteWhere { ParcelToConceptAssignmentTable.conceptAssignmentId.eq(assignmentId) }
        ConceptAssignmentAttachmentTable.deleteWhere { ConceptAssignmentAttachmentTable.assignmentId.eq(assignmentId) }
        ConceptAssignmentTable.deleteWhere { ConceptAssignmentTable.id.eq(assignmentId) }
    }

    fun update(assignment: AdminConceptAssignmentWithAttachments, details: ConceptDetails) = transaction {
        ConceptAssignmentTable
            .update({
                ConceptAssignmentTable.id.eq(assignment.assignment.id.toString())
            }) {
                it[buildingType] = details.buildingType
                it[allowedFloors] = details.allowedFloors
                it[allowedBuildingHeightMeters] = details.allowedBuildingHeightMeters
                it[energyText] = details.energyText
                it[previewImage] = assignment.assignment.previewImage
                it[updatedAt] = Clock.System.now()
            }
    }

    fun updateQuestions(assignment: AdminConceptAssignmentWithAttachments, payload: CandidatureQuestions) =
        transaction {
            ConceptAssignmentTable
                .update({
                    ConceptAssignmentTable.id.eq(assignment.assignment.id.toString())
                }) {
                    it[questions] = payload
                    it[updatedAt] = Clock.System.now()
                }
        }

    fun abort(toAbort: AdminConceptAssignmentWithAttachments) = transaction {
        ConceptAssignmentTable
            .update({ ConceptAssignmentTable.id.eq(toAbort.assignment.id.toString()) }) {
                it[ConceptAssignmentTable.state] = ConceptAssignmentState.ABORTED
            }

        CandidatureTable
            .update({
                CandidatureTable.conceptAssignmentId.eq(toAbort.assignment.id.toString())
                    .and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
            }) {
                it[CandidatureTable.state] = CandidatureState.REJECTED
            }
    }

    fun abortAndCreateDraft(toAbort: AdminConceptAssignmentWithAttachments, draft: AdminConceptAssignment) =
        transaction {
            createNoTransaction(draft)
            val parcels = ParcelToConceptAssignmentTable
                .innerJoin(ParcelsTable)
                .select {
                    ParcelToConceptAssignmentTable.conceptAssignmentId.eq(toAbort.assignment.id.toString())
                }
                .map {
                    Parcel(
                        constructionAreaId = it[ParcelToConceptAssignmentTable.constructionAreaId],
                        constructionSiteId = it[ParcelToConceptAssignmentTable.constructionSiteId],
                        parcelId = it[ParcelToConceptAssignmentTable.parcelId],
                        shape = it[ParcelsTable.shape],
                        fid = it[ParcelsTable.fid],
                        area = it[ParcelsTable.area],
                        parcelType = it[ParcelsTable.parcelType]
                    )
                }

            parcels.forEach {
                assignParcel(draft.id.toString(), it)
            }

            ConceptAssignmentTable
                .update({ ConceptAssignmentTable.id.eq(toAbort.assignment.id.toString()) }) {
                    it[ConceptAssignmentTable.state] = ConceptAssignmentState.ABORTED
                    // throw away file questions since we are moving the attachments
                    it[ConceptAssignmentTable.questions] = toAbort.assignment.questions
                        ?.let { questions ->
                            CandidatureQuestions(questions.questions.filterNot { q -> q is FileUploadQuestion })
                        }
                }
            ConceptAssignmentAttachmentTable
                .update({ ConceptAssignmentAttachmentTable.assignmentId.eq(toAbort.assignment.id.toString()) }) {
                    it[ConceptAssignmentAttachmentTable.assignmentId] = draft.id.toString()
                }
            CandidatureTable
                .update({
                    CandidatureTable.conceptAssignmentId.eq(toAbort.assignment.id.toString())
                        .and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
                }) {
                    it[CandidatureTable.state] = CandidatureState.REJECTED
                }
        }
}
