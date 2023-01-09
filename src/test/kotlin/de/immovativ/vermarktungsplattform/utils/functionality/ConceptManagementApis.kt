package de.immovativ.vermarktungsplattform.utils.functionality

import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithDetails
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignment
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentListResult
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.conceptassignment.StartConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.UpdateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.user.Salutation
import de.immovativ.vermarktungsplattform.model.user.UserAccountType
import de.immovativ.vermarktungsplattform.model.user.UserCreationRequest
import de.immovativ.vermarktungsplattform.model.user.UserData
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport
import de.immovativ.vermarktungsplattform.utils.FakeData
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.matchers.shouldBe
import io.ktor.client.call.body
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.accept
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.json.Json
import java.util.zip.ZipInputStream
import kotlin.time.Duration.Companion.hours

class ConceptManagementApis(private val tb: TestBase) {

    suspend fun createConceptWithCandidature(
        modConcept: (suspend (AdminConceptAssignment) -> Unit)? = null,
        modCandidature: (suspend (CandidatureWithDetails) -> Unit)? = null,
        auth: AppSpecSupport.LoggedInTestUser? = null
    ): CandidatureWithDetails {
        tb.authApis.loginAsProjectGroup()
        val constructionSite = tb.constructionSiteFixtures.persistConstructionSite("1", "14")
        tb.constructionSiteFixtures.persistParcel(constructionSite, "66")

        val conceptAssignment = createConceptAssignment(
            CreateConceptAssignmentRequest(
                name = "foo",
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "66",
                        constructionSiteId = "14",
                        constructionAreaId = "1"
                    )
                ),
                BuildingType.GGW
            )
        )!!
        modConcept?.invoke(conceptAssignment)

        startConceptAssignment(
            conceptAssignment.id.toString(),
            start = Clock.System.now().minus(2.hours),
            end = Clock.System.now().minus(1.hours)
        )

        if (auth != null) {
            tb.authApis.logInAs(auth.email, auth.password)
        } else {
            tb.authApis.createUserAndLogin()
        }

        tb.candidatureApis.createCandidature(
            ConceptAssignmentId(conceptAssignment.id.toString())
        )

        val candidaturesResponse = tb.makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
        candidaturesResponse shouldHaveStatus HttpStatusCode.OK

        val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()
        val candidature = candidatureWithDetails.first()

        tb.candidatureApis.editCandidature(
            candidature.id,
            EditCandidatureRequest(
                description = "foo",
                answers = emptyMap()
            )
        )
        modCandidature?.invoke(candidature)

        tb.candidatureApis.submitCandidature(
            candidatureId = candidatureWithDetails.first().id
        )

        return candidature
    }

    suspend fun createConceptAssignment(
        p: CreateConceptAssignmentRequest,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignment? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(p)
        }
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun deleteAttachmentAsAdmin(
        assignmentId: String,
        attachmentId: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response =
            tb.makeRequest(HttpMethod.Delete, "/api/admin/concept-assignment/$assignmentId/attachment/$attachmentId")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun downloadAttachmentZip(
        conceptAssignmentId: ConceptAssignmentId
    ): List<String> {
        val response = tb.makeRequest(
            HttpMethod.Get,
            "/api/admin/concept-assignment/${conceptAssignmentId.value}/attachment/zip"
        )
        response shouldHaveStatus HttpStatusCode.OK

        response.headers[HttpHeaders.ContentType] shouldBe "application/octet-stream"
        response.headers[HttpHeaders.ContentDisposition] shouldBe "attachment; filename=attachments.zip"

        return ZipInputStream(response.body()).use { zip ->
            generateSequence { zip.nextEntry }.map { String(zip.readAllBytes()) }.toList()
        }
    }

    suspend fun addPreviewImage(
        assignmentId: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val resource = listOf(
            "/images/preview.png",
            "/images/preview1.png",
            "/images/preview2.png",
            "/images/preview3.png",
            "/images/preview4.png",
            "/images/preview5.png",
            "/images/preview6.png"
        ).random()

        val image = withContext(Dispatchers.IO) {
            this.javaClass.getResourceAsStream(resource).readAllBytes()
        }

        val uploadResponse = tb.cookieClient.submitFormWithBinaryData(
            url = "/api/admin/concept-assignment/$assignmentId/preview",
            formData = formData {
                append(
                    "preview",
                    image,
                    Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=blob")
                        append(HttpHeaders.ContentType, "image/png")
                    }
                )
            }
        )

        uploadResponse.shouldHaveStatus(expectError ?: HttpStatusCode.OK)

        return if (expectError == null) {
            uploadResponse.body()
        } else {
            null
        }
    }

    suspend fun attachData(
        assignmentId: String,
        attachmentName: String,
        content: String? = null,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val actualContent = content ?: FakeData.faker.lorem.supplemental()

        val uploadResponse = tb.cookieClient.submitFormWithBinaryData(
            url = "/api/admin/concept-assignment/$assignmentId/attachment",
            formData = formData {
                append(
                    attachmentName,
                    actualContent.toByteArray(),
                    Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=$attachmentName")
                        append(HttpHeaders.ContentType, "text/plain")
                    }
                )
            }
        )
        uploadResponse.shouldHaveStatus(expectError ?: HttpStatusCode.OK)

        return if (expectError == null) {
            uploadResponse.body()
        } else {
            null
        }
    }

    suspend fun getAssignmentAsAdmin(
        id: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/concept-assignment/$id")
        response.shouldHaveStatus(expectError ?: HttpStatusCode.OK)
        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun finishConceptAssignmentManually(
        id: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/finishManually")
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun abortConceptAssignment(
        id: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/abort")
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun abortAndDraftConceptAssignment(
        id: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/abortAndDraft")
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun unstartConceptAssignment(
        id: String,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/unstart")
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun startConceptAssignment(
        id: String,
        start: Instant,
        end: Instant,
        expectError: HttpStatusCode? = null,
        customize: (HttpRequestBuilder.() -> Unit)? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/start") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            customize?.invoke(this)
            setBody(
                StartConceptAssignmentRequest(
                    start,
                    end
                )
            )
        }.also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun updateConceptAssignmentQuestions(
        id: String,
        payload: CandidatureQuestions,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/questions") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(
                payload
            )
        }.also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun updateConceptAssignment(
        id: String,
        payload: UpdateConceptAssignmentRequest,
        expectError: HttpStatusCode? = null
    ): AdminConceptAssignmentWithAttachments? {
        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/concept-assignment/$id/details") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(payload)
        }.also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }

        return if (expectError == null) {
            response.body()
        } else {
            null
        }
    }

    suspend fun listConceptsAsAdmin(stateFilter: String? = null): List<ConceptAssignmentListResult> {
        val filter = stateFilter?.let { "?state=$it" } ?: ""
        val response = tb.makeRequest(HttpMethod.Get, "/api/admin/concept-assignments$filter")
        response.shouldHaveStatus(HttpStatusCode.OK)
        return response.body()
    }

    suspend fun deleteConceptDraft(
        id: String,
        expectError: HttpStatusCode? = null
    ) {
        tb.makeRequest(HttpMethod.Delete, "/api/admin/concept-assignment/$id")
            .also { it.shouldHaveStatus((expectError ?: HttpStatusCode.OK)) }
    }

    suspend fun createDelegateUser(
        email: String = FakeData.faker.internet.email()
    ): UserData {
        val userCreationRequest = UserCreationRequest(
            accountType = UserAccountType.COMPANY,
            company = FakeData.faker.company.name(),
            salutation = Salutation.values().random(),
            street = FakeData.faker.address.streetName(),
            houseNumber = FakeData.faker.address.buildingNumber(),
            zipCode = FakeData.faker.address.postcode().take(5),
            city = FakeData.faker.address.city(),
            firstName = FakeData.faker.name.firstName(),
            lastName = FakeData.faker.name.lastName(),
            phoneNumber = FakeData.faker.phoneNumber.phoneNumber(),
            email = email,
            tosAndPrivacyPolicyConsent = true
        )

        val response = tb.makeRequest(HttpMethod.Post, "/api/admin/candidate/delegate") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(userCreationRequest)
        }

        response.shouldHaveStatus(HttpStatusCode.Created)
        return response.body()
    }
}
