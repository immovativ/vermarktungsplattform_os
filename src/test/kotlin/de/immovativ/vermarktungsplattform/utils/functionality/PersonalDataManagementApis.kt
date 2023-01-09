package de.immovativ.vermarktungsplattform.utils.functionality

import de.immovativ.vermarktungsplattform.model.user.PasswordChangeRequest
import de.immovativ.vermarktungsplattform.model.user.ProfileInfo
import de.immovativ.vermarktungsplattform.model.user.UpdatePersonalDataRequest
import de.immovativ.vermarktungsplattform.model.user.UserData
import de.immovativ.vermarktungsplattform.model.user.UserDataUpdateRequest
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.ktor.client.call.body
import io.ktor.client.request.accept
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType

class PersonalDataManagementApis(private val tb: TestBase) {

    suspend fun updateUserData(payload: UserDataUpdateRequest) {
        val response = tb.makeRequest(HttpMethod.Put, "/api/self/userData") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(payload)
        }
        response shouldHaveStatus HttpStatusCode.OK
    }

    suspend fun getUserData(): UserData? {
        val response = tb.makeRequest(HttpMethod.Get, "/api/self/userData")
        response shouldHaveStatus HttpStatusCode.OK
        return response.body()
    }

    suspend fun updatePersonalData(
        newName: String,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectStatus: HttpStatusCode = HttpStatusCode.OK
    ) {
        tb.makeRequest(HttpMethod.Post, "/api/self/updatePersonalData", auth) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(
                UpdatePersonalDataRequest(
                    name = newName
                )
            )
        }.shouldHaveStatus(expectStatus)
    }

    suspend fun getProfile(
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectStatus: HttpStatusCode = HttpStatusCode.OK
    ): ProfileInfo? {
        return tb.makeRequest(HttpMethod.Get, "/api/self", auth)
            .also { it.shouldHaveStatus(expectStatus) }
            .takeIf { expectStatus == HttpStatusCode.OK }
            ?.body<ProfileInfo>()
    }

    suspend fun updatePassword(
        current: String,
        new: String,
        auth: AppSpecSupport.LoggedInTestUser? = null,
        expectStatus: HttpStatusCode = HttpStatusCode.NoContent
    ) {
        tb.makeRequest(HttpMethod.Post, "/api/self/updatePassword", auth) {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(
                PasswordChangeRequest(
                    currentPassword = current,
                    newPassword = new
                )
            )
        }.shouldHaveStatus(expectStatus)
    }
}
