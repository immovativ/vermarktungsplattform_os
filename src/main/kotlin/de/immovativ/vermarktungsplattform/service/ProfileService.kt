package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import de.immovativ.vermarktungsplattform.model.admin.profile.CandidateListResult
import de.immovativ.vermarktungsplattform.model.admin.profile.CandidateProfile
import de.immovativ.vermarktungsplattform.model.admin.profile.ProfileCandidature
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.user.UserData
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import de.immovativ.vermarktungsplattform.repository.CandidatureTable
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable
import de.immovativ.vermarktungsplattform.repository.SubQueryExpression
import de.immovativ.vermarktungsplattform.repository.UserDataRepository
import de.immovativ.vermarktungsplattform.repository.UserDataTable
import de.immovativ.vermarktungsplattform.repository.UserTable
import mu.KLogging
import org.jetbrains.exposed.sql.Join
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.alias
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.count
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.kodein.di.DI
import org.kodein.di.instance

class ProfileService(di: DI) {
    companion object : KLogging()

    private val userDataRepository by di.instance<UserDataRepository>()

    fun retrieveProfile(candidateId: String): Either<Throwable, CandidateProfile?> = Either.catch {
        transaction {
            userDataRepository.findByIdNoTransaction(UserId(candidateId))
                ?.let { (email, data) ->

                    val candidatures = Join(
                        CandidatureTable,
                        onColumn = CandidatureTable.conceptAssignmentId,
                        otherTable = ConceptAssignmentTable,
                        otherColumn = ConceptAssignmentTable.id,
                        joinType = JoinType.INNER
                    )
                        .slice(
                            CandidatureTable.id,
                            ConceptAssignmentTable.name,
                            ConceptAssignmentTable.id,
                            CandidatureTable.state,
                            CandidatureTable.updatedAt,
                            ConceptAssignmentTable.buildingType
                        )
                        .select {
                            CandidatureTable.state.neq(CandidatureState.DRAFT)
                                .and(CandidatureTable.userId.eq(candidateId))
                        }
                        .map {
                            ProfileCandidature(
                                id = CandidatureId(it[CandidatureTable.id]),
                                conceptName = it[ConceptAssignmentTable.name],
                                state = it[CandidatureTable.state],
                                updatedAt = it[CandidatureTable.updatedAt],
                                conceptId = it[ConceptAssignmentTable.id],
                                buildingType = it[ConceptAssignmentTable.buildingType]
                            )
                        }

                    CandidateProfile(
                        email = email,
                        userData = data,
                        candidatures = candidatures
                    )
                }
        }
    }

    fun retrieveList(): Either<Throwable, List<CandidateListResult>> = Either.catch {
        val candidatureCount = CandidatureTable.slice(CandidatureTable.id.count())
            .select {
                CandidatureTable.userId.eq(UserTable.id)
                    .and(CandidatureTable.state.neq(CandidatureState.DRAFT))
            }
        val candidatureCountSub = SubQueryExpression<Long>(candidatureCount.alias("cc"))
        transaction {
            UserTable
                .join(
                    UserDataTable,
                    onColumn = UserTable.id,
                    otherColumn = UserDataTable.userId,
                    joinType = JoinType.INNER
                )
                .slice(
                    UserDataTable.company,
                    UserDataTable.firstName,
                    UserDataTable.lastName,
                    UserDataTable.street,
                    UserDataTable.houseNumber,
                    UserDataTable.zipCode,
                    UserDataTable.city,
                    UserTable.id,
                    UserTable.email,
                    UserTable.status,
                    candidatureCountSub
                )
                .select {
                    UserTable.role.eq(UserRole.CANDIDATE)
                }
                .map { entry ->
                    CandidateListResult(
                        userId = UserId(value = entry[UserTable.id]),
                        email = entry[UserTable.email],
                        company = entry[UserDataTable.company],
                        firstName = entry[UserDataTable.firstName],
                        lastName = entry[UserDataTable.lastName],
                        street = entry[UserDataTable.street],
                        houseNumber = entry[UserDataTable.houseNumber],
                        zipCode = entry[UserDataTable.zipCode],
                        city = entry[UserDataTable.city],
                        candidatures = entry[candidatureCountSub],
                        userStatus = entry[UserTable.status]
                    )
                }
        }
    }

    fun retrieveDelegates(): Either<Throwable, List<UserData>> = Either.catch {
        transaction {
            userDataRepository.findByState(UserStatus.DELEGATED)
        }
    }
}
