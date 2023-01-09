package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.repository.TextsRepository
import de.immovativ.vermarktungsplattform.utils.TextSanitizer
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.put
import mu.KLogging
import org.kodein.di.instance

class TextsController(application: Application) : EnhancedController(application) {
    private val textsRepository by di.instance<TextsRepository>()

    companion object : KLogging()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.CONSULTING) {
                put("/api/texts/{name}") {
                    call.requirePathParameter("name") { name ->
                        val value = call.receive<String>()

                        textsRepository
                            .update(name, TextSanitizer.sanitize(value))
                            .toResponse(call)
                    }
                }
            }
        }

        get("/api/texts/{name}") {
            call.requirePathParameter("name") { name ->
                textsRepository
                    .get(name)
                    .fold(
                        {
                            logger.warn(it) { "Could not resolve texts with name '$name'. Responding with an empty string." }
                            call.respond(HttpStatusCode.OK, "")
                        },
                        {
                            call.respond(HttpStatusCode.OK, it ?: "")
                        }
                    )
            }
        }
    }
}
