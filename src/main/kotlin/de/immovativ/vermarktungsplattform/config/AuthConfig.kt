package de.immovativ.vermarktungsplattform.config

import com.auth0.jwt.JWT
import com.auth0.jwt.JWTVerifier
import com.auth0.jwt.algorithms.Algorithm
import de.immovativ.vermarktungsplattform.model.user.UserRole
import io.ktor.http.Cookie
import io.ktor.server.application.ApplicationCall
import io.ktor.server.config.ApplicationConfig
import io.ktor.server.sessions.sessions
import io.ktor.util.date.GMTDate
import io.ktor.util.date.toJvmDate
import kotlin.time.Duration

class AuthConfig(config: ApplicationConfig) {
    private val secret = config.property("jwt.secret").getString()
    private val issuer = config.property("jwt.issuer").getString()
    private val audience = config.property("jwt.audience").getString()
    private val jwtValid = config.property("jwt.valid.duration").getString()

    companion object {
        fun ApplicationCall.destroyAuth() {
            sessions.clear("vmp_auth")
            response.cookies.append(
                Cookie(
                    expires = GMTDate.START,
                    name = "vmp_ui",
                    value = "nope",
                    path = "/",
                    extensions = mapOf(
                        "SameSite" to "strict"
                    )
                )
            )
        }
    }

    val verifier: JWTVerifier = JWT
        .require(Algorithm.HMAC256(secret))
        .withAudience(audience)
        .withIssuer(issuer)
        .build()

    fun issueToken(id: String, email: String, role: UserRole): Pair<String, Cookie> {
        val gmtDate = GMTDate(System.currentTimeMillis() + Duration.parse(jwtValid).inWholeMilliseconds)
        return JWT.create()
            .withAudience(audience)
            .withIssuer(issuer)
            .withClaim("id", id)
            .withClaim("email", email)
            .withClaim("role", role.name)
            .withExpiresAt(gmtDate.toJvmDate())
            .sign(Algorithm.HMAC256(secret)) to Cookie(
            expires = gmtDate,
            name = "vmp_ui",
            // Warning, do not add spaces here to prettify. It would get encoded in the cookie and break json parsing.
            value = """{"role":"$role","email":"$email"}""",
            path = "/",
            extensions = mapOf(
                "SameSite" to "strict"
            )
        )
    }
}
