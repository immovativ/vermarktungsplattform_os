package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import arrow.core.flatMap
import com.password4j.Hash
import com.password4j.Password
import com.password4j.SaltGenerator
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.login.ExtendSessionResult
import de.immovativ.vermarktungsplattform.model.login.FoundUser
import de.immovativ.vermarktungsplattform.model.login.LoginRequest
import de.immovativ.vermarktungsplattform.model.login.LoginResult
import de.immovativ.vermarktungsplattform.model.user.ActivationResult
import de.immovativ.vermarktungsplattform.model.user.PasswordChangeRequest
import de.immovativ.vermarktungsplattform.model.user.PasswordResetRequest
import de.immovativ.vermarktungsplattform.model.user.ProfileInfo
import de.immovativ.vermarktungsplattform.model.user.UpdatePersonalDataRequest
import de.immovativ.vermarktungsplattform.model.user.User
import de.immovativ.vermarktungsplattform.model.user.UserActivationRequest
import de.immovativ.vermarktungsplattform.model.user.UserCreationRequest
import de.immovativ.vermarktungsplattform.model.user.UserData
import de.immovativ.vermarktungsplattform.model.user.UserDataUpdateRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import de.immovativ.vermarktungsplattform.repository.PasswordResetRepository
import de.immovativ.vermarktungsplattform.repository.UserDataRepository
import de.immovativ.vermarktungsplattform.repository.UserRepository
import de.immovativ.vermarktungsplattform.utils.TokenGenerator
import kotlinx.datetime.Clock
import mu.KotlinLogging
import org.jetbrains.exposed.sql.transactions.transaction
import org.kodein.di.DI
import org.kodein.di.instance
import java.util.Base64
import java.util.UUID
import kotlin.time.Duration.Companion.days

class UserService(di: DI) {
    companion object {
        val PASSWORD_RESET_EXPIRY = 5.days

        private val logger = KotlinLogging.logger { }

        private val VALID_RESET_STATES = setOf(UserStatus.INACTIVE, UserStatus.ACTIVE)
    }

    private val userRepository by di.instance<UserRepository>()
    private val passwordResetRepository by di.instance<PasswordResetRepository>()
    private val emailService by di.instance<EmailService>()
    private val emailTemplateService by di.instance<EmailTemplateService>()
    private val userDataRepository by di.instance<UserDataRepository>()

    suspend fun create(
        request: UserCreationRequest,
        conceptAssignmentId: ConceptAssignmentId?,
        initialStatus: UserStatus = UserStatus.INACTIVE
    ): Either<Throwable, UserData> = Either.catch {
        val userId = UserId(UUID.randomUUID().toString())
        val name = "${request.firstName} ${request.lastName}"
        val token = TokenGenerator.generate(64)

        val user = User(
            id = userId,
            name = name,
            email = request.email,
            role = UserRole.CANDIDATE,
            status = initialStatus,
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now(),
            passwordHash = null,
            salt = null
        )
        val userData = UserData(
            userId = userId,
            accountType = request.accountType.name,
            company = request.company,
            street = request.street,
            houseNumber = request.houseNumber,
            zipCode = request.zipCode,
            city = request.city,
            salutation = request.salutation.name,
            firstName = request.firstName,
            lastName = request.lastName,
            phoneNumber = request.phoneNumber,
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now()
        )
        transaction {
            userRepository.create(user)
            userDataRepository.create(userData)
            passwordResetRepository.create(
                email = request.email,
                token = token
            )
        }

        if (initialStatus == UserStatus.INACTIVE) {
            emailService.sendEmail(
                request.email,
                emailTemplateService.candidateInvitation(token, name, conceptAssignmentId)
            )
        }

        userData
    }

    fun attemptLogin(request: LoginRequest): Either<Throwable, LoginResult> =
        Either.catch {
            userRepository.findByEmail(request.email)
        }.flatMap { maybeFound ->
            maybeFound
                ?.let { found: FoundUser ->
                    Either.catch {
                        when (found.status) {
                            UserStatus.ACTIVE -> {
                                val pwMatch =
                                    Password.check(request.password, found.passwordHash).addPepper().withScrypt()
                                if (pwMatch) {
                                    userRepository.updateLastLogin(found.id)
                                    LoginResult.Proceed(found.id, found.email, found.role)
                                } else {
                                    LoginResult.WrongPw(request.email)
                                }
                            }
                            else -> LoginResult.BlockedOrInactive
                        }
                    }
                }
                ?: Either.Right(LoginResult.NotFound(request.email))
        }

    fun extendSession(email: String): Either<Throwable, ExtendSessionResult> {
        return Either.catch {
            userRepository.findByEmail(email)
        }.map { maybeFound ->
            maybeFound
                ?.let { found: FoundUser ->
                    when (found.status) {
                        UserStatus.ACTIVE -> ExtendSessionResult.Proceed(
                            found.id,
                            found.email,
                            found.role
                        )
                        else -> ExtendSessionResult.BlockedOrInactive
                    }
                } ?: ExtendSessionResult.Missing
        }
    }

    suspend fun activateDelegate(userId: String): Either<Throwable, Unit> = Either.catch {
        val maybeUser = userRepository.findById(userId)

        if (maybeUser == null) {
            logger.warn { "No user found for $userId" }
            return@catch
        }

        if (maybeUser.status != UserStatus.DELEGATED) return@catch

        userRepository.setStatus(userId, UserStatus.INACTIVE)
        requestPasswordReset(PasswordResetRequest(email = maybeUser.email))
    }

    suspend fun requestPasswordReset(request: PasswordResetRequest): Either<Throwable, Unit> = Either.catch {
        val maybeUserToResetWithPreviousToken = userRepository
            .findStatusByEmailWithReset(request.email)
            ?.takeIf { VALID_RESET_STATES.contains(it.first) }

        if (maybeUserToResetWithPreviousToken == null) {
            logger.warn { "Prevented password reset for ${request.email}. Account does not exist, is blocked or is created as delegate." }
        } else {
            val previousReset = maybeUserToResetWithPreviousToken.second

            val token = when {
                // only generate new token if there is none or if the existing one has expired
                previousReset == null || previousReset.createdAt.plus(PASSWORD_RESET_EXPIRY) <= Clock.System.now() -> {
                    val token = TokenGenerator.generate(64)

                    transaction {
                        // if we had an expired token, we need to delete it first to satisfy the unique constraint
                        if (previousReset != null) {
                            passwordResetRepository.deleteByEmail(request.email)
                        }
                        passwordResetRepository.create(
                            email = request.email,
                            token = token
                        )
                    }
                    token
                }
                else -> previousReset.token
            }

            emailService.sendEmail(
                emailAddress = request.email,
                template = emailTemplateService.passwordReset(token, request.email)
            )

            logger.info { "Issued password reset for ${request.email}" }
        }
    }

    fun activate(request: UserActivationRequest): Either<Throwable, ActivationResult> =
        Either.catch {
            passwordResetRepository.findByToken(request.token)?.let { passwordReset ->
                val expiry = passwordReset.createdAt + PASSWORD_RESET_EXPIRY

                return@catch when {
                    expiry <= Clock.System.now() -> {
                        // token expired - delete it so we can request a new one
                        passwordResetRepository.deleteByToken(request.token)
                        ActivationResult.Expired
                    }
                    else -> {
                        val salt = Base64.getEncoder().encodeToString(SaltGenerator.generate())
                        val hash = Password.hash(request.password).addSalt(salt).addPepper().withScrypt()

                        transaction {
                            userRepository.setPasswordAndActivate(passwordReset.email, hash)
                            passwordResetRepository.deleteByEmail(passwordReset.email)
                        }

                        ActivationResult.Successful(passwordReset.email)
                    }
                }
            } ?: ActivationResult.WrongToken
        }.tap {
            // cleanup old password resets
            // -> adds a bit more time for the request, but saves a cleanup job
            logger.info { "Cleanup expired password reset tokens!" }

            passwordResetRepository.cleanup(PASSWORD_RESET_EXPIRY)
        }

    fun attemptPasswordUpdate(request: PasswordChangeRequest, subjectEmail: String): Either<Throwable, Boolean> =
        transaction {
            userRepository
                .findByEmail(subjectEmail)
                ?.let { found ->
                    Either.catch {
                        val pwMatch =
                            Password.check(request.currentPassword, found.passwordHash).addPepper().withScrypt()
                        if (pwMatch) {
                            userRepository.updatePassword(found.id, generateHash(request.newPassword)) > 0
                        } else {
                            false
                        }
                    }
                } ?: Either.Right(false)
        }

    fun updatePersonalData(email: String, payload: UpdatePersonalDataRequest): Either<Throwable, Unit> = Either.catch {
        transaction {
            userRepository.updatePersonalData(email, payload)
        }
    }

    fun profileInfo(email: String): Either<Throwable, ProfileInfo?> = Either.catch {
        userRepository
            .profileInfo(email)
    }

    private fun generateHash(password: String): Hash {
        val salt = Base64.getEncoder().encodeToString(SaltGenerator.generate())
        return Password.hash(password).addSalt(salt).addPepper().withScrypt()
    }

    fun updateUserData(userId: UserId, payload: UserDataUpdateRequest): Either<Throwable, Unit> = Either.catch {
        userDataRepository.update(userId, payload)
    }

    fun userData(userId: UserId): Either<Throwable, UserData?> = Either.catch {
        userDataRepository.findById(userId)?.second
    }
}
