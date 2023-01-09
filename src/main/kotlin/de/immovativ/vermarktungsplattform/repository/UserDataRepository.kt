package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.user.UserData
import de.immovativ.vermarktungsplattform.model.user.UserDataUpdateRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import kotlinx.datetime.Clock
import org.jetbrains.exposed.sql.Join
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object UserDataTable : Table("user_data") {
    val userId = varchar("user_id", 36)
    val accountType = varchar("account_type", 255)
    val company = varchar("company", 255).nullable()
    val street = varchar("street", 255)
    val houseNumber = varchar("house_number", 255)
    val zipCode = varchar("zip_code", 5)
    val city = varchar("city", 255)
    val salutation = varchar("salutation", 255)
    val firstName = varchar("first_name", 255)
    val lastName = varchar("last_name", 255)
    val phoneNumber = varchar("phone_number", 255)
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}

class UserDataRepository : TestCleanable {
    override fun deleteAllOnlyForTesting(): Unit = transaction {
        UserDataTable.deleteWhere {
            UserDataTable.userId.notInList(
                listOf(
                    "00000000-0000-0000-0000-000000000000",
                    "00000000-0000-0000-0000-000000000001",
                    "00000000-0000-0000-0000-000000000002"
                )
            )
        }
    }

    fun create(userData: UserData) {
        transaction {
            UserDataTable.insert {
                it[UserDataTable.userId] = userData.userId.value
                it[accountType] = userData.accountType
                it[company] = userData.company
                it[street] = userData.street
                it[houseNumber] = userData.houseNumber
                it[zipCode] = userData.zipCode
                it[city] = userData.city
                it[salutation] = userData.salutation
                it[firstName] = userData.firstName
                it[lastName] = userData.lastName
                it[phoneNumber] = userData.phoneNumber
                it[createdAt] = userData.createdAt
                it[updatedAt] = userData.updatedAt
            }
        }
    }

    fun findByIdNoTransaction(userId: UserId): Pair<String, UserData>? =
        Join(
            UserDataTable,
            onColumn = UserDataTable.userId,
            otherTable = UserTable,
            otherColumn = UserTable.id,
            joinType = JoinType.INNER
        )
            .slice(UserDataTable.fields + UserTable.email + UserTable.status)
            .select { UserDataTable.userId.eq(userId.value) }
            .limit(1)
            .map {
                it[UserTable.email] to UserData(
                    userId = UserId(it[UserDataTable.userId]),
                    accountType = it[UserDataTable.accountType],
                    company = it[UserDataTable.company],
                    street = it[UserDataTable.street],
                    houseNumber = it[UserDataTable.houseNumber],
                    zipCode = it[UserDataTable.zipCode],
                    city = it[UserDataTable.city],
                    salutation = it[UserDataTable.salutation],
                    firstName = it[UserDataTable.firstName],
                    lastName = it[UserDataTable.lastName],
                    phoneNumber = it[UserDataTable.phoneNumber],
                    createdAt = it[UserDataTable.createdAt],
                    updatedAt = it[UserDataTable.updatedAt],
                    userStatus = it[UserTable.status]
                )
            }
            .firstOrNull()

    fun findById(userId: UserId): Pair<String, UserData>? = transaction {
        findByIdNoTransaction(userId)
    }

    fun findByState(state: UserStatus): List<UserData> = transaction {
        Join(
            UserDataTable,
            onColumn = UserDataTable.userId,
            otherTable = UserTable,
            otherColumn = UserTable.id,
            joinType = JoinType.INNER
        )
            .slice(UserDataTable.fields + UserTable.status)
            .select { UserTable.status.eq(state) }
            .map {
                UserData(
                    userId = UserId(it[UserDataTable.userId]),
                    accountType = it[UserDataTable.accountType],
                    company = it[UserDataTable.company],
                    street = it[UserDataTable.street],
                    houseNumber = it[UserDataTable.houseNumber],
                    zipCode = it[UserDataTable.zipCode],
                    city = it[UserDataTable.city],
                    salutation = it[UserDataTable.salutation],
                    firstName = it[UserDataTable.firstName],
                    lastName = it[UserDataTable.lastName],
                    phoneNumber = it[UserDataTable.phoneNumber],
                    createdAt = it[UserDataTable.createdAt],
                    updatedAt = it[UserDataTable.updatedAt],
                    userStatus = it[UserTable.status]
                )
            }
    }

    fun update(userId: UserId, payload: UserDataUpdateRequest) = transaction {
        UserDataTable.update({ UserDataTable.userId eq userId.value }) {
            it[accountType] = payload.accountType.name
            it[company] = payload.company
            it[street] = payload.street
            it[houseNumber] = payload.houseNumber
            it[zipCode] = payload.zipCode
            it[city] = payload.city
            it[salutation] = payload.salutation.name
            it[firstName] = payload.firstName
            it[lastName] = payload.lastName
            it[phoneNumber] = payload.phoneNumber
            it[updatedAt] = Clock.System.now()
        }
    }
}
