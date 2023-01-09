package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.model.ConstructionSite
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import kotlinx.serialization.json.JsonElement
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.andWhere
import org.jetbrains.exposed.sql.count
import org.jetbrains.exposed.sql.deleteAll
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

object ConstructionSitesTable : Table("construction_sites") {
    val constructionAreaId: Column<String> = varchar("construction_area_id", 20)
    val constructionSiteId: Column<String> = varchar("construction_site_id", 20)
    val comment: Column<String> = text("comment")
    val fid: Column<String> = varchar("fid", 20)
    val text: Column<String> = text("text")
    val shape: Column<JsonElement> = jsonb("shape", JsonElement::class)

    override val primaryKey = PrimaryKey(constructionAreaId, constructionSiteId)
}

class ConstructionSitesRepository : TestCleanable {
    private fun ResultRow.toConstructionSite(): ConstructionSite = ConstructionSite(
        constructionAreaId = this[ConstructionSitesTable.constructionAreaId],
        constructionSiteId = this[ConstructionSitesTable.constructionSiteId],
        comment = this[ConstructionSitesTable.comment],
        fid = this[ConstructionSitesTable.fid],
        text = this[ConstructionSitesTable.text],
        shape = this[ConstructionSitesTable.shape]
    )

    fun createOrUpdate(constructionSite: ConstructionSite) {
        transaction {
            ConstructionSitesTable.upsert {
                it[constructionAreaId] = constructionSite.constructionAreaId
                it[constructionSiteId] = constructionSite.constructionSiteId
                it[comment] = constructionSite.comment
                it[text] = constructionSite.text
                it[fid] = constructionSite.fid
                it[shape] = constructionSite.shape
            }
        }
    }

    fun findAll(): List<ConstructionSite> = transaction {
        ConstructionSitesTable
            .selectAll()
            .map { it.toConstructionSite() }
            .toList()
    }

    fun find(constructionAreaId: String, constructionSiteId: String): ConstructionSite? = transaction {
        ConstructionSitesTable.selectAll()
            .andWhere { ConstructionSitesTable.constructionAreaId eq constructionAreaId }
            .andWhere { ConstructionSitesTable.constructionSiteId eq constructionSiteId }
            .limit(1)
            .map { it.toConstructionSite() }
            .firstOrNull()
    }

    fun findWithAnchor(): List<ConstructionSite> = transaction {
        ConstructionSitesTable.join(
            otherTable = ParcelToConceptAssignmentTable,
            joinType = JoinType.LEFT,
            additionalConstraint = {
                ParcelToConceptAssignmentTable.constructionAreaId.eq(ConstructionSitesTable.constructionAreaId) and
                    ParcelToConceptAssignmentTable.constructionSiteId.eq(ConstructionSitesTable.constructionSiteId)
            }
        ).join(
            otherTable = ConceptAssignmentTable,
            joinType = JoinType.LEFT,
            additionalConstraint = {
                ConceptAssignmentTable.id.eq(ParcelToConceptAssignmentTable.conceptAssignmentId) and
                    ConceptAssignmentTable.state.neq(ConceptAssignmentState.ABORTED) and
                    ConceptAssignmentTable.conceptAssignmentType.eq(ConceptAssignmentType.ANCHOR)
            }
        )
            .slice(ConstructionSitesTable.fields + ConceptAssignmentTable.id.count())
            .selectAll()
            .groupBy(ConstructionSitesTable.constructionAreaId)
            .groupBy(ConstructionSitesTable.constructionSiteId)
            .having {
                ConceptAssignmentTable.id.count().greater(0)
            }
            .map { it.toConstructionSite() }
    }
    fun findWithoutAnchor(): List<ConstructionSite> = transaction {
        ConstructionSitesTable.join(
            otherTable = ParcelToConceptAssignmentTable,
            joinType = JoinType.LEFT,
            additionalConstraint = {
                ParcelToConceptAssignmentTable.constructionAreaId.eq(ConstructionSitesTable.constructionAreaId) and
                    ParcelToConceptAssignmentTable.constructionSiteId.eq(ConstructionSitesTable.constructionSiteId)
            }
        ).join(
            otherTable = ConceptAssignmentTable,
            joinType = JoinType.LEFT,
            additionalConstraint = {
                ConceptAssignmentTable.id.eq(ParcelToConceptAssignmentTable.conceptAssignmentId) and
                    ConceptAssignmentTable.state.neq(ConceptAssignmentState.ABORTED) and
                    ConceptAssignmentTable.conceptAssignmentType.eq(ConceptAssignmentType.ANCHOR)
            }
        )
            .slice(ConstructionSitesTable.fields + ConceptAssignmentTable.id.count())
            .selectAll()
            .groupBy(ConstructionSitesTable.constructionAreaId)
            .groupBy(ConstructionSitesTable.constructionSiteId)
            .having {
                ConceptAssignmentTable.id.count().eq(0)
            }
            .map { it.toConstructionSite() }
    }

    override fun deleteAllOnlyForTesting(): Unit = transaction {
        ConstructionSitesTable.deleteAll()
    }
}
