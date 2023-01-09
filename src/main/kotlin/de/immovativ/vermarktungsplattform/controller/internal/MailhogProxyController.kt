package de.immovativ.vermarktungsplattform.controller.internal

import de.immovativ.vermarktungsplattform.controller.EnhancedController
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.request.request
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.isSuccess
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import jakarta.mail.internet.MimeUtility
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mu.KLogging
import java.io.InputStream

class MailhogProxyController(application: Application) : EnhancedController(application) {
    private val client = HttpClient(CIO)

    companion object : KLogging()

    override fun Route.getRoutes() {
        get("/internal/mailhog/v1/messages") {
            val response = client.request("http://localhost:8025/api/v1/messages") {
                this.method = HttpMethod.Get
            }

            if (response.status.isSuccess()) {
                withContext(Dispatchers.IO) {
                    response.body<InputStream>().use {
                        MimeUtility.decode(it, "quoted-printable").use { decoded ->
                            // get rid of mailhog + softbreaks trickery:
                            // mailhog transforms linebreaks to \r\n and softbreaks are marked with "="
                            // which yields "=\r\n" which is not affected by MimeUtility
                            val blubb = decoded.readAllBytes().decodeToString().replace("=\\r\\n", "")

                            call.respondText(status = response.status, contentType = ContentType.Application.Json) {
                                blubb
                            }
                        }
                    }
                }
            } else {
                call.respond(response.status)
            }
        }
    }
}
