package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentType
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.maps.shouldContainExactly
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import kotlinx.datetime.Clock
import kotlin.time.Duration.Companion.hours

class AdminDashboardSpec : StringSpec({

    "Started assignment becomes instantly visible to the public" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")
            repeat(2) {
                conceptManagementApis.createConceptAssignment(
                    CreateConceptAssignmentRequest(
                        name = "foo",
                        parcelRefs = listOf(
                            ParcelRef(
                                parcelId = "66",
                                constructionSiteId = "14",
                                constructionAreaId = "1"
                            )
                        ),
                        BuildingType.GGW,
                        ConceptAssignmentType.ANLIEGER
                    )
                )
            }

            repeat(11) { idx ->
                conceptManagementApis.createConceptAssignment(
                    CreateConceptAssignmentRequest(
                        name = "foo",
                        parcelRefs = listOf(
                            ParcelRef(
                                parcelId = "66",
                                constructionSiteId = "14",
                                constructionAreaId = "1"
                            )
                        ),
                        BuildingType.GGW,
                        ConceptAssignmentType.ANLIEGER
                    )
                )!!.also {
                    val start = if (idx >= 6) {
                        Clock.System.now().minus(1.hours)
                    } else {
                        Clock.System.now().plus(2.hours)
                    }
                    conceptManagementApis.startConceptAssignment(it.id.toString(), start, Clock.System.now().plus(3.hours))
                }
            }

            val dashboard = dashboardApis.getAdminDashboard()!!
            dashboard.candidaturesInReview.shouldBe(0)
            dashboard.assignmentsByState.shouldContainExactly(
                mapOf(
                    ConceptAssignmentState.ACTIVE to 5L,
                    ConceptAssignmentState.DRAFT to 2L,
                    ConceptAssignmentState.WAITING to 6L
                )
            )
        }
    }

    "Display no next publication" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")

            conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW,
                    ConceptAssignmentType.ANLIEGER
                )
            )

            val dashboard = dashboardApis.getAdminDashboard()!!
            dashboard.nextPublication.shouldBeNull()
        }
    }

    "Display next publication" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")

            val firstStart = Clock.System.now().plus(2.hours)

            val firstStartId = conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW,
                    ConceptAssignmentType.ANLIEGER
                )
            )!!.id.also {
                conceptManagementApis.startConceptAssignment(
                    it.toString(),
                    firstStart,
                    firstStart.plus(2.hours)
                )
            }

            conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW,
                    ConceptAssignmentType.ANLIEGER
                )
            )!!.id.also {
                conceptManagementApis.startConceptAssignment(
                    it.toString(),
                    firstStart.plus(3.hours),
                    firstStart.plus(10.hours)
                )
            }

            val dashboard = dashboardApis.getAdminDashboard()!!
            dashboard.nextFinish.shouldBeNull()
            dashboard.nextPublication.shouldNotBeNull().startOrStop.epochSeconds.shouldBe(firstStart.epochSeconds)
            dashboard.nextPublication.shouldNotBeNull().id.shouldBe(firstStartId.toString())
        }
    }

    "Display next finish" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

            val startedBefore = Clock.System.now().minus(1.hours)
            val firstFinish = Clock.System.now().plus(2.hours)
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")

            val firstStopId = conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW,
                    ConceptAssignmentType.ANCHOR
                )
            )!!.id.also {
                conceptManagementApis.startConceptAssignment(
                    it.toString(),
                    startedBefore,
                    firstFinish
                )
            }

            conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW,
                    ConceptAssignmentType.ANCHOR
                )
            )!!.id.also {
                conceptManagementApis.startConceptAssignment(
                    it.toString(),
                    startedBefore,
                    firstFinish.plus(5.hours)
                )
            }

            val dashboard = dashboardApis.getAdminDashboard()!!
            dashboard.nextFinish.shouldNotBeNull().also {
                it.id.shouldBe(firstStopId.toString())
                it.startOrStop.epochSeconds.shouldBe(firstFinish.epochSeconds)
            }
            dashboard.nextPublication.shouldBeNull()
        }
    }
})
