package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.config.AuthConfig
import de.immovativ.vermarktungsplattform.config.AuthConfig.Companion.destroyAuth
import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.model.login.CookieSession
import de.immovativ.vermarktungsplattform.model.login.ExtendSessionResult
import de.immovativ.vermarktungsplattform.model.login.LoginRequest
import de.immovativ.vermarktungsplattform.model.login.LoginResult
import de.immovativ.vermarktungsplattform.model.user.PasswordResetRequest
import de.immovativ.vermarktungsplattform.service.UserService
import de.immovativ.vermarktungsplattform.utils.ratelimit.RateLimitedContext
import de.immovativ.vermarktungsplattform.utils.ratelimit.RateLimiter
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.sessions.sessions
import mu.KotlinLogging
import org.kodein.di.instance
import java.time.Duration

class LoginController(application: Application) : EnhancedController(application) {
    companion object {
        val logger = KotlinLogging.logger { }
    }

    private val userService by di.instance<UserService>()
    private val authConfig by di.instance<AuthConfig>()

    private val rateLimiter by di.instance<RateLimiter>()
    private val config = application.environment.config

    private val rateLimitedContextLogin = RateLimitedContext(
        uniqueName = "login",
        maxRequests = config
            .property("login.rateLimit.maxRequests")
            .getString()
            .toLong(),
        window = config
            .property("login.rateLimit.window")
            .getString()
            .let { Duration.parse(it) },
        limiter = rateLimiter
    )
    private val rateLimitedContextPwReset = RateLimitedContext(
        uniqueName = "pwReset",
        maxRequests = config
            .property("passwordReset.rateLimit.maxRequests")
            .getString()
            .toLong(),
        window = config
            .property("passwordReset.rateLimit.window")
            .getString()
            .let { Duration.parse(it) },
        limiter = rateLimiter
    )

    override fun Route.getRoutes() {
        post("/api/password-forgotten") {
            val payload = call.receive<PasswordResetRequest>()
            rateLimitedContextPwReset.apply(call) { _ ->
                userService
                    .requestPasswordReset(payload)
                    .toResponse(call)
            }
        }

        post("/api/logout") {
            call.destroyAuth()
            call.respond(HttpStatusCode.OK)
        }
        post("/api/login") {
            val loginRequest = call.receive<LoginRequest>()
            rateLimitedContextLogin.apply(call) { limitKey ->
                userService.attemptLogin(loginRequest).fold(
                    {
                        logger.warn("Technical error prevented user ${loginRequest.email} from logging in", it)
                        call.respond(HttpStatusCode.InternalServerError, "Technical error during login, please retry")
                    },
                    {
                        when (it) {
                            is LoginResult.NotFound, is LoginResult.WrongPw, is LoginResult.BlockedOrInactive -> {
                                logger.warn("Failed login (reason: $it)")
                                call.respond(
                                    HttpStatusCode.Forbidden,
                                    "Wrong password or no such user"
                                )
                            }
                            is LoginResult.Proceed -> {
                                limitKey?.also {
                                    // successful login, reset rate limit
                                    rateLimiter.reset(limitKey)
                                }
                                val (token, uiCookie) = authConfig.issueToken(it.id, it.email, it.role)
                                call.sessions.set("vmp_auth", CookieSession(bearer = token))
                                call.response.cookies.append(uiCookie)
                                call.respond(HttpStatusCode.OK)
                            }
                        }
                    }
                )
            }
        }

        authenticate("vmp_auth") {
            get("/api/authorization/refresh") {
                when (val principal = call.principal<JWTPrincipal>()?.get("email")) {
                    null -> {
                        logger.warn("Auth refresh failed (client auth is already expired)")
                        call.destroyAuth()
                        call.respond(HttpStatusCode.Forbidden)
                    }
                    else -> {
                        userService.extendSession(principal).fold(
                            { call.respond(HttpStatusCode.InternalServerError) },
                            {
                                when (it) {
                                    ExtendSessionResult.BlockedOrInactive -> {
                                        logger.warn("Auth refresh failed for $principal (user is blocked or inactive)")
                                        call.destroyAuth()
                                        call.respond(HttpStatusCode.Forbidden)
                                    }
                                    ExtendSessionResult.Missing -> {
                                        logger.warn("Auth refresh failed for $principal (user no longer exists)")
                                        call.destroyAuth()
                                        call.respond(HttpStatusCode.Forbidden)
                                    }
                                    is ExtendSessionResult.Proceed -> {
                                        logger.debug("Performed auth refresh for ${it.email} (${it.role})")
                                        val (token, uiCookie) = authConfig.issueToken(
                                            id = it.id,
                                            email = it.email,
                                            role = it.role
                                        )
                                        call.sessions.set("vmp_auth", CookieSession(bearer = token))
                                        call.response.cookies.append(uiCookie)
                                        call.respond(HttpStatusCode.NoContent)
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
