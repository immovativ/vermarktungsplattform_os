package de.immovativ.vermarktungsplattform.controller.api

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import de.immovativ.vermarktungsplattform.features.withRoles
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.service.DashboardService
import de.immovativ.vermarktungsplattform.utils.toResponse
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import mu.KLogging
import org.kodein.di.instance

class DashboardController(application: Application) : EnhancedController(application) {
    companion object : KLogging()

    private val dashboardService by di.instance<DashboardService>()

    override fun Route.getRoutes() {
        authenticate("vmp_auth") {
            withRoles(UserRole.PROJECT_GROUP) {
                get("/api/admin/dashboard") {
                    dashboardService.getAdminDashboard().toResponse(call, { HttpStatusCode.OK to it })
                }
            }
        }
    }
}
