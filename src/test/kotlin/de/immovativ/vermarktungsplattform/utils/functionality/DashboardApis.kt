package de.immovativ.vermarktungsplattform.utils.functionality

import de.immovativ.vermarktungsplattform.model.dashboard.AdminDashboard
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.ktor.client.call.body
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode

class DashboardApis(private val tb: TestBase) {

    suspend fun getAdminDashboard(
        expectError: HttpStatusCode? = null
    ): AdminDashboard? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/dashboard")
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }
}
