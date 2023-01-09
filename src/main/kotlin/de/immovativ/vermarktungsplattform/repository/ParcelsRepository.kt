package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.Parcel
import de.immovativ.vermarktungsplattform.model.ParcelType
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import kotlinx.serialization.json.JsonElement
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.andWhere
import org.jetbrains.exposed.sql.count
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

object ParcelsTable : Table("parcels") {
    val parcelId: Column<String> = varchar("parcel_id", 20)
    val constructionAreaId: Column<String> = varchar("construction_area_id", 20)
    val constructionSiteId: Column<String> = varchar("construction_site_id", 20)
    val area: Column<String> = text("area")
    val fid: Column<String> = varchar("fid", 20)
    val parcelType: Column<ParcelType> = enumerationByName("parcel_type", 100, ParcelType::class)
    val shape: Column<JsonElement> = jsonb("shape", JsonElement::class)

    override val primaryKey = PrimaryKey(parcelId, constructionAreaId, constructionSiteId)
}

class ParcelsRepository : TestCleanable {

    override val priority: Int
        get() = 10

    fun ResultRow.toParcel(): Parcel = Parcel(
        parcelId = this[ParcelsTable.parcelId],
        constructionAreaId = this[ParcelsTable.constructionAreaId],
        constructionSiteId = this[ParcelsTable.constructionSiteId],
        area = this[ParcelsTable.area],
        fid = this[ParcelsTable.fid],
        parcelType = this[ParcelsTable.parcelType],
        shape = this[ParcelsTable.shape]
    )

    fun createOrUpdate(parcel: Parcel) {
        transaction {
            ParcelsTable.upsert {
                it[parcelId] = parcel.parcelId
                it[constructionAreaId] = parcel.constructionAreaId
                it[constructionSiteId] = parcel.constructionSiteId
                it[area] = parcel.area
                it[fid] = parcel.fid
                it[parcelType] = parcel.parcelType
                it[shape] = parcel.shape
            }
        }
    }

    fun findAll(): List<Parcel> = transaction {
        ParcelsTable
            .selectAll()
            .map { it.toParcel() }
            .toList()
    }

    fun findAvailableForConstructionSite(constructionAreaId: String, constructionSiteId: String): List<Parcel> = transaction {
        ParcelsTable
            .leftJoin(ParcelToConceptAssignmentTable)
            .join(
                otherTable = ConceptAssignmentTable,
                onColumn = ParcelToConceptAssignmentTable.conceptAssignmentId,
                otherColumn = ConceptAssignmentTable.id,
                additionalConstraint = { ConceptAssignmentTable.state.neq(ConceptAssignmentState.ABORTED) },
                joinType = JoinType.LEFT
            )
            .slice(ParcelsTable.fields)
            .selectAll()
            .andWhere { ParcelsTable.constructionAreaId eq constructionAreaId }
            .andWhere { ParcelsTable.constructionSiteId eq constructionSiteId }
            .groupBy(ParcelsTable.parcelId)
            .groupBy(ParcelsTable.constructionSiteId)
            .groupBy(ParcelsTable.constructionAreaId)
            .having {
                ParcelToConceptAssignmentTable.parcelId.count().eq(0)
            }
            .map { it.toParcel() }
    }

    fun findUnavailableForConstructionSite(constructionAreaId: String, constructionSiteId: String): List<Parcel> = transaction {
        ParcelsTable
            .leftJoin(ParcelToConceptAssignmentTable)
            .join(
                otherTable = ConceptAssignmentTable,
                onColumn = ParcelToConceptAssignmentTable.conceptAssignmentId,
                otherColumn = ConceptAssignmentTable.id,
                additionalConstraint = { ConceptAssignmentTable.state.neq(ConceptAssignmentState.ABORTED) },
                joinType = JoinType.LEFT
            )
            .slice(ParcelsTable.fields)
            .selectAll()
            .andWhere { ParcelsTable.constructionAreaId eq constructionAreaId }
            .andWhere { ParcelsTable.constructionSiteId eq constructionSiteId }
            .groupBy(ParcelsTable.parcelId)
            .groupBy(ParcelsTable.constructionSiteId)
            .groupBy(ParcelsTable.constructionAreaId)
            .having {
                ParcelToConceptAssignmentTable.parcelId.count().greater(0)
            }
            .map { it.toParcel() }
    }

    fun findAllForConstructionSite(constructionAreaId: String, constructionSiteId: String): List<Parcel> = transaction {
        ParcelsTable.selectAll()
            .andWhere { ParcelsTable.constructionAreaId eq constructionAreaId }
            .andWhere { ParcelsTable.constructionSiteId eq constructionSiteId }
            .map { it.toParcel() }
    }

    fun find(constructionAreaId: String, constructionSiteId: String, parcelId: String): Parcel? = transaction {
        ParcelsTable.selectAll()
            .andWhere { ParcelsTable.constructionAreaId eq constructionAreaId }
            .andWhere { ParcelsTable.constructionSiteId eq constructionSiteId }
            .andWhere { ParcelsTable.parcelId eq parcelId }
            .limit(1)
            .map { it.toParcel() }
            .firstOrNull()
    }

    override fun deleteAllOnlyForTesting(): Unit = transaction {
        ParcelsTable.deleteAll()
    }
}
