package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.shouldBe
import io.ktor.http.HttpStatusCode
import kotlinx.datetime.Clock
import kotlin.time.Duration.Companion.hours

class StartAssignmentSpec : StringSpec({

    "Started assignment becomes instantly visible to the public" {
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
            conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "omgwtfbbq")
            conceptManagementApis.startConceptAssignment(
                created.id.toString(),
                start = Clock.System.now().minus(1.hours),
                end = Clock.System.now().plus(1.hours)
            )

            val publicAvailable = candidatureApis.listAssignments().single()
                .also { it.name.shouldBe("foo") }
            val attachment = candidatureApis.getAssignmentPublic(publicAvailable.id.toString())!!
                .attachments
                .single()
                .also { it.name.shouldBe("lol.txt") }
            candidatureApis.downloadAttachmentPublic(publicAvailable.id.toString(), attachment.id)!!
                .shouldBe("omgwtfbbq")
        }
    }

    "Future assignment is not visible to the public" {
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
            val attachmentId = conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "omgwtfbbq")!!
                .attachments
                .single()
                .id
            conceptManagementApis.startConceptAssignment(
                created.id.toString(),
                start = Clock.System.now().plus(2.hours),
                end = Clock.System.now().plus(3.hours)
            )!!.assignment.state.shouldBe(ConceptAssignmentState.WAITING)

            candidatureApis.listAssignments().shouldBeEmpty()
            candidatureApis.getAssignmentPublic(created.id.toString(), expectError = HttpStatusCode.NotFound)
            candidatureApis.downloadAttachmentPublic(created.id.toString(), attachmentId, expectError = HttpStatusCode.NotFound)
        }
    }

    "Cannot unstart active assignment" {
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
            conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "omgwtfbbq")
            conceptManagementApis.startConceptAssignment(
                created.id.toString(),
                start = Clock.System.now().minus(1.hours),
                end = Clock.System.now().plus(1.hours)
            )

            conceptManagementApis.unstartConceptAssignment(created.id.toString(), expectError = HttpStatusCode.FailedDependency)
        }
    }

    "unstart waiting assignment" {
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
            conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "omgwtfbbq")
            conceptManagementApis.startConceptAssignment(
                created.id.toString(),
                start = Clock.System.now().plus(2.hours),
                end = Clock.System.now().plus(5.hours)
            )!!.assignment.state.shouldBe(ConceptAssignmentState.WAITING)
            conceptManagementApis.unstartConceptAssignment(created.id.toString())!!.assignment.state.shouldBe(ConceptAssignmentState.DRAFT)
        }
    }
})
