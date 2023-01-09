package de.immovativ.vermarktungsplattform.model

import kotlinx.serialization.json.JsonElement

enum class ParcelType(val category1: String, val category2: String) {
    COMMUNITY_PROPERTY_NON_PUBLIC("Gemeinbedarf (nicht-oeffentlich)", "Gemeinbedarf nö"),
    COMMUNITY_PROPERTY_PUBLIC("Gemeinbedarf (oeffentlich)", "Gemeinbedarf ö"),
    COMMERCIAL("Gewerbe / Büro / Sondernutzung", "Gewerbe"),
    APPARTMENT_COMPLEX_BIG_1("Geschosswohnen groß mit spez. Erschließung", "GW groß 1"),
    APPARTMENT_COMPLEX_BIG_2("Geschosswohnen groß mit integrierter KiTa", "GW groß 2"),
    APPARTMENT_COMPLEX_BIG_3("Geschosswohnen groß", "GW groß 3"),
    APPARTMENT_COMPLEX_BIG_4("Geschosswohnen groß mit durchgehender EG Nutzung", "GW groß 4"),
    APPARTMENT_COMPLEX_SMALL("Geschosswohnen klein", "GW klein"),
    APPARTMENT_COMPLEX_MEDIUM("Geschosswohnen mittel", "GW mittel"),
    INNER_COURTYARD("gemeinschaftlicher Innenhof", "Innenhof"),
    NEIGHBOURHOOD_GARAGE("Quartiersgarage", "Quartiersgarage"),
    TOWNHOUSE_BIG("Townhouse groß", "TH groß"),
    TOWNHOUS_SMALL("Townhouse klein", "TH klein");

    companion object {
        fun fromCategory1(category1: String): ParcelType? =
            enumValues<ParcelType>().find { it.category1 == category1 }
        fun fromCategory2(category2: String): ParcelType? =
            enumValues<ParcelType>().find { it.category2 == category2 }
    }
}

@kotlinx.serialization.Serializable
data class Parcel(
    val parcelId: String,
    val constructionAreaId: String,
    val constructionSiteId: String,
    val area: String,
    val fid: String,
    val parcelType: ParcelType,
    val shape: JsonElement
)
