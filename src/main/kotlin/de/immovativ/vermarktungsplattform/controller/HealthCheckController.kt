package de.immovativ.vermarktungsplattform.controller

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

class HealthCheckController(application: Application) : EnhancedController(application) {
    override fun Route.getRoutes() {
        get("/health") {
            call.respond(HttpStatusCode.NoContent)
        }
    }
}
