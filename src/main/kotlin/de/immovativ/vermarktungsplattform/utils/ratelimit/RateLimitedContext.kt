package de.immovativ.vermarktungsplattform.utils.ratelimit

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.header
import io.ktor.server.response.respond
import mu.KotlinLogging
import java.time.Duration

object Headers {
    const val X_REAL_IP = "X-REAL-IP"
}

@JvmInline
value class RateLimitKey(val value: String)

data class RateLimitedContext(
    val uniqueName: String,
    val maxRequests: Long,
    val window: Duration,
    val limiter: RateLimiter
) {
    private val logger = KotlinLogging.logger { }
    suspend fun apply(
        call: ApplicationCall,
        whenOk: suspend (RateLimitKey?) -> Unit
    ) {
        val maybeIp = call
            .request
            .header(Headers.X_REAL_IP) // the map is case insensitive
            ?.takeIf { it.isNotBlank() }
        val maybeKey = maybeIp
            ?.let { realIp ->
                RateLimitKey(uniqueName + realIp)
            }
        val maybeLimiter = maybeKey
            ?.let { key ->
                limiter.handle(key, maxRequests, window)
            }

        when {
            maybeLimiter == null -> whenOk(null)
            maybeLimiter.shouldLimit() -> {
                logger.warn { "IP $maybeIp hit rate limit for $uniqueName" }
                call.respond(HttpStatusCode.TooManyRequests)
            }
            else -> whenOk(maybeKey)
        }
    }
}
