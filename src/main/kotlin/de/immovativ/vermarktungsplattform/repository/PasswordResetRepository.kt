package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.user.PasswordReset
import de.immovativ.vermarktungsplattform.repository.PasswordResetTable.createdAt
import de.immovativ.vermarktungsplattform.service.UserService.Companion.PASSWORD_RESET_EXPIRY
import kotlinx.datetime.Clock
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days

object PasswordResetTable : Table("password_reset") {
    val email: Column<String> = varchar("email", 255)
    val token: Column<String> = varchar("token", 255)
    val createdAt = timestamp("created_at")
}

class PasswordResetRepository : TestCleanable {
    fun create(email: String, token: String) =
        transaction {
            PasswordResetTable.insert {
                it[PasswordResetTable.email] = email
                it[PasswordResetTable.token] = token
            }
        }

    fun findByToken(token: String) =
        transaction {
            PasswordResetTable
                .select { PasswordResetTable.token eq token }
                .firstOrNull()
                ?.let {
                    PasswordReset(
                        email = it[PasswordResetTable.email],
                        token = it[PasswordResetTable.token],
                        createdAt = it[createdAt]
                    )
                }
        }

    fun deleteByToken(token: String) =
        transaction {
            PasswordResetTable
                .deleteWhere { PasswordResetTable.token eq token }
        }

    fun deleteByEmail(email: String) =
        transaction {
            PasswordResetTable
                .deleteWhere { PasswordResetTable.email eq email }
        }

    fun cleanup(passwordResetExpiry: Duration) =
        transaction {
            PasswordResetTable
                .deleteWhere {
                    createdAt less Clock.System.now() - passwordResetExpiry
                }
        }

    override fun deleteAllOnlyForTesting(): Unit = transaction { PasswordResetTable.deleteAll() }
    fun expireTokenForTesting(token: String, tokenAge: Duration = PASSWORD_RESET_EXPIRY + 1.days) =
        transaction {
            PasswordResetTable
                .update({ PasswordResetTable.token eq token }) {
                    it[createdAt] = Clock.System.now() - tokenAge
                }
        }
}
