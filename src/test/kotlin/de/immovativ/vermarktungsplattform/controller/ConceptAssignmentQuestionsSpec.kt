package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.conceptassignment.UpdateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.shouldBe

class ConceptAssignmentQuestionsSpec : StringSpec({

    "Create assignment that is not yet listed due to draft" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")
            val created = conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW
                )
            )!!
            conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!.assignment.details.allowedBuildingHeightMeters.shouldBeNull()
            val updated = conceptManagementApis.updateConceptAssignment(
                created.id.toString(),
                UpdateConceptAssignmentRequest(
                    details = ConceptDetails(
                        buildingType = BuildingType.GTH,
                        allowedFloors = 30,
                        allowedBuildingHeightMeters = 100.0,
                        energyText = null
                    )
                )
            )!!.assignment.details
            val retrieved = conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!.assignment.details

            listOf(retrieved, updated).forEach {
                it.buildingType.shouldBe(BuildingType.GTH)
                it.allowedFloors.shouldBe(30)
                it.energyText.shouldBeNull()
                it.allowedBuildingHeightMeters.shouldBe(100.0)
            }
        }
    }
})
