package de.immovativ.vermarktungsplattform.utils

import arrow.core.Either
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respond
import mu.KotlinLogging

val logger = KotlinLogging.logger {}

suspend inline fun <reified T> Either<Throwable, T>.toResponse(call: ApplicationCall, httpStatusCode: HttpStatusCode) =
    call.respond(httpStatusCode)

suspend inline fun <reified T : Any> Either<Throwable, T>.toResponse(
    call: ApplicationCall,
    noinline transform: ((T) -> Pair<HttpStatusCode, T>)? = null,
    noinline errTransform: ((Throwable) -> Pair<HttpStatusCode, String?>)? = null
) {
    this.fold(
        {
            logger.warn(it) { "Caught exception in request handling" }
            when (errTransform) {
                null -> {
                    call.respond(HttpStatusCode.InternalServerError, it.message ?: "No message")
                }
                else -> {
                    val result: Pair<HttpStatusCode, String?> = errTransform(it)
                    call.respond(result.first, result.second ?: "No message")
                }
            }
        },
        {
            when (transform) {
                null -> call.respond(HttpStatusCode.OK)
                else -> {
                    val result = transform(it)

                    call.respond(result.first, result.second)
                }
            }
        }
    )
}
