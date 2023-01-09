package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.candidature.Candidature
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.messaging.MessageDirection
import de.immovativ.vermarktungsplattform.model.messaging.MessageRequest
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.mailhogClient
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldContainInOrder
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.ktor.http.HttpStatusCode
import kotlinx.datetime.Clock
import org.awaitility.Durations.ONE_HUNDRED_MILLISECONDS
import org.awaitility.kotlin.await
import org.awaitility.kotlin.withPollInterval
import java.time.Duration
import kotlin.time.Duration.Companion.hours

data class MessagingSetup(
    val candidate: AppSpecSupport.LoggedInTestUser,
    val candidature: Candidature,
    val admin: AppSpecSupport.LoggedInTestUser
)

private suspend fun TestBase.messagingSetup(): MessagingSetup {
    val admin = authApis.loginAsProjectGroup()

    val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
    constructionSiteFixtures.persistParcel(constructionSite, "66")
    val conceptAssignment = conceptManagementApis.createConceptAssignment(
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
    )

    conceptManagementApis.startConceptAssignment(
        conceptAssignment?.id.toString(),
        start = Clock.System.now().minus(1.hours),
        end = Clock.System.now().plus(1.hours)
    )

    val candidate = authApis.loginAsCandidate()

    val candidature = candidatureApis.createCandidature(
        ConceptAssignmentId(conceptAssignment!!.id.toString())
    )!!

    return MessagingSetup(candidate = candidate, candidature = candidature, admin = admin)
}

class MessagingSpec : StringSpec({
    "Simple message exchange" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-jobs.conf") {
            val setup = messagingSetup()

            messagingApis.writeMessageAsCandidate(
                setup.candidature.id,
                auth = setup.candidate,
                payload = MessageRequest("lass mal wacken gehen")
            )
            messagingApis.writeMessageAsAdmin(
                setup.candidature.id,
                auth = setup.admin,
                payload = MessageRequest("wat iss wakken")
            )
            messagingApis.writeMessageAsAdmin(
                setup.candidature.id,
                auth = setup.admin,
                payload = MessageRequest("wacken*")
            )
            messagingApis.writeMessageAsCandidate(
                setup.candidature.id,
                auth = setup.candidate,
                payload = MessageRequest("dat iss wacken")
            )

            messagingApis.getMessagesAsAdmin(setup.candidature.id, auth = setup.admin)!!
                .map { it.direction to it.contents }
                .shouldContainInOrder(
                    MessageDirection.USER_TO_ADMIN to "lass mal wacken gehen",
                    MessageDirection.ADMIN_TO_USER to "wat iss wakken",
                    MessageDirection.ADMIN_TO_USER to "wacken*",
                    MessageDirection.USER_TO_ADMIN to "dat iss wacken"
                )
            messagingApis.getMessagesAsCandidate(setup.candidature.id, auth = setup.candidate)!!
                .map { it.direction to it.contents }
                .shouldContainInOrder(
                    MessageDirection.USER_TO_ADMIN to "lass mal wacken gehen",
                    MessageDirection.ADMIN_TO_USER to "wat iss wakken",
                    MessageDirection.ADMIN_TO_USER to "wacken*",
                    MessageDirection.USER_TO_ADMIN to "dat iss wacken"
                )

            await.withPollInterval(ONE_HUNDRED_MILLISECONDS).atMost(Duration.ofSeconds(10L)).untilAsserted {
                mailhogClient.getMessages(
                    "Sie haben eine neue Nachricht für Ihre Bewerbung: foo",
                    "noreply@vermarktungsplattform.de",
                    setup.candidate.email
                ) shouldHaveSize 2
            }
        }
    }

    "Mark messages read" {
        withTestApplicationAndSetup {
            val setup = messagingSetup()

            messagingApis.writeMessageAsCandidate(
                setup.candidature.id,
                auth = setup.candidate,
                payload = MessageRequest("lass mal wacken gehen")
            )
            messagingApis.writeMessageAsAdmin(
                setup.candidature.id,
                auth = setup.admin,
                payload = MessageRequest("wat iss wakken")
            )
            messagingApis.writeMessageAsAdmin(
                setup.candidature.id,
                auth = setup.admin,
                payload = MessageRequest("wacken*")
            )
            messagingApis.writeMessageAsCandidate(
                setup.candidature.id,
                auth = setup.candidate,
                payload = MessageRequest("dat iss wacken")
            )

            messagingApis.getMessagesUnreadAsAdmin(auth = setup.admin)!!
                .map { it.candidatureId }
                .shouldContainExactly(setup.candidature.id, setup.candidature.id)

            messagingApis.markReadAsAdmin(setup.candidature.id)

            messagingApis.getMessagesUnreadAsAdmin(auth = setup.admin)!!
                .shouldBeEmpty()

            messagingApis.getMessagesUnreadAsCandidate(auth = setup.candidate)!!
                .map { it.candidatureId }
                .shouldContainExactly(setup.candidature.id, setup.candidature.id)

            messagingApis.markReadAsCandidate(setup.candidature.id)

            messagingApis.getMessagesUnreadAsCandidate(auth = setup.candidate)!!
                .shouldBeEmpty()
        }
    }

    "Forbidden to get messages from another candidate" {
        withTestApplicationAndSetup {
            val setup = messagingSetup()
            val otherCandidate = authApis.createUserAndLogin(UserRole.CANDIDATE)
            messagingApis.getMessagesAsCandidate(
                setup.candidature.id,
                auth = otherCandidate,
                expectError = HttpStatusCode.NotFound
            )
        }
    }
    "Forbidden to get messages when not properly authorized" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            messagingApis.getMessagesAsCandidate(CandidatureId(), expectError = HttpStatusCode.Forbidden)
            authApis.loginAsCandidate()
            messagingApis.getMessagesAsAdmin(CandidatureId(), expectError = HttpStatusCode.Forbidden)
        }
    }
    "No messages by default" {
        withTestApplicationAndSetup {
            val setup = messagingSetup()

            messagingApis.getMessagesAsCandidate(setup.candidature.id, auth = setup.candidate)!!.shouldBeEmpty()
            messagingApis.getMessagesAsAdmin(setup.candidature.id, auth = setup.admin)!!.shouldBeEmpty()
        }
    }

    "send/view attachment admin -> candidate" {
        withTestApplicationAndSetup {
            val setup = messagingSetup()
            val admin = authApis.loginAsProjectGroup()
            messagingApis.addMessageAttachmentAsAdmin(
                candidatureId = setup.candidature.id,
                attachmentName = "lol.txt",
                content = "this is lol",
                auth = admin
            )
            val msg = messagingApis.getMessagesAsCandidate(setup.candidature.id, setup.candidate)!!
                .single()
                .also { it.attachment.shouldNotBeNull() }
            messagingApis.downloadMessageAttachmentAsAdmin(setup.candidature.id, msg.messageId, admin)
                .shouldBe("this is lol")
            messagingApis.downloadMessageAttachmentAsCandidate(setup.candidature.id, msg.messageId, setup.candidate)
                .shouldBe("this is lol")
        }
    }
    "send/view attachment candidate -> admin" {
        withTestApplicationAndSetup {
            val setup = messagingSetup()
            val admin = authApis.loginAsProjectGroup()
            messagingApis.addMessageAttachmentAsCandidate(
                candidatureId = setup.candidature.id,
                attachmentName = "lol.txt",
                content = "this is lol",
                auth = setup.candidate
            )
            val msg = messagingApis.getMessagesAsAdmin(setup.candidature.id, admin)!!
                .single()
                .also { it.attachment.shouldNotBeNull() }
            messagingApis.downloadMessageAttachmentAsAdmin(setup.candidature.id, msg.messageId, admin)
                .shouldBe("this is lol")
            messagingApis.downloadMessageAttachmentAsCandidate(setup.candidature.id, msg.messageId, setup.candidate)
                .shouldBe("this is lol")
        }
    }
})
