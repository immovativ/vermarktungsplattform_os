package de.immovativ.vermarktungsplattform.utils.functionality

import com.password4j.Password
import com.password4j.SaltGenerator
import de.immovativ.vermarktungsplattform.model.login.FoundUser
import de.immovativ.vermarktungsplattform.model.login.LoginRequest
import de.immovativ.vermarktungsplattform.model.user.PasswordResetRequest
import de.immovativ.vermarktungsplattform.model.user.Salutation
import de.immovativ.vermarktungsplattform.model.user.User
import de.immovativ.vermarktungsplattform.model.user.UserAccountType
import de.immovativ.vermarktungsplattform.model.user.UserActivationRequest
import de.immovativ.vermarktungsplattform.model.user.UserCreationRequest
import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport
import de.immovativ.vermarktungsplattform.utils.FakeData
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.matchers.nulls.shouldNotBeNull
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.accept
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.setCookie
import kotlinx.datetime.Clock
import kotlinx.serialization.encodeToString
import java.util.Base64
import java.util.UUID

class AuthApis(private val tb: TestBase) {

    fun getUser(id: String): FoundUser? = tb.userRepository.findById(id)

    suspend fun createUserAndLogin(
        role: UserRole,
        email: String = "test@test.de",
        password: String = "test"
    ): AppSpecSupport.LoggedInTestUser {
        val salt = Base64.getEncoder().encodeToString(SaltGenerator.generate())
        val hash = Password.hash(password).addSalt(salt).addPepper().withScrypt()
        tb.userRepository.create(
            User(
                id = UserId(),
                name = "test user $email",
                email = email,
                passwordHash = hash.result,
                salt = salt,
                role = role,
                status = UserStatus.ACTIVE,
                createdAt = Clock.System.now(),
                updatedAt = Clock.System.now()
            )
        )
        return logInAs(email, password)
    }

    suspend fun loginAsProjectGroup(): AppSpecSupport.LoggedInTestUser {
        return logInAs(AppSpecSupport.projectGroupEmail, AppSpecSupport.projectGroupPassword)
    }

    suspend fun loginAsConsulting(): AppSpecSupport.LoggedInTestUser {
        return logInAs(AppSpecSupport.consultingEmail, AppSpecSupport.consultingPassword)
    }

    suspend fun loginAsCandidate(): AppSpecSupport.LoggedInTestUser {
        return logInAs(AppSpecSupport.candidateEmail, AppSpecSupport.candidatePassword)
    }

    suspend fun attemptLogin(
        email: String,
        password: String,
        expectStatusCode: HttpStatusCode = HttpStatusCode.OK
    ): HttpResponse {
        return tb.makeRequest(HttpMethod.Post, "/api/login") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(
                LoginRequest(
                    email,
                    password
                )
            )
        }.also { it.shouldHaveStatus(expectStatusCode) }
    }

    suspend fun requestPwReset(
        email: String,
        expectStatus: HttpStatusCode = HttpStatusCode.OK,
        customize: (HttpRequestBuilder.() -> Unit)? = null
    ) {
        tb.makeRequest(HttpMethod.Post, "/api/password-forgotten") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            customize?.invoke(this)
            setBody(
                PasswordResetRequest(
                    email = email
                )
            )
        }.also { it.shouldHaveStatus((expectStatus)) }
    }

    suspend fun requestPwResetForDelegate(
        id: String,
        expectStatus: HttpStatusCode = HttpStatusCode.NoContent,
        customize: (HttpRequestBuilder.() -> Unit)? = null
    ) {
        tb.makeRequest(HttpMethod.Post, "/api/admin/user/$id/activate-delegate") {
            header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
            customize?.invoke(this)
        }.also { it.shouldHaveStatus((expectStatus)) }
    }

    suspend fun logInAs(
        email: String,
        password: String
    ): AppSpecSupport.LoggedInTestUser {
        val response = attemptLogin(email = email, password = password, expectStatusCode = HttpStatusCode.OK)
        val c = response.setCookie().find { it.name == "vmp_auth" }
        c.shouldNotBeNull()
        return AppSpecSupport.LoggedInTestUser("vmp_auth=${c.value}", email, password, response)
    }

    suspend fun createUserAndLogin(conceptAssignmentId: UUID? = null, email: String? = null): AppSpecSupport.LoggedInTestUser {
        val actualEmail = email ?: FakeData.faker.internet.email()
        val userCreationRequest = UserCreationRequest(
            accountType = UserAccountType.COMPANY,
            company = FakeData.faker.company.name(),
            salutation = Salutation.values().random(),
            street = FakeData.faker.address.streetName(),
            houseNumber = FakeData.faker.address.buildingNumber(),
            zipCode = FakeData.faker.address.postcode().take(5),
            city = FakeData.faker.address.city(),
            firstName = FakeData.faker.name.firstName(),
            lastName = FakeData.faker.name.lastName(),
            phoneNumber = FakeData.faker.phoneNumber.phoneNumber(),
            email = actualEmail,
            tosAndPrivacyPolicyConsent = true
        )

        val response = tb.makeRequest(HttpMethod.Post, "/api/user") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            parameter("conceptAssignmentId", conceptAssignmentId)
            setBody(userCreationRequest)
        }

        response.shouldHaveStatus(HttpStatusCode.Created)

        val password = "s3cr3t"

        activateUser(actualEmail, password)

        return logInAs(actualEmail, password)
    }

    suspend fun activateUser(
        email: String,
        password: String,
        expectedHttpStatusCode: HttpStatusCode = HttpStatusCode.OK
    ) {
        val token = AppSpecSupport.mailhogClient.getMessage(email).extractToken()

        val activationResponse = tb.makeRequest(HttpMethod.Post, "/api/user/activate") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(
                UserActivationRequest(
                    password = password,
                    token = token
                )
            )
        }

        activationResponse shouldHaveStatus expectedHttpStatusCode
    }
}
