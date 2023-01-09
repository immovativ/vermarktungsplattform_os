package de.immovativ.vermarktungsplattform.utils.functionality

import de.immovativ.vermarktungsplattform.model.admin.profile.CandidateListResult
import de.immovativ.vermarktungsplattform.model.admin.profile.CandidateProfile
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentId
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureView
import de.immovativ.vermarktungsplattform.model.candidature.Candidature
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureAndConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureStateResponse
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.AvailableConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.PublicConcept
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.matchers.shouldBe
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
import java.util.zip.ZipInputStream

class CandidatureApis(private val tb: TestBase) {

    suspend fun createCandidature(
        conceptAssignmentId: ConceptAssignmentId,
        expectedStatus: HttpStatusCode? = null
    ): Candidature? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/candidate/candidatures/${conceptAssignmentId.value}")

        response.shouldHaveStatus(expectedStatus ?: HttpStatusCode.Created)

        return if (expectedStatus == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun createDelegateCandidature(
        conceptAssignmentId: ConceptAssignmentId,
        delegatedUserId: String,
        expectedStatus: HttpStatusCode? = null
    ): Candidature? {
        val response = tb.makeRequest(
            HttpMethod.Post,
            "/api/candidate/candidatures/${conceptAssignmentId.value}"
        ) {
            header("X-DELEGATED-ID", delegatedUserId)
        }

        response.shouldHaveStatus(expectedStatus ?: HttpStatusCode.Created)

        return if (expectedStatus == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun getCandidatureState(
        conceptAssignmentId: ConceptAssignmentId
    ): CandidatureStateResponse {
        val response = tb.makeRequest(HttpMethod.Get, "/api/candidate/candidatures/${conceptAssignmentId.value}/state")

        response shouldHaveStatus HttpStatusCode.OK

        return response.body()
    }

    suspend fun editCandidature(
        candidatureId: CandidatureId,
        request: EditCandidatureRequest,
        expectedStatus: HttpStatusCode? = null
    ) {
        val response = tb.makeRequest(
            HttpMethod.Put,
            "/api/candidate/candidatures/${candidatureId.value}"
        ) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(request)
        }

        response.shouldHaveStatus(expectedStatus ?: HttpStatusCode.OK)
    }

    suspend fun deleteCandidature(
        candidatureId: CandidatureId,
        expectedStatus: HttpStatusCode? = null
    ) {
        val response = tb.makeRequest(
            HttpMethod.Delete,
            "/api/candidate/candidatures/${candidatureId.value}"
        )

        response.shouldHaveStatus(expectedStatus ?: HttpStatusCode.OK)
    }

    suspend fun submitCandidature(
        candidatureId: CandidatureId,
        expectedStatus: HttpStatusCode? = null
    ) {
        val response = tb.makeRequest(HttpMethod.Put, "/api/candidate/candidatures/${candidatureId.value}/submit")
        response.shouldHaveStatus(expectedStatus ?: HttpStatusCode.OK)
    }

    suspend fun revokeCandidature(
        candidatureId: CandidatureId,
        expectedStatus: HttpStatusCode? = null
    ) {
        val response = tb.makeRequest(HttpMethod.Put, "/api/candidate/candidatures/${candidatureId.value}/revoke")
        response.shouldHaveStatus(expectedStatus ?: HttpStatusCode.OK)
    }

    suspend fun getCandidatureAsAdmin(
        id: String,
        expectError: HttpStatusCode? = null
    ): AdminCandidatureView? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/candidatures/$id")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun getCandidatureAsCandidate(
        candidatureId: CandidatureId
    ): CandidatureAndConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/candidate/candidatures/${candidatureId.value}")

        response shouldHaveStatus HttpStatusCode.OK

        return response.body()
    }

    suspend fun getCandidateProfileAsAdmin(
        id: String,
        expectError: HttpStatusCode? = null
    ): CandidateProfile? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/candidates/$id")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun getCandidatesAsAdmin(
        expectError: HttpStatusCode? = null
    ): List<CandidateListResult>? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/candidates/list")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun addAttachmentAsCandidate(
        candidatureId: CandidatureId,
        attachmentName: String,
        content: String
    ): AttachmentMetadata {
        val uploadResponse = tb.cookieClient.submitFormWithBinaryData(
            url = "/api/candidate/candidatures/${candidatureId.value}/attachments",
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
        )

        uploadResponse shouldHaveStatus HttpStatusCode.Created

        return uploadResponse.body()
    }

    suspend fun deleteAttachmentAsCandidate(
        candidatureId: CandidatureId,
        attachmentId: AttachmentId
    ) {
        val response = tb.makeRequest(
            HttpMethod.Delete,
            "/api/candidate/candidatures/${candidatureId.value}/attachments/${attachmentId.value}"
        )
        response shouldHaveStatus HttpStatusCode.OK
    }

    suspend fun downloadAttachment(
        candidatureId: CandidatureId,
        attachmentId: AttachmentId
    ): String {
        val response = tb.makeRequest(
            HttpMethod.Get,
            "/api/candidate/candidatures/${candidatureId.value}/attachments/${attachmentId.value}"
        )
        response shouldHaveStatus HttpStatusCode.OK
        return response.bodyAsText()
    }

    suspend fun downloadAttachmentZipAsCandidate(
        candidatureId: CandidatureId
    ): List<String> {
        val response = tb.makeRequest(
            HttpMethod.Get,
            "/api/candidate/candidatures/${candidatureId.value}/attachments/zip"
        )
        response shouldHaveStatus HttpStatusCode.OK

        response.headers[HttpHeaders.ContentType] shouldBe "application/octet-stream"
        response.headers[HttpHeaders.ContentDisposition] shouldBe "attachment; filename=attachments.zip"

        return ZipInputStream(response.body()).use { zip ->
            generateSequence { zip.nextEntry }.map { String(zip.readAllBytes()) }.toList()
        }
    }

    suspend fun downloadAttachmentZipAsProjectGroup(
        candidatureId: CandidatureId
    ): List<String> {
        val response = tb.makeRequest(
            HttpMethod.Get,
            "/api/admin/candidatures/${candidatureId.value}/attachments/zip"
        )
        response shouldHaveStatus HttpStatusCode.OK

        response.headers[HttpHeaders.ContentType] shouldBe "application/octet-stream"
        response.headers[HttpHeaders.ContentDisposition] shouldBe "attachment; filename=attachments.zip"

        return ZipInputStream(response.body()).use { zip ->
            generateSequence { zip.nextEntry }.map { String(zip.readAllBytes()) }.toList()
        }
    }

    suspend fun getAssignmentPublic(
        id: String,
        expectError: HttpStatusCode? = null
    ): AvailableConceptDetails? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/assignment/$id")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun listAssignments(): List<PublicConcept> {
        val response = tb.makeRequestNoCookies(HttpMethod.Get, "/api/assignments")
        return response.body()
    }

    suspend fun copyCandidature(
        from: CandidatureId,
        to: CandidatureId
    ) {
        tb.makeRequest(
            HttpMethod.Post,
            "/api/candidate/candidature/copy/${from.value}/${to.value}"
        ) shouldHaveStatus HttpStatusCode.OK
    }

    suspend fun downloadAttachmentPublic(
        assignmentId: String,
        attachmentId: String,
        expectError: HttpStatusCode? = null
    ): String? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/assignment/$assignmentId/attachment/$attachmentId")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.bodyAsText()
        } else {
            null
        }
    }

    suspend fun downloadAttachmentAsAdmin(
        assignmentId: String,
        attachmentId: String,
        expectError: HttpStatusCode? = null
    ): String? {
        val response =
            tb.makeRequest(HttpMethod.Get, "/api/admin/concept-assignment/$assignmentId/attachment/$attachmentId")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.bodyAsText()
        } else {
            null
        }
    }
}
