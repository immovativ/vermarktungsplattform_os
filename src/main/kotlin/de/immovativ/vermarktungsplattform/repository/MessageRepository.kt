package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.messaging.CandidatureMessage
import de.immovativ.vermarktungsplattform.model.messaging.CandidatureUnreadMessage
import de.immovativ.vermarktungsplattform.model.messaging.MessageDirection
import de.immovativ.vermarktungsplattform.model.messaging.MessageId
import de.immovativ.vermarktungsplattform.model.messaging.MessageRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import kotlinx.datetime.Clock
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object MessageTable : Table("candidature_messages") {
    val messageId = varchar("id", 36)
    val candidatureId = varchar("candidature_id", 36).references(CandidatureTable.id)
    val contents = text("contents")
    val direction: Column<MessageDirection> =
        customEnumeration("direction", null, { value -> MessageDirection.valueOf(value as String) }, { it.name })
    val seenAt = timestamp("seen_at").nullable()
    val created = timestamp("created")
    val attachment = jsonb("attachment", AttachmentMetadata::class).nullable()

    override val primaryKey = PrimaryKey(messageId)
}

class MessageRepository : TestCleanable {
    override fun deleteAllOnlyForTesting(): Unit = transaction {
        MessageTable.deleteAll()
    }

    private fun ResultRow.toMessage() = CandidatureMessage(
        messageId = MessageId(this[MessageTable.messageId]),
        candidatureId = CandidatureId(this[MessageTable.candidatureId]),
        contents = this[MessageTable.contents],
        direction = this[MessageTable.direction],
        seenAt = this[MessageTable.seenAt],
        created = this[MessageTable.created],
        attachment = this[MessageTable.attachment]
    )

    fun findUnread(
        candidateId: UserId?
    ): List<CandidatureUnreadMessage> = transaction {
        val direction = candidateId?.let { MessageDirection.ADMIN_TO_USER } ?: MessageDirection.USER_TO_ADMIN
        val userIdClause = candidateId?.let { CandidatureTable.userId.eq(it.value) } ?: Op.TRUE

        MessageTable
            .join(
                CandidatureTable,
                onColumn = MessageTable.candidatureId,
                otherColumn = CandidatureTable.id,
                joinType = JoinType.INNER
            )
            .join(
                ConceptAssignmentTable,
                onColumn = CandidatureTable.conceptAssignmentId,
                otherColumn = ConceptAssignmentTable.id,
                joinType = JoinType.INNER
            )
            .join(
                UserDataTable,
                onColumn = CandidatureTable.userId,
                otherColumn = UserDataTable.userId,
                joinType = JoinType.INNER
            )
            .slice(
                MessageTable.candidatureId,
                CandidatureTable.state,
                CandidatureTable.conceptAssignmentId,
                ConceptAssignmentTable.name,
                ConceptAssignmentTable.state,
                UserDataTable.firstName,
                UserDataTable.lastName
            )
            .select {
                userIdClause
                    .and(MessageTable.direction.eq(direction))
                    .and(MessageTable.seenAt.isNull())
            }
            .map {
                CandidatureUnreadMessage(
                    candidatureId = CandidatureId(it[MessageTable.candidatureId]),
                    candidatureState = it[CandidatureTable.state],
                    conceptState = it[ConceptAssignmentTable.state],
                    conceptId = ConceptAssignmentId(it[CandidatureTable.conceptAssignmentId]),
                    conceptName = it[ConceptAssignmentTable.name],
                    userFirstName = it[UserDataTable.firstName],
                    userLastName = it[UserDataTable.lastName]
                )
            }
    }

    private fun justFind(id: CandidatureId) = MessageTable
        .select { MessageTable.candidatureId.eq(id.value) }
        .orderBy(MessageTable.created, SortOrder.ASC)
        .map { it.toMessage() }

    fun findMessages(
        candidatureId: CandidatureId
    ): List<CandidatureMessage> = transaction {
        justFind(candidatureId)
    }

    fun createAttachment(
        candidatureId: CandidatureId,
        attachment: AttachmentMetadata,
        direction: MessageDirection
    ): List<CandidatureMessage> = transaction {
        MessageTable.insert {
            it[MessageTable.candidatureId] = candidatureId.value
            it[MessageTable.messageId] = MessageId().value
            it[MessageTable.contents] = ""
            it[MessageTable.direction] = direction
            it[MessageTable.seenAt] = null
            it[MessageTable.attachment] = attachment
            it[MessageTable.created] = Clock.System.now()
        }

        justFind(candidatureId)
    }

    fun createMessage(
        candidatureId: CandidatureId,
        message: MessageRequest,
        direction: MessageDirection
    ): List<CandidatureMessage> = transaction {
        MessageTable.insert {
            it[MessageTable.candidatureId] = candidatureId.value
            it[MessageTable.messageId] = MessageId().value
            it[MessageTable.contents] = message.contents
            it[MessageTable.direction] = direction
            it[MessageTable.seenAt] = null
            it[MessageTable.attachment] = null
            it[MessageTable.created] = Clock.System.now()
        }

        justFind(candidatureId)
    }

    fun markRead(id: CandidatureId, markDirectionRead: MessageDirection) = transaction {
        MessageTable
            .update({
                MessageTable.candidatureId.eq(id.value)
                    .and(MessageTable.direction.eq(markDirectionRead))
                    .and(MessageTable.seenAt.isNull())
            }) {
                it[MessageTable.seenAt] = Clock.System.now()
            }
    }

    fun findAttachment(
        messageId: MessageId,
        candidatureId: CandidatureId,
        userId: UserId?
    ): AttachmentMetadata? = transaction {
        val userIdClause = userId?.let { CandidatureTable.userId.eq(it.value) } ?: Op.TRUE
        MessageTable
            .join(
                CandidatureTable,
                onColumn = MessageTable.candidatureId,
                otherColumn = CandidatureTable.id,
                joinType = JoinType.INNER
            )
            .slice(MessageTable.attachment)
            .select {
                MessageTable.candidatureId.eq(candidatureId.value)
                    .and(MessageTable.messageId.eq(messageId.value))
                    .and(userIdClause)
            }
            .limit(1)
            .map { it[MessageTable.attachment] }
            .firstOrNull()
    }
}
