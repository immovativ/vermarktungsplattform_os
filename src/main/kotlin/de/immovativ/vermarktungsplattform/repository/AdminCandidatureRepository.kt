package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminComment
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRating
import kotlinx.datetime.Clock
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object CommentTable : Table("admin_candidature_comments") {
    val candidatureId = varchar("candidature_id", 36).references(CandidatureTable.id)
    val text = text("text").nullable()
    val commentUpdatedAt = timestamp("text_updated_at").nullable()

    override val primaryKey = PrimaryKey(candidatureId) // name is optional here
}

class AdminCandidatureRepository : TestCleanable {
    override fun deleteAllOnlyForTesting(): Unit = transaction {
    }

    private fun ResultRow.toComment() = AdminComment(
        text = this[CommentTable.text],
        updated = this[CommentTable.commentUpdatedAt]
    )

    fun setRating(
        candidatureId: CandidatureId,
        rating: AdminRating?
    ) = transaction {
        CandidatureTable.update({ CandidatureTable.id.eq(candidatureId.value) }) {
            it[adminRating] = rating?.value
        }
    }

    fun createOrUpdateComment(
        candidatureId: CandidatureId,
        sanitizedCommentText: String?
    ) = transaction {
        CommentTable.upsert {
            it[CommentTable.candidatureId] = candidatureId.value
            it[text] = sanitizedCommentText
            it[commentUpdatedAt] = Clock.System.now()
        }
    }

    fun find(candidatureId: CandidatureId): AdminComment? = transaction {
        CommentTable
            .select {
                CommentTable.candidatureId.eq(candidatureId.value)
            }
            .limit(1)
            .map { it.toComment() }
            .firstOrNull()
    }
}
