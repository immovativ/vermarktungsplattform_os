package de.immovativ.vermarktungsplattform.service

import de.immovativ.vermarktungsplattform.KtorJson
import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.ParcelType
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.accept
import io.ktor.client.request.get
import io.ktor.http.ContentType
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import mu.KotlinLogging

private val logger = KotlinLogging.logger { }

private data class ParcelIds(
    val constructionAreaId: String,
    val constructionSiteId: String,
    val parcelId: String
)

@kotlinx.serialization.Serializable
private data class ParcelProperties(
    val id: String,
    val fid: Int,
    val kategorie: String,
    val kategorie2: String,
    val flaeche: String
) {
    val ids: ParcelIds? by lazy {
        val split = id.split('.')
        if (split.size < 3) {
            logger.warn { "Invalid parcel id $id" }
            null
        } else {
            ParcelIds(
                constructionAreaId = split[0],
                constructionSiteId = split[1],
                parcelId = split.drop(2).joinToString(".")
            )
        }
    }
}

@Serializable
private data class ParcelFeature(
    val properties: ParcelProperties
)
class ParcelImportService(private val parcelsRepository: ParcelsRepository, private val constructionSitesRepository: ConstructionSitesRepository, private val client: HttpClient) {

    suspend fun importFromRemote() {
        ConstructionSiteImportService.logger.info { "Import Constructionsites" }
        val featureCollection = client.get("https://geoportal.freiburg.de/wfs/verma_dietenbach/verma_dietenbach?service=WFS&version=2.0.0&request=GetFeature&srsName=EPSG:4326&typeNames=ms:grundstuecksparzellierung_ba1&OUTPUTFORMAT=geojson") {
            accept(ContentType.Application.Json)
        }.body<JsonObject>()

        featureCollection["features"]?.jsonArray?.let { shapes -> importShapes(shapes) }
    }

    suspend fun importFromLocal() {
        val parcelFile = this.javaClass.getResource("/fixtures/parzellen.geojson")
        if (parcelFile != null) {
            try {
                val json = Json.parseToJsonElement(parcelFile.readText()).jsonObject
                json["features"]?.jsonArray?.let {
                    importShapes(it)
                }
            } catch (e: Exception) {
                logger.error(e) { "Parsing GeoJSON failed" }
            }
        } else {
            logger.info { "GeoJSON File was not found" }
        }
    }

    private fun importShapes(shapes: List<JsonElement>) {
        shapes.forEach { shape ->
            val feature = KtorJson.decodeFromString<ParcelFeature>(shape.toString())

            feature.properties.ids?.let { parcelIds ->
                val shapeObject: Map<String, JsonElement> = shape.jsonObject
                val enrichedProperties: Map<String, JsonElement> = (shapeObject["properties"]?.jsonObject ?: emptyMap()) + mapOf<String, JsonElement>(
                    "constructionAreaId" to JsonPrimitive(parcelIds.constructionAreaId),
                    "constructionSiteId" to JsonPrimitive(parcelIds.constructionSiteId),
                    "parcelId" to JsonPrimitive(parcelIds.parcelId)
                )
                val enrichedShape = JsonObject(
                    shapeObject + mapOf<String, JsonElement>(
                        "properties" to JsonObject(enrichedProperties)
                    )
                )

                val parcel = Parcel(
                    fid = feature.properties.fid.toString(),
                    constructionAreaId = parcelIds.constructionAreaId,
                    constructionSiteId = parcelIds.constructionSiteId,
                    shape = enrichedShape,
                    parcelId = parcelIds.parcelId,
                    area = feature.properties.flaeche,
                    parcelType = ParcelType.fromCategory1(feature.properties.kategorie) ?: throw RuntimeException("Unknown parcel type ${feature.properties.kategorie}")
                )

                when (constructionSitesRepository.find(parcel.constructionAreaId, parcel.constructionSiteId)) {
                    null -> logger.warn { "Skipping Parcel fid=${parcel.fid} because parent construction site is missing" }
                    else -> parcelsRepository.createOrUpdate(parcel)
                }
            }
        }
    }
}
