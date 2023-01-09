package de.immovativ.vermarktungsplattform.utils.functionality

import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.messaging.CandidatureMessage
import de.immovativ.vermarktungsplattform.model.messaging.CandidatureUnreadMessage
import de.immovativ.vermarktungsplattform.model.messaging.MessageId
import de.immovativ.vermarktungsplattform.model.messaging.MessageRequest
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.ktor.client.call.body
import io.ktor.client.request.accept
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.request.header
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType

class MessagingApis(private val tb: TestBase) {

    suspend fun getMessagesAsAdmin(
        candidatureId: CandidatureId,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ): List<CandidatureMessage>? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/messaging/candidature/${candidatureId.value}", auth)
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun getMessagesUnreadAsCandidate(
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ): List<CandidatureUnreadMessage>? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/candidate/messaging/unread", auth)
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun getMessagesUnreadAsAdmin(
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ): List<CandidatureUnreadMessage>? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/messaging/unread", auth)
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun markReadAsCandidate(
        candidatureId: CandidatureId,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ) {
        tb.makeRequest(HttpMethod.Get, "/api/candidate/messaging/candidature/${candidatureId.value}/markRead", auth)
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
    }

    suspend fun getMessagesAsCandidate(
        candidatureId: CandidatureId,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ): List<CandidatureMessage>? {
        val response =
            tb.makeRequest(HttpMethod.Get, "/api/candidate/messaging/candidature/${candidatureId.value}", auth)
                .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun markReadAsAdmin(
        candidatureId: CandidatureId,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ) {
        tb.makeRequest(HttpMethod.Get, "/api/admin/messaging/candidature/${candidatureId.value}/markRead", auth)
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
    }

    suspend fun downloadMessageAttachmentAsAdmin(
        candidatureId: CandidatureId,
        messageId: MessageId,
        auth: AppSpecSupport.LoggedInTestUser? = null
    ): String {
        val response = tb.makeRequest(
            HttpMethod.Get,
            "/api/admin/messaging/candidature/${candidatureId.value}/message/${messageId.value}/attachment",
            auth
        )
        response shouldHaveStatus HttpStatusCode.OK
        return response.bodyAsText()
    }

    suspend fun downloadMessageAttachmentAsCandidate(
        candidatureId: CandidatureId,
        messageId: MessageId,
        auth: AppSpecSupport.LoggedInTestUser? = null
    ): String {
        val response = tb.makeRequest(
            HttpMethod.Get,
            "/api/candidate/messaging/candidature/${candidatureId.value}/message/${messageId.value}/attachment",
            auth
        )
        response shouldHaveStatus HttpStatusCode.OK
        return response.bodyAsText()
    }

    suspend fun addMessageAttachmentAsAdmin(
        candidatureId: CandidatureId,
        attachmentName: String,
        content: String,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ) {
        val uploadResponse = tb.cookieClient.submitFormWithBinaryData(
            url = "/api/admin/messaging/candidature/${candidatureId.value}/attachment",
            formData = formData {
                append(
                    attachmentName,
                    content.toByteArray(),
                    Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=$attachmentName")
                        append(HttpHeaders.ContentType, "text/plain")
                    }
                )
            }
        ) {
            if (auth != null) {
                header(HttpHeaders.Cookie, auth.authHeader)
            }
        }

        uploadResponse shouldHaveStatus (expectError ?: HttpStatusCode.OK)
    }

    suspend fun addMessageAttachmentAsCandidate(
        candidatureId: CandidatureId,
        attachmentName: String,
        content: String,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ) {
        val uploadResponse = tb.cookieClient.submitFormWithBinaryData(
            url = "/api/candidate/messaging/candidature/${candidatureId.value}/attachment",
            formData = formData {
                append(
                    attachmentName,
                    content.toByteArray(),
                    Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=$attachmentName")
                        append(HttpHeaders.ContentType, "text/plain")
                    }
                )
            }
        ) {
            if (auth != null) {
                header(HttpHeaders.Cookie, auth.authHeader)
            }
        }

        uploadResponse shouldHaveStatus (expectError ?: HttpStatusCode.OK)
    }

    suspend fun writeMessageAsCandidate(
        candidatureId: CandidatureId,
        payload: MessageRequest,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ) {
        tb.makeRequest(HttpMethod.Post, "/api/candidate/messaging/candidature/${candidatureId.value}", auth) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(payload)
        }.also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
    }

    suspend fun writeMessageAsAdmin(
        candidatureId: CandidatureId,
        payload: MessageRequest,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectError: HttpStatusCode? = null
    ) {
        tb.makeRequest(HttpMethod.Post, "/api/admin/messaging/candidature/${candidatureId.value}", auth) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(payload)
        }.also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
    }
}
