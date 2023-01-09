package de.immovativ.vermarktungsplattform.repository

import arrow.core.Either
import com.password4j.Hash
import de.immovativ.vermarktungsplattform.model.login.FoundUser
import de.immovativ.vermarktungsplattform.model.user.MaybePasswordReset
import de.immovativ.vermarktungsplattform.model.user.PasswordReset
import de.immovativ.vermarktungsplattform.model.user.ProfileInfo
import de.immovativ.vermarktungsplattform.model.user.UpdatePersonalDataRequest
import de.immovativ.vermarktungsplattform.model.user.User
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import kotlinx.datetime.Clock
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Join
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object UserTable : Table("users") {
    val id: Column<String> = varchar("id", 36)
    val name: Column<String> = varchar("name", 255)
    val email: Column<String> = varchar("email", 255)
    val passwordHash: Column<String?> = varchar("password_hash", 255).nullable()
    val salt: Column<String?> = varchar("salt", 255).nullable()
    val role: Column<UserRole> =
        customEnumeration("role", null, { value -> UserRole.valueOf(value as String) }, { it.name })
    val status: Column<UserStatus> =
        customEnumeration("status", null, { value -> UserStatus.valueOf(value as String) }, { it.name })
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
    val lastLogin = timestamp("last_login").nullable()
}

class UserRepository : TestCleanable {
    fun create(user: User) =
        transaction {
            UserTable.insert {
                it[id] = user.id.value
                it[name] = user.name
                it[email] = user.email
                it[role] = user.role
                it[status] = user.status
                it[createdAt] = user.createdAt
                it[updatedAt] = user.updatedAt
                it[passwordHash] = user.passwordHash
                it[salt] = user.salt
                it[lastLogin] = null
            }
        }

    override fun deleteAllOnlyForTesting(): Unit = transaction {
        UserTable.deleteWhere {
            UserTable.email.notInList(listOf("projekt@dietenbach.de", "consulting@baurechtsamt.de", "bewerber@dietenbach.de"))
        }
    }

    fun emailById(userId: String): String? =
        UserTable.slice(UserTable.email).select(UserTable.id.eq(userId)).map { it[UserTable.email] }.firstOrNull()

    fun deleteById(userId: String): Int = UserTable.deleteWhere { UserTable.id.eq(userId) }

    fun findNewestTokenById(userId: String): MaybePasswordReset? {
        return Join(
            UserTable,
            PasswordResetTable,
            onColumn = UserTable.email,
            otherColumn = PasswordResetTable.email,
            joinType = JoinType.LEFT,
            additionalConstraint = { UserTable.id.eq(userId).and(UserTable.status.eq(UserStatus.INACTIVE)) }
        )
            .slice(
                UserTable.email,
                UserTable.name,
                PasswordResetTable.token,
                PasswordResetTable.createdAt,
                UserTable.role
            )
            .select(UserTable.id.eq(userId).and(UserTable.status.eq(UserStatus.INACTIVE)))
            .orderBy(PasswordResetTable.createdAt, SortOrder.DESC_NULLS_LAST)
            .limit(1)
            .map {
                MaybePasswordReset(
                    email = it[UserTable.email],
                    token = it[PasswordResetTable.token],
                    createdAt = it[PasswordResetTable.createdAt],
                    role = it[UserTable.role],
                    name = it[UserTable.name]
                )
            }
            .firstOrNull()
    }

    fun setStatus(userId: String, s: UserStatus): Boolean = transaction {
        val updated = UserTable
            .update({ UserTable.id.eq(userId) }) {
                it[updatedAt] = Clock.System.now()
                it[status] = s
            }
        updated > 0
    }

    fun findStatusByEmailWithReset(email: String): Pair<UserStatus, PasswordReset?>? = transaction {
        val userStatus = UserTable
            .slice(UserTable.status)
            .select {
                UserTable.email eq email.lowercase()
            }
            .limit(1)
            .map { it[UserTable.status] }
            .firstOrNull()
        val existingReset = PasswordResetTable
            .slice(PasswordResetTable.token, PasswordResetTable.email, PasswordResetTable.createdAt)
            .select(PasswordResetTable.email.eq(email))
            .map {
                PasswordReset(
                    token = it[PasswordResetTable.token],
                    email = it[PasswordResetTable.email],
                    createdAt = it[PasswordResetTable.createdAt]
                )
            }
            .firstOrNull()

        userStatus?.let { it to existingReset }
    }

    fun findById(id: String): FoundUser? = transaction {
        UserTable
            .slice(UserTable.id, UserTable.passwordHash, UserTable.role, UserTable.status, UserTable.email)
            .select {
                (UserTable.id eq id)
            }
            .limit(1)
            .firstOrNull()
            ?.let {
                FoundUser(
                    id = it[UserTable.id],
                    email = it[UserTable.email],
                    passwordHash = it[UserTable.passwordHash] ?: "",
                    role = it[UserTable.role],
                    status = it[UserTable.status]
                )
            }
    }

    fun findByEmail(email: String): FoundUser? = transaction {
        UserTable
            .slice(UserTable.id, UserTable.passwordHash, UserTable.role, UserTable.status)
            .select {
                (UserTable.email eq email.lowercase()) and (UserTable.passwordHash.isNotNull())
            }
            .limit(1)
            .firstOrNull()
            ?.let {
                it[UserTable.passwordHash]?.let { passwordHash ->
                    FoundUser(
                        id = it[UserTable.id],
                        email = email,
                        passwordHash = passwordHash,
                        role = it[UserTable.role],
                        status = it[UserTable.status]
                    )
                }
            }
    }

    fun updatePassword(userId: String, hash: Hash) =
        UserTable.update({ UserTable.id.eq(userId).and(UserTable.status.eq(UserStatus.ACTIVE)) }) {
            it[passwordHash] = hash.result
            it[salt] = hash.salt
            it[updatedAt] = Clock.System.now()
        }

    fun updatePersonalData(email: String, payload: UpdatePersonalDataRequest) =
        UserTable.update({ UserTable.email.eq(email).and(UserTable.status.eq(UserStatus.ACTIVE)) }) {
            it[name] = payload.name
            it[updatedAt] = Clock.System.now()
        }

    fun profileInfo(email: String): ProfileInfo? = transaction {
        UserTable
            .slice(UserTable.id, UserTable.email, UserTable.name, UserTable.lastLogin, UserTable.updatedAt)
            .select {
                UserTable.email.eq(email)
            }
            .limit(1)
            .firstOrNull()
            ?.let {
                ProfileInfo(
                    id = it[UserTable.id],
                    email = it[UserTable.email],
                    name = it[UserTable.name],
                    lastLogin = it[UserTable.lastLogin],
                    lastModified = it[UserTable.updatedAt]
                )
            }
    }

    fun setPasswordAndActivate(email: String, hash: Hash) =
        Either.catch {
            transaction {
                UserTable
                    .update({
                        UserTable.email.eq(email)
                            // prevent blocked user from switching to active. active is ok for pw reset.
                            // this where will burn the token but not set the password, and keep the user locked.
                            .and(UserTable.status.inList(listOf(UserStatus.ACTIVE, UserStatus.INACTIVE)))
                    }) {
                        it[passwordHash] = hash.result
                        it[salt] = hash.salt
                        it[status] = UserStatus.ACTIVE
                        it[updatedAt] = Clock.System.now()
                    }
            }
        }

    fun updateLastLogin(userId: String) = transaction {
        UserTable.update({ UserTable.id.eq(userId) }) {
            it[lastLogin] = Clock.System.now()
        }
    }
}
