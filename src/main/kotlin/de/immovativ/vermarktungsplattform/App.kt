package de.immovativ.vermarktungsplattform

import de.immovativ.vermarktungsplattform.config.AuthConfig
import de.immovativ.vermarktungsplattform.config.AuthConfig.Companion.destroyAuth
import de.immovativ.vermarktungsplattform.controller.HealthCheckController
import de.immovativ.vermarktungsplattform.controller.api.CandidateController
import de.immovativ.vermarktungsplattform.controller.api.CandidaturesController
import de.immovativ.vermarktungsplattform.controller.api.ConceptAssignmentController
import de.immovativ.vermarktungsplattform.controller.api.ConstructionSiteController
import de.immovativ.vermarktungsplattform.controller.api.DashboardController
import de.immovativ.vermarktungsplattform.controller.api.LoginController
import de.immovativ.vermarktungsplattform.controller.api.MessagingController
import de.immovativ.vermarktungsplattform.controller.api.TextsController
import de.immovativ.vermarktungsplattform.controller.api.UserController
import de.immovativ.vermarktungsplattform.controller.internal.MailhogProxyController
import de.immovativ.vermarktungsplattform.features.DBPlugin
import de.immovativ.vermarktungsplattform.features.RoleBasedAuthorizationFeature
import de.immovativ.vermarktungsplattform.model.login.CookieSession
import de.immovativ.vermarktungsplattform.repository.repositoryModule
import de.immovativ.vermarktungsplattform.service.JobService
import de.immovativ.vermarktungsplattform.service.serviceModule
import de.immovativ.vermarktungsplattform.utils.ContractException
import de.immovativ.vermarktungsplattform.utils.logger
import de.immovativ.vermarktungsplattform.utils.ratelimit.InMemoryRateLimiter
import de.immovativ.vermarktungsplattform.utils.ratelimit.RateLimiter
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.UserIdPrincipal
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.basic
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.session
import io.ktor.server.http.content.file
import io.ktor.server.http.content.files
import io.ktor.server.http.content.resources
import io.ktor.server.http.content.static
import io.ktor.server.http.content.staticRootFolder
import io.ktor.server.plugins.callid.CallId
import io.ktor.server.plugins.callid.callIdMdc
import io.ktor.server.plugins.callloging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.forwardedheaders.XForwardedHeaders
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.routing.routing
import io.ktor.server.sessions.Sessions
import io.ktor.server.sessions.cookie
import io.ktor.server.sessions.get
import io.ktor.server.sessions.sessions
import io.ktor.server.webjars.Webjars
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.kodein.di.bind
import org.kodein.di.instance
import org.kodein.di.ktor.closestDI
import org.kodein.di.ktor.controller.controller
import org.kodein.di.ktor.di
import org.kodein.di.singleton
import org.slf4j.event.Level
import java.io.File
import java.time.Duration
import java.util.UUID

val KtorJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}

fun Application.main() {
    install(DBPlugin)

    val authConfig = AuthConfig(environment.config)

    val client: HttpClient = HttpClient(CIO) {
        install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
            json()
        }
    }

    di {
        bind<AuthConfig>() with singleton { authConfig }
        bind<RateLimiter>() with singleton {
            InMemoryRateLimiter(
                mapPurgeSize = 200,
                mapPurgeWaitDuration = Duration.ofMinutes(10L)
            )
        }
        import(repositoryModule)
        import(serviceModule)
        bind<HttpClient>() with singleton { client }
    }

    install(ContentNegotiation) {
        json(
            json = KtorJson, // Attention: Use Json "Default" builder here (done by Json{}), as we use it in our test setup. This makes json parsing more reliable
            contentType = ContentType.Application.Json
        )
    }

    install(XForwardedHeaders)

    install(Sessions) {
        cookie<CookieSession>("vmp_auth") {
            cookie.path = "/"
            cookie.maxAgeInSeconds = 1200
            cookie.extensions["SameSite"] = "strict"
            cookie.secure = this@main.environment.config.propertyOrNull("cookie.secure")?.getString().toBoolean()
            cookie.domain = this@main.environment.config.propertyOrNull("cookie.domain")?.getString()
        }
    }

    install(RoleBasedAuthorizationFeature)

    install(CallId) {
        header(HttpHeaders.XCorrelationId)

        generate { UUID.randomUUID().toString() }
    }

    install(StatusPages) {
        // catch contract exceptions e.g. from JSON parsing of UUID - backed value classes
        exception<ContractException> { call, exc ->
            call.respond(HttpStatusCode.BadRequest, exc.message ?: "")
        }
        exception<SerializationException> { call, exc ->
            call.respond(HttpStatusCode.BadRequest, exc.message ?: "")
        }
    }

    install(CallLogging) {
        callIdMdc("correlationId")

        level = Level.DEBUG
    }

    install(Authentication) {
        basic("basic") {
            realm = "Access to the '/' path"
            skipWhen { call -> System.getProperty("unit.test") == "true" || System.getProperty("io.ktor.development") == "true" || call.sessions.get<CookieSession>() != null }
            validate { credentials ->
                when {
                    credentials.name == "freiburg" && credentials.password == "bobsled.nacho.cathouse.cake" ->
                        UserIdPrincipal(credentials.name)
                    else -> null
                }
            }
        }
        session<CookieSession>("vmp_auth") {
            validate { cookie ->
                try {
                    val decoded = authConfig.verifier.verify(cookie.bearer)
                    JWTPrincipal(decoded)
                } catch (e: Exception) {
                    logger.warn(e) { "Failed to validate jwt" }
                    null
                }
            }
            challenge {
                // UI handles state when no ui cookie exists and routes back to login
                call.destroyAuth()
                call.respond(HttpStatusCode.Forbidden)
            }
        }
    }

    if (System.getProperty("io.ktor.development") == "true") {
        install(Webjars) {
            path = "assets"
        }
    }

    routing {
        authenticate("basic") {
            controller { UserController(instance()) }
            controller { ConceptAssignmentController(instance()) }
            controller { LoginController(instance()) }
            controller { HealthCheckController(instance()) }
            controller { TextsController(instance()) }
            controller { CandidaturesController(instance()) }
            controller { DashboardController(instance()) }
            controller { CandidateController(instance()) }
            controller { MessagingController(instance()) }
            controller { ConstructionSiteController(instance()) }

            // Add internal or test controllers here
            if (System.getProperty("io.ktor.development") == "true") {
                controller { MailhogProxyController(instance()) }
            }

            static("tilesets") {
                resources("tilesets")
            }

            static {
                staticRootFolder = File("dist")

                file("/protected/{...}", "protected/index.html")
                file("/impressum", "public/index.html")
                file("/datenschutz", "public/index.html")
                file("/{...}", "public/index.html")

                static("static") {
                    files("static")
                }
            }
        }
    }

    val js by closestDI().instance<JobService>()
    js.load()
}
