package de.immovativ.vermarktungsplattform.model.location

import kotlinx.serialization.json.JsonObject

@kotlinx.serialization.Serializable
data class Location(
    val geoJson: JsonObject
)
