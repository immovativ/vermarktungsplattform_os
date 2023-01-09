package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.KtorJson
import de.immovativ.vermarktungsplattform.model.attachment.AttachmentId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithDetails
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.question.EnumQuestion
import de.immovativ.vermarktungsplattform.model.question.FileUploadQuestion
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.service.S3Service
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.FakeData
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.assertions.throwables.shouldNotThrowAny
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.should
import io.kotest.matchers.shouldBe
import io.ktor.client.call.body
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import kotlinx.datetime.Clock
import kotlinx.serialization.encodeToString
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import kotlin.time.Duration.Companion.hours

class CandidatureSpec : StringSpec({
    "Create candidature" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.loginAsCandidate()

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesResponse shouldHaveStatus HttpStatusCode.OK

            val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()
            candidatureWithDetails shouldHaveSize 1
            candidatureWithDetails.first().state shouldBe CandidatureState.DRAFT

            candidatureApis.editCandidature(
                candidatureWithDetails.first().id,
                EditCandidatureRequest(
                    description = "foo",
                    answers = emptyMap()
                )
            )

            candidatureApis.submitCandidature(
                candidatureId = candidatureWithDetails.first().id
            )

            val candidaturesAfterSubmittingResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesAfterSubmittingResponse shouldHaveStatus HttpStatusCode.OK

            val candidaturesAfterSubmitting: List<CandidatureWithDetails> = candidaturesAfterSubmittingResponse.body()
            candidaturesAfterSubmitting shouldHaveSize 1
            candidaturesAfterSubmitting.first().state shouldBe CandidatureState.SUBMITTED
        }
    }

    "Delete candidature" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.loginAsCandidate()
            val s3Service = S3Service()

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesResponse shouldHaveStatus HttpStatusCode.OK

            val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()
            candidatureWithDetails shouldHaveSize 1
            candidatureWithDetails.first().state shouldBe CandidatureState.DRAFT

            val attachmentMetadata = candidatureApis.addAttachmentAsCandidate(
                candidatureId = candidatureWithDetails.first().id,
                attachmentName = "foo.txt",
                content = "fkbr"
            )

            shouldNotThrowAny {
                s3Service.download(attachmentMetadata.id)
            }

            val candidature = candidatureApis.getCandidatureAsCandidate(candidatureWithDetails.first().id)!!
            candidature.candidatureWithAttachments.candidature.id shouldBe candidatureWithDetails.first().id
            candidature.candidatureWithAttachments.attachments.size shouldBe 1
            candidature.candidatureWithAttachments.attachments.first().should { attachment ->
                attachment.id shouldBe attachmentMetadata.id
                attachment.name shouldBe attachmentMetadata.name
            }

            candidatureApis.deleteCandidature(
                candidatureWithDetails.first().id,
                HttpStatusCode.NoContent
            )

            val candidaturesAfterDeletingResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesAfterDeletingResponse shouldHaveStatus HttpStatusCode.OK

            val candidaturesAfterDeleting: List<CandidatureWithDetails> = candidaturesAfterDeletingResponse.body()
            candidaturesAfterDeleting shouldHaveSize 0

            shouldThrow<NoSuchKeyException> {
                s3Service.download(attachmentMetadata.id)
            }
        }
    }

    "Can get state of candidature for concept assignment id" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.loginAsCandidate()

            val conceptAssignmentId = ConceptAssignmentId(conceptAssignment!!.id.toString())

            val candidature = candidatureApis.createCandidature(
                conceptAssignmentId
            )

            val response = candidatureApis.getCandidatureState(
                conceptAssignmentId = conceptAssignmentId
            )

            response.candidatureId shouldBe candidature!!.id
            response.state shouldBe CandidatureState.DRAFT
        }
    }

    "Attachment management works" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.loginAsCandidate()

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesResponse shouldHaveStatus HttpStatusCode.OK

            val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()
            candidatureWithDetails shouldHaveSize 1

            val candidatureId = candidatureWithDetails.first().id

            val attachmentMetadata = candidatureApis.addAttachmentAsCandidate(
                candidatureId = candidatureId,
                attachmentName = "foo.txt",
                content = "fkbr"
            )

            val downloadedAsCandidateAttachment = candidatureApis.downloadAttachment(
                candidatureId = candidatureId,
                attachmentId = AttachmentId(attachmentMetadata.id)
            )

            downloadedAsCandidateAttachment shouldBe "fkbr"

            authApis.loginAsProjectGroup()

            val downloadedAsProjectGroupAttachment = candidatureApis.downloadAttachment(
                candidatureId = candidatureId,
                attachmentId = AttachmentId(attachmentMetadata.id)
            )

            downloadedAsProjectGroupAttachment shouldBe "fkbr"

            authApis.loginAsCandidate()

            candidatureApis.deleteAttachmentAsCandidate(
                candidatureId = candidatureId,
                attachmentId = AttachmentId(attachmentMetadata.id)
            )
        }
    }

    "Attachment downloads work" {
        withTestApplicationAndSetup {
            val user = authApis.createUserAndLogin()

            val candidature = conceptManagementApis.createConceptWithCandidature(
                modConcept = {},
                modCandidature = {
                    candidatureApis.addAttachmentAsCandidate(
                        candidatureId = it.id,
                        attachmentName = "foo.txt",
                        content = "fkbr"
                    )
                    candidatureApis.addAttachmentAsCandidate(
                        candidatureId = it.id,
                        attachmentName = "bar.txt",
                        content = "sxoe"
                    )
                },
                auth = user
            )

            authApis.loginAsProjectGroup()

            val projectGroupZip = candidatureApis.downloadAttachmentZipAsProjectGroup(
                candidatureId = candidature.id
            )

            projectGroupZip shouldHaveSize 2
            projectGroupZip[0] shouldBe "fkbr"
            projectGroupZip[1] shouldBe "sxoe"

            authApis.logInAs(user.email, user.password)

            val candidateZip = candidatureApis.downloadAttachmentZipAsCandidate(
                candidatureId = candidature.id
            )

            candidateZip shouldHaveSize 2
            candidateZip[0] shouldBe "fkbr"
            candidateZip[1] shouldBe "sxoe"
        }
    }

    "Candidate can only see his own candidatures" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.createUserAndLogin(conceptAssignment!!.id)

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment.id.toString())
            )

            authApis.loginAsCandidate()

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesResponse shouldHaveStatus HttpStatusCode.OK

            val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()
            candidatureWithDetails shouldHaveSize 0
        }
    }

    "Admin can see submitted candidature" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.createUserAndLogin()

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesResponse shouldHaveStatus HttpStatusCode.OK

            val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()

            candidatureApis.editCandidature(
                candidatureWithDetails.first().id,
                EditCandidatureRequest(
                    description = "foo",
                    answers = emptyMap()
                )
            )

            candidatureApis.submitCandidature(
                candidatureId = candidatureWithDetails.first().id
            )

            authApis.loginAsProjectGroup()
            val view = candidatureApis.getCandidatureAsAdmin(candidatureWithDetails.single().id.value)!!
            view.details.candidatureWithAttachments.candidature.id.shouldBe(candidatureWithDetails.first().id)
            view.user.company.shouldNotBeNull()
            view.user.firstName.shouldNotBeNull()
        }
    }

    "Admin can not see draft candidature" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.createUserAndLogin()

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
            candidaturesResponse shouldHaveStatus HttpStatusCode.OK

            val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()

            authApis.loginAsProjectGroup()
            // yeah 500 is "weird" but whatever, good enough
            candidatureApis.getCandidatureAsAdmin(candidatureWithDetails.single().id.value, HttpStatusCode.InternalServerError)
        }
    }

    "Cannot create duplicate candidature" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            authApis.loginAsCandidate()

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment.id.toString()),
                expectedStatus = HttpStatusCode.Conflict
            )
        }
    }

    "Candidature submission is validated" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()

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

            conceptManagementApis.updateConceptAssignmentQuestions(
                conceptAssignment?.id.toString(),
                CandidatureQuestions(
                    questions = listOf(
                        EnumQuestion(
                            id = QuestionId("25e80140-34aa-4778-a21c-b5b0845121ee"),
                            text = "foo or bar?",
                            required = true,
                            values = listOf("foo", "bar")
                        )
                    )
                )
            )

            conceptManagementApis.startConceptAssignment(
                conceptAssignment?.id.toString(),
                start = Clock.System.now().minus(1.hours),
                end = Clock.System.now().plus(1.hours)
            )

            authApis.createUserAndLogin()

            val candidature = candidatureApis.createCandidature(
                ConceptAssignmentId(conceptAssignment!!.id.toString())
            )

            candidatureApis.submitCandidature(
                candidatureId = candidature!!.id,
                expectedStatus = HttpStatusCode.PreconditionFailed
            )

            candidatureApis.editCandidature(
                candidatureId = candidature.id,
                request = EditCandidatureRequest(
                    description = FakeData.faker.lorem.supplemental(),
                    answers = mapOf(
                        QuestionId("25e80140-34aa-4778-a21c-b5b0845121ee") to "foo"
                    )
                )
            )

            candidatureApis.submitCandidature(
                candidatureId = candidature.id
            )
        }
    }

    "Attachments list is filtered when file upload questions exist" {
        withTestApplicationAndSetup {
            val questionId = QuestionId()

            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")
            val candidature = conceptManagementApis.createConceptWithCandidature(
                modConcept = {
                    val attachment = conceptManagementApis.attachData(it.id.toString(), "f.txt", "text/plain")!!.attachments.single()
                    conceptManagementApis.updateConceptAssignmentQuestions(
                        it.id.toString(),
                        CandidatureQuestions(
                            listOf(
                                FileUploadQuestion(
                                    id = questionId,
                                    text = "file",
                                    required = true,
                                    description = "yolo",
                                    attachmentMetadata = attachment
                                )
                            )
                        )
                    )
                },
                modCandidature = {
                    candidatureApis.addAttachmentAsCandidate(it.id, "show-as-normal-attachment.txt", "fkbr")

                    val attachment = candidatureApis.addAttachmentAsCandidate(it.id, "do-not-show-as-normal-attachment.txt", "lol")
                    candidatureApis.editCandidature(
                        it.id,
                        EditCandidatureRequest(
                            description = "edited",
                            answers = mapOf(
                                questionId to KtorJson.encodeToString(attachment)
                            )
                        )
                    )
                }
            )

            val candidatureAsCandidate = candidatureApis.getCandidatureAsCandidate(candidature.id)
            candidatureAsCandidate!!.candidatureWithAttachments.attachments.single().name shouldBe "show-as-normal-attachment.txt"

            authApis.loginAsProjectGroup()

            val candidatureAsAdmin = candidatureApis.getCandidatureAsAdmin(candidature.id.value)
            candidatureAsAdmin!!.details.candidatureWithAttachments.attachments.single().name shouldBe "show-as-normal-attachment.txt"
        }
    }

    "Can copy description and attachments for existing candidature" {
        withTestApplicationAndSetup {
            val questionId = QuestionId()

            val userAuth = authApis.createUserAndLogin()

            val from = conceptManagementApis.createConceptWithCandidature(
                auth = userAuth,
                modConcept = {
                    val attachment = conceptManagementApis.attachData(it.id.toString(), "f.txt", "text/plain")!!.attachments.single()
                    conceptManagementApis.updateConceptAssignmentQuestions(
                        it.id.toString(),
                        CandidatureQuestions(
                            listOf(
                                FileUploadQuestion(
                                    id = questionId,
                                    text = "file",
                                    required = true,
                                    description = "yolo",
                                    attachmentMetadata = attachment
                                )
                            )
                        )
                    )
                },
                modCandidature = {
                    candidatureApis.addAttachmentAsCandidate(it.id, "show-as-normal-attachment.txt", "fkbr")

                    val attachment = candidatureApis.addAttachmentAsCandidate(it.id, "do-not-show-as-normal-attachment.txt", "lol")
                    candidatureApis.editCandidature(
                        it.id,
                        EditCandidatureRequest(
                            description = "lol description",
                            answers = mapOf(
                                questionId to KtorJson.encodeToString(attachment)
                            )
                        )
                    )
                }
            )

            authApis.loginAsProjectGroup()

            val newConceptAssignment = conceptManagementApis.createConceptAssignment(
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
                newConceptAssignment?.id.toString(),
                start = Clock.System.now().minus(1.hours),
                end = Clock.System.now().plus(1.hours)
            )

            authApis.logInAs(userAuth.email, userAuth.password)

            val to = candidatureApis.createCandidature(
                ConceptAssignmentId(newConceptAssignment!!.id.toString())
            )

            val candidatureBeforeCopy = candidatureApis.getCandidatureAsCandidate(to!!.id)!!

            candidatureBeforeCopy.candidatureWithAttachments.candidature.description shouldBe ""
            candidatureBeforeCopy.candidatureWithAttachments.attachments.size shouldBe 0

            candidatureApis.copyCandidature(
                from.id,
                to.id
            )

            val candidatureAfterCopy = candidatureApis.getCandidatureAsCandidate(to.id)!!

            candidatureAfterCopy.candidatureWithAttachments.candidature.description shouldBe "lol description"
            candidatureAfterCopy.candidatureWithAttachments.attachments.size shouldBe 1
            candidatureAfterCopy.candidatureWithAttachments.attachments.first().name shouldBe "show-as-normal-attachment.txt"

            val content = candidatureApis.downloadAttachment(
                candidatureId = candidatureAfterCopy.candidatureWithAttachments.candidature.id,
                attachmentId = AttachmentId(candidatureAfterCopy.candidatureWithAttachments.attachments.first().id)
            )

            content shouldBe "fkbr"
        }
    }
})
