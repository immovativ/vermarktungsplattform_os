package de.immovativ.vermarktungsplattform.utils

import com.typesafe.config.ConfigFactory
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.config.HoconApplicationConfig
import jakarta.mail.internet.MimeUtility
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.net.URI

@Serializable
data class Headers(
    @SerialName("Subject")
    val subject: List<String>,

    @SerialName("From")
    val from: List<String>,

    @SerialName("To")
    val to: List<String>
)

@Serializable
data class Content(
    @SerialName("Body")
    val body: String,
    @SerialName("Headers")
    val headers: Headers
)

@Serializable
data class Message(
    @SerialName("Content")
    val content: Content
) {
    fun extractToken(): String {
        // Brute-force algorithm
        // - Iterate through all lines
        // - Split each line by " " to get individual words
        // - Try to parse each word to URL
        // - First found URL has to be the invite token URL
        // - Take everything behind last '/' -> token
        val text = String(MimeUtility.decode(content.body.byteInputStream(), "quoted-printable").readAllBytes())
        val urls = text.lines().flatMap { line ->
            line.split(" ").mapNotNull { word ->
                try {
                    URI(word).toURL()
                } catch (e: Exception) {
                    null
                }
            }
        }

        return urls.first().path.takeLastWhile { it != '/' }
    }
}

class MailhogClient {
    private val json = Json { ignoreUnknownKeys = true }
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json()
        }
    }

    private val config = HoconApplicationConfig(ConfigFactory.load("application.conf"))

    private val baseUrl = "http://${config.property("email.smtp.host").getString()}:8025"

    fun deleteAllMessages() = runBlocking {
        client.delete("$baseUrl/api/v1/messages") {}
    }

    fun getMessage(to: String): Message =
        runBlocking {
            val body = client.get("$baseUrl/api/v1/messages") {
                header(HttpHeaders.Accept, "text/json")
            }

            val messages = json.decodeFromString<List<Message>>(body.bodyAsText())

            messages.first {
                it.content.headers.to.first() == to
            }
        }

    fun getMessages(subject: String, from: String, to: String): List<Message> = runBlocking {
        val body = client.get("$baseUrl/api/v1/messages") {
            header(HttpHeaders.Accept, "text/json")
        }

        val messages = json.decodeFromString<List<Message>>(body.bodyAsText())

        return@runBlocking messages.filter { message: Message ->
            val headers = message.content.headers
            val decodedSubject = MimeUtility.decodeText(headers.subject.first())
            decodedSubject == subject &&
                headers.from.first() == from &&
                headers.to.first() == to
        }
    }

    fun countMessages(subject: String, from: String, to: String): Int =
        getMessages(subject = subject, from = from, to = to).size

    fun containsMessage(subject: String, from: String, to: String): Boolean = getMessages(
        subject = subject,
        from = from,
        to = to
    ).isNotEmpty()
}
