package de.immovativ.vermarktungsplattform.service

import de.immovativ.vermarktungsplattform.KtorJson
import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.accept
import io.ktor.client.request.get
import io.ktor.http.ContentType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import mu.KLogging
import java.nio.file.Files
import java.nio.file.Paths

@Serializable
private data class ContructionSiteProperties(val bauabschnitt: String, val fid: String, val text: String, val baufeld: String, val bemerkung: String)

@Serializable
private data class ConstructionSiteFeature(
    val properties: ContructionSiteProperties
)

class ConstructionSiteImportService(private val constructionSitesRepository: ConstructionSitesRepository, private val client: HttpClient) {
    companion object : KLogging()

    suspend fun importFromRemote() {
        logger.info { "Import Constructionsites" }
        val featureCollection = client.get("https://geoportal.freiburg.de/wfs/verma_dietenbach/verma_dietenbach?service=WFS&version=2.0.0&request=GetFeature&srsName=EPSG:4326&typeNames=ms:baufelder&OUTPUTFORMAT=geojson") {
            accept(ContentType.Application.Json)
        }.body<JsonObject>()

        featureCollection["features"]?.jsonArray?.let { shapes -> importShapes(shapes) }
    }

    suspend fun importFromLocal() {
        val shapes: List<JsonElement> = Json.parseToJsonElement(
            withContext(Dispatchers.IO) {
                Files.readString(Paths.get("src/main/resources/fixtures/bauflaechen.json"))
            }
        ).jsonArray
        importShapes(shapes)
    }

    private fun importShapes(shapes: List<JsonElement>) {
        shapes.forEach { shape ->
            val feature = KtorJson.decodeFromString<ConstructionSiteFeature>(shape.toString())
            val shapeObject: Map<String, JsonElement> = shape.jsonObject
            val enrichedProperties: Map<String, JsonElement> = (shapeObject["properties"]?.jsonObject ?: emptyMap()) + mapOf<String, JsonElement>(
                "constructionAreaId" to JsonPrimitive(feature.properties.bauabschnitt),
                "constructionSiteId" to JsonPrimitive(feature.properties.baufeld)
            )
            val enrichedShape = JsonObject(
                shapeObject + mapOf<String, JsonElement>(
                    "properties" to JsonObject(enrichedProperties)
                )
            )
            val constructionSite = ConstructionSite(
                constructionAreaId = feature.properties.bauabschnitt,
                constructionSiteId = feature.properties.baufeld,
                comment = feature.properties.bemerkung,
                fid = feature.properties.fid,
                text = feature.properties.text,
                shape = enrichedShape
            )

            constructionSitesRepository.createOrUpdate(constructionSite)
        }
    }
}
