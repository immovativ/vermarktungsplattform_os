package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.ConstructionSiteDetails
import de.immovativ.vermarktungsplattform.model.ConstructionSiteKey
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.andWhere
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

object ConstructionSiteDetailsTable : Table("construction_site_details") {
    val constructionAreaId: Column<String> = varchar("construction_area_id", 20)
    val constructionSiteId: Column<String> = varchar("construction_site_id", 20)
    val form: Column<String> = text("form")
    val zoningClassification: Column<String> = text("zoning_classification")
    val levelOfBuiltDevelopment: Column<String> = text("level_of_built_development")
    val marketSegments: Column<String> = text("market_segments")
    val energySupply: Column<String> = text("energy_supply")
    val mobility: Column<String> = text("mobility")
    val clearance: Column<String> = text("clearance")
    val areaBuildingBlock: Column<String> = text("area_building_block")
    val plotAreaToBeBuiltOn: Column<String> = text("plot_area_to_be_built_on")
    val landPricePerSqm: Column<String> = text("land_price_per_sqm")

    override val primaryKey = PrimaryKey(constructionAreaId, constructionSiteId)
}

class ConstructionSiteDetailsRepository : TestCleanable {
    private fun ResultRow.toConstructionSiteDetails(): ConstructionSiteDetails = ConstructionSiteDetails(
        key = ConstructionSiteKey(
            constructionAreaId = this[ConstructionSiteDetailsTable.constructionAreaId],
            constructionSiteId = this[ConstructionSiteDetailsTable.constructionSiteId]
        ),
        form = this[ConstructionSiteDetailsTable.form],
        zoningClassification = this[ConstructionSiteDetailsTable.zoningClassification],
        levelOfBuiltDevelopment = this[ConstructionSiteDetailsTable.levelOfBuiltDevelopment],
        marketSegments = this[ConstructionSiteDetailsTable.marketSegments],
        energySupply = this[ConstructionSiteDetailsTable.energySupply],
        mobility = this[ConstructionSiteDetailsTable.mobility],
        clearance = this[ConstructionSiteDetailsTable.clearance],
        areaBuildingBlock = this[ConstructionSiteDetailsTable.areaBuildingBlock],
        plotAreaToBeBuiltOn = this[ConstructionSiteDetailsTable.plotAreaToBeBuiltOn],
        landPricePerSqm = this[ConstructionSiteDetailsTable.landPricePerSqm]

    )

    fun createOrUpdate(constructionSiteDetails: ConstructionSiteDetails) {
        transaction {
            ConstructionSiteDetailsTable.upsert {
                it[constructionAreaId] = constructionSiteDetails.key.constructionAreaId
                it[constructionSiteId] = constructionSiteDetails.key.constructionSiteId

                it[form] = constructionSiteDetails.form
                it[zoningClassification] = constructionSiteDetails.zoningClassification
                it[levelOfBuiltDevelopment] = constructionSiteDetails.levelOfBuiltDevelopment
                it[marketSegments] = constructionSiteDetails.marketSegments
                it[energySupply] = constructionSiteDetails.energySupply
                it[mobility] = constructionSiteDetails.mobility
                it[clearance] = constructionSiteDetails.clearance
                it[areaBuildingBlock] = constructionSiteDetails.areaBuildingBlock
                it[plotAreaToBeBuiltOn] = constructionSiteDetails.plotAreaToBeBuiltOn
                it[landPricePerSqm] = constructionSiteDetails.landPricePerSqm
            }
        }
    }

    fun find(constructionAreaId: String, constructionSiteId: String): ConstructionSiteDetails? = transaction {
        ConstructionSiteDetailsTable.selectAll()
            .andWhere { ConstructionSiteDetailsTable.constructionAreaId eq constructionAreaId }
            .andWhere { ConstructionSiteDetailsTable.constructionSiteId eq constructionSiteId }
            .limit(1)
            .map { it.toConstructionSiteDetails() }
            .firstOrNull()
    }

    override fun deleteAllOnlyForTesting(): Unit = transaction {
        ConstructionSiteDetailsTable.deleteAll()
    }

    override val priority: Int
        get() = 20
}
