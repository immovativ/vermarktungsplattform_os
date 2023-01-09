package de.immovativ.vermarktungsplattform.utils

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import com.typesafe.config.ConfigFactory
import de.immovativ.vermarktungsplattform.features.DatasourceAttributeKey
import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureView
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminCommentRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRatingRequest
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import de.immovativ.vermarktungsplattform.repository.TestCleanable
import de.immovativ.vermarktungsplattform.repository.UserRepository
import de.immovativ.vermarktungsplattform.repository.repositoryModule
import de.immovativ.vermarktungsplattform.service.serviceModule
import de.immovativ.vermarktungsplattform.utils.functionality.AuthApis
import de.immovativ.vermarktungsplattform.utils.functionality.CandidatureApis
import de.immovativ.vermarktungsplattform.utils.functionality.ConceptManagementApis
import de.immovativ.vermarktungsplattform.utils.functionality.ConstructionSiteApis
import de.immovativ.vermarktungsplattform.utils.functionality.DashboardApis
import de.immovativ.vermarktungsplattform.utils.functionality.MessagingApis
import de.immovativ.vermarktungsplattform.utils.functionality.PersonalDataManagementApis
import io.github.serpro69.kfaker.Faker
import io.github.serpro69.kfaker.fakerConfig
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.common.runBlocking
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.cookies.HttpCookies
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.accept
import io.ktor.client.request.header
import io.ktor.client.request.request
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStarted
import io.ktor.server.config.HoconApplicationConfig
import io.ktor.server.engine.applicationEngineEnvironment
import io.ktor.server.testing.TestApplicationEngine
import io.ktor.server.testing.testApplication
import mu.KLogging
import org.kodein.di.DI
import org.kodein.di.allInstances
import org.kodein.di.instance
import org.kodein.di.ktor.closestDI

object FakeData {
    private val fakerConfig = fakerConfig {
    }
    val faker = Faker(fakerConfig)
}

class TestBase(val client: HttpClient, val cookieClient: HttpClient, val userRepository: UserRepository, val constructionSitesRepository: ConstructionSitesRepository, val parcelsRepository: ParcelsRepository) {
    val faker = Faker(fakerConfig {})
    val messagingApis = MessagingApis(this)
    val authApis = AuthApis(this)
    val conceptManagementApis = ConceptManagementApis(this)
    val constructionSiteApis = ConstructionSiteApis(this)
    val candidatureApis = CandidatureApis(this)
    val dashboardApis = DashboardApis(this)
    val personalDataManagementApis = PersonalDataManagementApis(this)
    val constructionSiteFixtures: ConstructionSiteFixtures = ConstructionSiteFixtures(
        constructionSitesRepository,
        parcelsRepository
    )

    suspend fun AdminCandidatureView.grant(
        expectError: HttpStatusCode? = null
    ): AdminCandidatureView? {
        val response = makeRequest(
            HttpMethod.Put,
            "/api/admin/candidatures/${this.details.candidatureWithAttachments.candidature.id.value}/grant"
        )
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun AdminCandidatureView.rate(
        payload: AdminRatingRequest,
        expectError: HttpStatusCode? = null
    ): AdminCandidatureView? {
        val response = makeRequest(
            HttpMethod.Post,
            "/api/admin/candidatures/${this.details.candidatureWithAttachments.candidature.id.value}/rating"
        ) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(payload)
        }
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun AdminCandidatureView.comment(
        payload: AdminCommentRequest,
        expectError: HttpStatusCode? = null
    ): AdminCandidatureView? {
        val response = makeRequest(
            HttpMethod.Post,
            "/api/admin/candidatures/${this.details.candidatureWithAttachments.candidature.id.value}/comment"
        ) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(payload)
        }
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun AdminCandidatureView.reject(
        expectError: HttpStatusCode? = null
    ): AdminCandidatureView? {
        val response = makeRequest(
            HttpMethod.Put,
            "/api/admin/candidatures/${this.details.candidatureWithAttachments.candidature.id.value}/reject"
        )
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun makeRequestNoCookies(
        httpMethod: HttpMethod,
        uri: String,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        customize: (HttpRequestBuilder.() -> Unit)? = null
    ): HttpResponse {
        val response = client.request(uri) {
            method = httpMethod
            if (auth != null) {
                header(HttpHeaders.Cookie, auth.authHeader)
            }

            if (customize != null) {
                customize()
            }
        }
        return response
    }

    suspend fun makeRequest(
        httpMethod: HttpMethod,
        uri: String,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        customize: (HttpRequestBuilder.() -> Unit)? = null
    ): HttpResponse {
        val response = cookieClient.request(uri) {
            method = httpMethod
            if (auth != null) {
                header(HttpHeaders.Cookie, auth.authHeader)
            }

            if (customize != null) {
                customize()
            }
        }
        return response
    }
}

object AppSpecSupport : KLogging() {
    data class LoggedInTestUser(
        val authHeader: String,
        val email: String,
        val password: String,
        val loginResponse: HttpResponse
    )

    const val projectGroupEmail = "projekt@dietenbach.de"
    const val projectGroupPassword = "projekt"

    const val consultingEmail = "consulting@baurechtsamt.de"
    const val consultingPassword = "consulting"

    const val candidateEmail = "bewerber@dietenbach.de"
    const val candidatePassword = "bewerber"
    val mailhogClient = MailhogClient()

    val jwtVerifier: JWTVerifier = JWT
        .require(Algorithm.HMAC256("devsecret"))
        .withAudience("http://0.0.0.0:8080/")
        .withIssuer("http://0.0.0.0:8080/")
        .build()

    private fun cleanupData(di: DI) {
        val application by di.instance<Application>()

        application.attributes[DatasourceAttributeKey].connection.also {
            val stmt = it.createStatement()
            stmt.execute("delete from shedlock")
            it.commit()
            stmt.close()
            it.close()
        }

        val testCleanables by di.allInstances<TestCleanable>()

        testCleanables
            .sortedByDescending { it.priority }
            .forEach { it.deleteAllOnlyForTesting() }

        mailhogClient.deleteAllMessages()

        logger.info { "Successfully cleaned up everything!" }
    }

    /**
     * Setup with own application engine. The setup injects the DI of the application to the test code.
     */
    fun <R> withBetterTestApplicationAndSetup(
        configFileName: String = "application.conf",
        callTest: suspend (TestApplicationEngine) -> R
    ) {
        val environment = applicationEngineEnvironment {
            config = HoconApplicationConfig(ConfigFactory.load(configFileName))
        }

        val engine = TestApplicationEngine(environment)

        try {
            engine.start()
            cleanupData(engine.application.closestDI())

            runBlocking {
                callTest(engine)
            }
        } finally {
            engine.stop()
        }
    }

    /**
     * Setup with provided test application. The setup injects a stripped down version of a DI to the test code.
     */
    fun <R> withTestApplicationAndSetup(
        configFileName: String = "application.conf",
        callTest: suspend TestBase.(DI) -> R
    ) {
        System.setProperty("unit.test", "true")
        testApplication {
            val appconfig = HoconApplicationConfig(ConfigFactory.load(configFileName))
            environment {
                config = appconfig
            }

            val noCookieClient = createClient {
                install(ContentNegotiation) {
                    json()
                }
            }
            val cookieClient = createClient {
                install(HttpCookies)
                install(ContentNegotiation) {
                    json()
                }
            }

            application {
                // cleanup data every time the test application started
                environment.monitor.subscribe(ApplicationStarted) {
                    cleanupData(it.closestDI())
                }
            }

            val di = DI {
                import(repositoryModule)
                import(serviceModule)
            }

            val userRepo by di.instance<UserRepository>()
            val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
            val parcelsRepository by di.instance<ParcelsRepository>()

            TestBase(noCookieClient, cookieClient, userRepo, constructionSitesRepository, parcelsRepository).apply {
                makeRequest(HttpMethod.Get, "/")
                callTest(di)
            }
        }
    }
}
