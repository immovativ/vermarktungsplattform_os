package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.mailhogClient
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.FakeData
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.ktor.http.HttpStatusCode
import kotlinx.datetime.Clock
import kotlin.time.Duration.Companion.hours

class ConceptAssignmentSpec : StringSpec({

    "Refuse unauthenticated creation" {
        withTestApplicationAndSetup {
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
                    BuildingType.GGW
                ),
                HttpStatusCode.Forbidden
            )
        }
    }

    "Refuse unauthorized creation from candidate" {
        withTestApplicationAndSetup {
            authApis.loginAsCandidate()
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
                    BuildingType.GGW
                ),
                HttpStatusCode.Forbidden
            )
        }
    }

    "list only concepts with matching state" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")
            conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "draft",
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
            conceptManagementApis.listConceptsAsAdmin().map { it.assignment.name }.shouldContainExactly("draft")
            conceptManagementApis.listConceptsAsAdmin("DRAFT").map { it.assignment.name }.shouldContainExactly("draft")
            conceptManagementApis.listConceptsAsAdmin("ACTIVE").map { it.assignment.name }.shouldBeEmpty()
            // typo so lists everything
            conceptManagementApis.listConceptsAsAdmin("aCtIvE").map { it.assignment.name }.shouldContainExactly("draft")
        }
    }

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
            val retrieved = conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!
            retrieved.assignment.state.shouldBe(ConceptAssignmentState.DRAFT)
            retrieved.attachments.shouldBeEmpty()
            val assignments = candidatureApis.listAssignments()
            assignments.shouldBeEmpty()
            conceptManagementApis.listConceptsAsAdmin().single().let {
                it.assignment.id.shouldBe(retrieved.assignment.id)
                it.assignment.name.shouldBe(retrieved.assignment.name)
                it.assignment.parcels.shouldBe(retrieved.assignment.parcels)
            }
        }
    }

    "Create then delete draft" {
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
            conceptManagementApis.deleteConceptDraft(created.id.toString())
            conceptManagementApis.listConceptsAsAdmin().shouldBeEmpty()
        }
    }
    "Cannot delete non-draft" {
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
            conceptManagementApis.startConceptAssignment(
                created.id.toString(),
                Clock.System.now().minus(5.hours),
                Clock.System.now().plus(5.hours)
            )
            conceptManagementApis.deleteConceptDraft(created.id.toString(), expectError = HttpStatusCode.FailedDependency)
        }
    }

    "Create assignment with attachment that is not yet listed due to draft" {
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
            val retrieved = conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!
            retrieved.assignment.state.shouldBe(ConceptAssignmentState.DRAFT)
            retrieved.attachments.shouldBeEmpty()
            conceptManagementApis.attachData(retrieved.assignment.id.toString(), attachmentName = "lol.txt")

            val retrieved2 = conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!
            retrieved2.attachments.map { it.name }.shouldContainExactly("lol.txt")

            candidatureApis.listAssignments().shouldBeEmpty()
        }
    }

    "Download draft attachment privately, but not public" {
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
            val attached = conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "lol wut")!!
            candidatureApis.downloadAttachmentAsAdmin(created.id.toString(), attached.attachments.single().id).shouldBe("lol wut")

            candidatureApis.downloadAttachmentPublic(
                created.id.toString(),
                attached.attachments.single().id,
                expectError = HttpStatusCode.NotFound
            )
        }
    }

    "Delete draft attachment" {
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
            val attached = conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "lol wut")!!
            candidatureApis.downloadAttachmentAsAdmin(created.id.toString(), attached.attachments.single().id).shouldBe("lol wut")

            conceptManagementApis.deleteAttachmentAsAdmin(
                created.id.toString(),
                attached.attachments.single().id
            )!!.attachments.shouldBeEmpty()

            candidatureApis.downloadAttachmentAsAdmin(
                created.id.toString(),
                attached.attachments.single().id,
                expectError = HttpStatusCode.NotFound
            )
        }
    }

    "Can create delegated User" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val email = FakeData.faker.internet.email()
            conceptManagementApis.createDelegateUser(email)
            val user = userRepository.findStatusByEmailWithReset(email)
            user.shouldNotBeNull()
            user.first.shouldBe(UserStatus.DELEGATED)
        }
    }

    "Can create candidature for delegated User" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")
            val email = FakeData.faker.internet.email()
            val userData = conceptManagementApis.createDelegateUser(email)
            val concept = conceptManagementApis.createConceptAssignment(
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

            conceptManagementApis.startConceptAssignment(
                concept.id.toString(),
                start = Clock.System.now().minus(1.hours),
                end = Clock.System.now().plus(1.hours)
            )

            val candidature = candidatureApis.createDelegateCandidature(
                conceptAssignmentId = ConceptAssignmentId(concept.id.toString()),
                delegatedUserId = userData.userId.value
            )

            candidature.shouldNotBeNull()
            candidature.userId shouldBe userData.userId
        }
    }

    "Delegated User can't request a password reset" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val delegateEmail = FakeData.faker.internet.email()
            conceptManagementApis.createDelegateUser(delegateEmail)
            authApis.requestPwReset(delegateEmail)

            val candidateEmail = FakeData.faker.internet.email()
            authApis.createUserAndLogin(UserRole.CANDIDATE, candidateEmail)
            authApis.requestPwReset(candidateEmail)

            mailhogClient.getMessages(
                "Rücksetzen Ihres Passworts auf der Vermarktungsplattform Dietenbach",
                "noreply@vermarktungsplattform.de",
                candidateEmail
            ).shouldHaveSize(1)

            mailhogClient.getMessages(
                "Rücksetzen Ihres Passworts auf der Vermarktungsplattform Dietenbach",
                "noreply@vermarktungsplattform.de",
                delegateEmail
            ).shouldHaveSize(0)
        }
    }

    "Delegated User can be activated and receives a password reset mail" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val delegateEmail = FakeData.faker.internet.email()
            val userData = conceptManagementApis.createDelegateUser(delegateEmail)
            val user = authApis.getUser(userData.userId.value)
            user?.status?.shouldBe(UserStatus.DELEGATED)
            authApis.requestPwResetForDelegate(userData.userId.value)

            val changedUser = authApis.getUser(userData.userId.value)
            changedUser?.status?.shouldBe(UserStatus.INACTIVE)

            mailhogClient.getMessages(
                "Rücksetzen Ihres Passworts auf der Vermarktungsplattform Dietenbach",
                "noreply@vermarktungsplattform.de",
                delegateEmail
            ).shouldHaveSize(1)
        }
    }

    "Download concept assignment attachments works" {
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
            conceptManagementApis.attachData(created.id.toString(), attachmentName = "lol.txt", content = "lol wut")!!
            conceptManagementApis.attachData(created.id.toString(), attachmentName = "rofl.txt", content = "dafuq")!!

            conceptManagementApis.startConceptAssignment(created.id.toString(), Clock.System.now().minus(5.hours), Clock.System.now().plus(5.hours))

            val response = conceptManagementApis.downloadAttachmentZip(
                ConceptAssignmentId(created.id.toString())
            )

            response shouldHaveSize 2
            response[0] shouldBe "lol wut"
            response[1] shouldBe "dafuq"
        }
    }
})
