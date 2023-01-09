package de.immovativ.vermarktungsplattform.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class ConstructionSiteDetails(
    val key: ConstructionSiteKey,
    //    Bebauungsform
    val form: String,
    //    Art der baulichen Nutzung
    val zoningClassification: String,
    //    Maß der baulichen Nutzung
    val levelOfBuiltDevelopment: String,
    //    Marktsegmente
    val marketSegments: String,
    //    Energieversorgung
    val energySupply: String,
    //    Mobilität
    val mobility: String,
    //    Freiraum
    val clearance: String,
    //    Fläche Baublock [m2]
    val areaBuildingBlock: String,
    // Überbaubare Fläche [m2]
    val plotAreaToBeBuiltOn: String,
    // Grundstückspreis [€/m2]
    val landPricePerSqm: String

)

@Serializable
data class ConstructionSiteKey(
    val constructionAreaId: String,
    val constructionSiteId: String
)

@Serializable
data class ConstructionSite(
    val constructionAreaId: String,
    val constructionSiteId: String,
    val comment: String,
    val fid: String,
    val text: String,
    val shape: JsonElement
)

fun List<ConstructionSite>.toFeatureCollection(): JsonObject {
    return JsonObject(
        mapOf(
            "type" to JsonPrimitive("FeatureCollection"),
            "name" to JsonPrimitive("baufelder"),
            "features" to JsonArray(map { it.shape })
        )
    )
}
