package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.KtorJson
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithDetails
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminCommentRequest
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRating
import de.immovativ.vermarktungsplattform.model.candidature.admin.AdminRatingRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.question.FileUploadQuestion
import de.immovativ.vermarktungsplattform.model.question.IntRangeQuestion
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.model.question.Range
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.mailhogClient
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.collections.shouldContainInOrder
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.ktor.client.call.body
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import kotlinx.serialization.encodeToString
import org.awaitility.Durations
import org.awaitility.kotlin.await
import org.awaitility.kotlin.withPollInterval
import java.time.Duration

class CandidatureOutcomeSpec : StringSpec({
    "Reject candidatures" {
        withTestApplicationAndSetup {
            val candidature = conceptManagementApis.createConceptWithCandidature()
            authApis.loginAsProjectGroup()
            val view = candidatureApis.getCandidatureAsAdmin(candidature.id.value)!!

            // frist not yet done
            view.reject(HttpStatusCode.FailedDependency)

            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            conceptManagementApis.listConceptsAsAdmin("REVIEW").map { hit ->
                "${hit.assignment.name}-u${hit.undecidedCandidatures}-t${hit.candidatures}"
            }.shouldContainInOrder("foo-u1-t1")

            val afterReject = view.reject()!!
            afterReject.details.candidatureWithAttachments.candidature.state.shouldBe(CandidatureState.REJECTED)
            afterReject.details.conceptAssignmentWithAttachments.assignment.state.shouldBe(ConceptAssignmentState.REVIEW)

            conceptManagementApis.listConceptsAsAdmin("REVIEW").map { hit ->
                "${hit.assignment.name}-u${hit.undecidedCandidatures}-t${hit.candidatures}"
            }.shouldContainInOrder("foo-u0-t1")
        }
    }

    "Accept candidature rejects others" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-jobs.conf") {
            val firstCandidateAuth = authApis.createUserAndLogin(email = "c1@dietenbach.de")
            val candidature = conceptManagementApis.createConceptWithCandidature(auth = firstCandidateAuth)
            authApis.createUserAndLogin(email = "c2@dietenbach.de")

            candidatureApis.createCandidature(
                ConceptAssignmentId(candidature.conceptDetails.id.toString())
            )

            val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")

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

            // frist not yet done
            view.grant(HttpStatusCode.FailedDependency)

            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            conceptManagementApis.listConceptsAsAdmin("REVIEW").map { hit ->
                "${hit.assignment.name}-u${hit.undecidedCandidatures}-t${hit.candidatures}"
            }.shouldContainInOrder("foo-u2-t2")

            val afterGrant = view.grant()!!
            afterGrant.details.candidatureWithAttachments.candidature.state.shouldBe(CandidatureState.ACCEPTED)
            afterGrant.details.conceptAssignmentWithAttachments.assignment.state.shouldBe(ConceptAssignmentState.FINISHED)
            candidatureApis.getCandidatureAsAdmin(candidature.id.value)!!.details.candidatureWithAttachments.candidature.state.shouldBe(
                CandidatureState.REJECTED
            )

            conceptManagementApis.listConceptsAsAdmin("FINISHED").map { hit ->
                "${hit.assignment.name}-u${hit.undecidedCandidatures}-t${hit.candidatures}"
            }.shouldContainInOrder("foo-u0-t2")

            candidatureApis.getCandidatesAsAdmin()!!.also { cl ->
                cl.shouldHaveSize(3)
                cl.map { it.email to it.candidatures }.shouldContainExactlyInAnyOrder("c2@dietenbach.de" to 1L, "c1@dietenbach.de" to 1L, "bewerber@dietenbach.de" to 0L)
            }

            await.withPollInterval(Durations.ONE_HUNDRED_MILLISECONDS).atMost(Duration.ofSeconds(10L)).untilAsserted {
                mailhogClient.getMessages(
                    subject = "Ihre Bewerbung \"foo\" wurde abgelehnt!",
                    from = "noreply@vermarktungsplattform.de",
                    to = "c1@dietenbach.de"
                ) shouldHaveSize 1

                mailhogClient.getMessages(
                    subject = "Sie haben den Zuschlag zu Ihrer Bewerbung \"foo\" erhalten!",
                    from = "noreply@vermarktungsplattform.de",
                    to = "c2@dietenbach.de"
                ) shouldHaveSize 1
            }
        }
    }

    "comment on candidatures" {
        withTestApplicationAndSetup {
            val candidature = conceptManagementApis.createConceptWithCandidature()
            authApis.loginAsProjectGroup()
            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            candidatureApis.getCandidatureAsAdmin(candidature.id.value)!!
                .also { it.comment.shouldBeNull() }
                .comment(AdminCommentRequest(text = "Hallo i bims"))!!
                .also {
                    it.comment.shouldNotBeNull().also { c ->
                        c.text.shouldBe("Hallo i bims")
                        c.updated.shouldNotBeNull()
                    }
                }
                .comment(AdminCommentRequest(text = "habs mir anders ueberlegt"))!!
                .also {
                    it.comment.shouldNotBeNull().also { c ->
                        c.text.shouldBe("habs mir anders ueberlegt")
                        c.updated.shouldNotBeNull()
                    }
                }
        }
    }

    "can only rate 1-5" {
        withTestApplicationAndSetup {
            val candidature = conceptManagementApis.createConceptWithCandidature()
            authApis.loginAsProjectGroup()
            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            candidatureApis.getCandidatureAsAdmin(candidature.id.value)!!.also {
                it.rate(AdminRatingRequest(rating = AdminRating(0)), expectError = HttpStatusCode.BadRequest)
                it.rate(AdminRatingRequest(rating = AdminRating(6)), expectError = HttpStatusCode.BadRequest)
            }
        }
    }

    "rate candidatures" {
        withTestApplicationAndSetup {
            val candidature = conceptManagementApis.createConceptWithCandidature()
            authApis.loginAsProjectGroup()
            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            candidatureApis.getCandidatureAsAdmin(candidature.id.value)!!
                .also {
                    it.details.conceptAssignmentWithAttachments.candidatures.map { c -> c.rating?.value }
                        .shouldContainExactly(null)
                }
                .rate(AdminRatingRequest(rating = AdminRating(4)))!!
                .also {
                    it.details.conceptAssignmentWithAttachments.candidatures.map { c -> c.rating?.value }
                        .shouldContainExactly(4)
                }
                .rate(AdminRatingRequest(rating = AdminRating(2)))!!
                .also {
                    it.details.conceptAssignmentWithAttachments.candidatures.map { c -> c.rating?.value }
                        .shouldContainExactly(2)
                }
        }
    }

    "abort rejects all candidatures" {
        withTestApplicationAndSetup {
            val candidature = conceptManagementApis.createConceptWithCandidature()
            authApis.loginAsProjectGroup()
            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            conceptManagementApis.abortConceptAssignment(candidature.conceptDetails.id.toString())

            conceptManagementApis.getAssignmentAsAdmin(candidature.conceptDetails.id.toString())!!.also {
                it.assignment.state.shouldBe(ConceptAssignmentState.ABORTED)
                it.candidatures.map { c -> c.candidature.state }.shouldContainExactly(CandidatureState.REJECTED)
            }
        }
    }

    "abortAndDraft rejects all candidatures, creates a draft and moves the attachments" {
        withTestApplicationAndSetup {
            val fileQuestionId = "0a95fc59-7440-4ca5-a5b3-4fa1ac2cd635"
            val intQuestionId = "0ca19cc4-b1f2-44cd-8874-df42e5f3e952"
            val candidature = conceptManagementApis.createConceptWithCandidature(
                modConcept = {
                    val attachment =
                        conceptManagementApis.attachData(it.id.toString(), "f.txt", "text/plain")!!.attachments.single()
                    conceptManagementApis.updateConceptAssignmentQuestions(
                        it.id.toString(),
                        CandidatureQuestions(
                            listOf(
                                IntRangeQuestion(
                                    id = QuestionId(value = intQuestionId),
                                    text = "int",
                                    required = true,
                                    description = "kthxbye",
                                    range = Range(
                                        start = 1,
                                        endInclusive = 5
                                    )
                                ),
                                FileUploadQuestion(
                                    id = QuestionId(value = fileQuestionId),
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
                    val attachment = candidatureApis.addAttachmentAsCandidate(it.id, "submitted.txt", "lol")
                    candidatureApis.editCandidature(
                        it.id,
                        EditCandidatureRequest(
                            description = "edited",
                            answers = mapOf(
                                QuestionId(fileQuestionId) to KtorJson.encodeToString(attachment),
                                QuestionId(intQuestionId) to "3"
                            )
                        )
                    )
                }
            )
            authApis.loginAsProjectGroup()
            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            val draft = conceptManagementApis.abortAndDraftConceptAssignment(candidature.conceptDetails.id.toString())!!
            draft.assignment.id.shouldNotBe(candidature.conceptDetails.id)

            conceptManagementApis.getAssignmentAsAdmin(candidature.conceptDetails.id.toString())!!.also {
                it.assignment.state.shouldBe(ConceptAssignmentState.ABORTED)
                it.candidatures.map { c -> c.candidature.state }.shouldContainExactly(CandidatureState.REJECTED)
                it.attachments.shouldBeEmpty()
                it.assignment.questions!!.questions.map { q -> q.id.value }.shouldContainExactly(intQuestionId)
            }
            conceptManagementApis.getAssignmentAsAdmin(draft.assignment.id.toString())!!.also {
                it.assignment.state.shouldBe(ConceptAssignmentState.DRAFT)
                it.candidatures.shouldBeEmpty()
                it.assignment.questions!!.questions.map { q -> q.id.value }
                    .shouldContainExactlyInAnyOrder(intQuestionId, fileQuestionId)
                it.attachments.single().also { a ->
                    a.name.shouldBe("f.txt")
                    a.contentType.shouldBe("text/plain")
                }
            }
        }
    }

    "get candidate profile" {
        withTestApplicationAndSetup {
            val candidature = conceptManagementApis.createConceptWithCandidature()
            authApis.loginAsProjectGroup()
            conceptManagementApis.finishConceptAssignmentManually(candidature.conceptDetails.id.toString())

            conceptManagementApis.abortConceptAssignment(candidature.conceptDetails.id.toString())

            candidatureApis.getCandidateProfileAsAdmin(candidature.userId.value)!!.candidatures.single().also { c ->
                c.id.shouldBe(candidature.id)
                c.state.shouldBe(CandidatureState.REJECTED)
                c.conceptName.shouldBe("foo")
            }
        }
    }
})
