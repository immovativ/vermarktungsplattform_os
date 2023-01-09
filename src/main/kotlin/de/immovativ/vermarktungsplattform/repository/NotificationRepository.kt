package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.email.EmailTemplate
import de.immovativ.vermarktungsplattform.model.notification.Notification
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

object NotificationTable : Table("notifications") {
    val id = varchar("id", 36)
    val recipient = varchar("recipient", 255)
    val subject = varchar("subject", 255)
    val htmlText = text("html_text")
    val plainText = text("plain_text")
}

class NotificationRepository : TestCleanable {
    override fun deleteAllOnlyForTesting(): Unit = transaction {
        NotificationTable.deleteAll()
    }

    private fun ResultRow.toNotification() = Notification(
        id = this[NotificationTable.id],
        recipient = this[NotificationTable.recipient],
        subject = this[NotificationTable.subject],
        htmlText = this[NotificationTable.htmlText],
        plainText = this[NotificationTable.plainText]
    )

    fun create(email: String, template: EmailTemplate) = transaction {
        NotificationTable.insert {
            it[id] = UUID.randomUUID().toString()
            it[recipient] = email
            it[subject] = template.subject
            it[htmlText] = template.htmlText
            it[plainText] = template.plainText
        }
    }

    fun getNotifications(amount: Int): List<Notification> = transaction {
        NotificationTable
            .selectAll()
            .limit(amount)
            .map { it.toNotification() }
    }

    fun deleteById(notificationId: String) = transaction {
        NotificationTable
            .deleteWhere {
                (NotificationTable.id eq notificationId)
            }
    }
}
