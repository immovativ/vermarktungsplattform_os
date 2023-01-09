package de.immovativ.vermarktungsplattform.utils.functionality

import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.ktor.client.call.body
import io.ktor.client.request.accept
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode

class ConstructionSiteApis(private val tb: TestBase) {

    suspend fun getFeatureCollectionForAll(): String {
        tb.authApis.loginAsProjectGroup()
        val response = tb.makeRequest(HttpMethod.Get, "/api/construction-area/all/feature-collection") {
            accept(ContentType.Application.Json)
        }
        response.shouldHaveStatus(HttpStatusCode.OK)
        return response.bodyAsText()
    }
    suspend fun getConstructionSite(
        constructionAreaId: String,
        constructionSiteId: String
    ): ConstructionSite {
        tb.authApis.loginAsProjectGroup()
        val response = tb.makeRequest(HttpMethod.Get, "/api/construction-area/$constructionAreaId/construction-site/$constructionSiteId") {
            accept(ContentType.Application.Json)
        }
        response.shouldHaveStatus(HttpStatusCode.OK)
        return response.body()
    }

    suspend fun getParcel(
        constructionAreaId: String,
        constructionSiteId: String,
        parcelId: String
    ): Parcel {
        tb.authApis.loginAsProjectGroup()
        val response = tb.makeRequest(HttpMethod.Get, "/api/construction-area/$constructionAreaId/construction-site/$constructionSiteId/parcels/$parcelId") {
            accept(ContentType.Application.Json)
        }
        response.shouldHaveStatus(HttpStatusCode.OK)
        return response.body()
    }

    suspend fun getAllParcels(
        constructionAreaId: String,
        constructionSiteId: String
    ): List<Parcel> {
        tb.authApis.loginAsProjectGroup()
        val response = tb.makeRequest(HttpMethod.Get, "/api/construction-area/$constructionAreaId/construction-site/$constructionSiteId/parcels") {
            accept(ContentType.Application.Json)
        }
        response.shouldHaveStatus(HttpStatusCode.OK)
        return response.body()
    }
}
