package de.immovativ.vermarktungsplattform.model.conceptassignment

enum class BuildingType {
    GGW, // grosser geschosswohnungsbau
    MGW, // mittlerer x
    KGW, // kleiner x
    GTH, //  grosses townhouse
    KTH, // kleines x
    WH // wohnhein
}

@kotlinx.serialization.Serializable
data class ConceptDetails(
    val buildingType: BuildingType,
    val allowedFloors: Int?,
    val allowedBuildingHeightMeters: Double?,
    val energyText: String?
)
