package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.question.EnumQuestion
import de.immovativ.vermarktungsplattform.model.question.IntRangeQuestion
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.model.question.Range
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.shouldBe
import io.ktor.http.HttpStatusCode
import kotlinx.datetime.Clock
import java.util.UUID
import kotlin.time.Duration.Companion.hours

class UpdateConceptAssignmentSpec : StringSpec({

    "Update questions freely" {
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
            conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!.assignment.questions.shouldBeNull()
            val submittedQuestions = CandidatureQuestions(
                listOf(
                    EnumQuestion(
                        id = QuestionId(value = UUID.randomUUID().toString()),
                        text = "enum",
                        required = false,
                        description = null,
                        values = listOf("foo", "bar")
                    ),
                    IntRangeQuestion(
                        id = QuestionId(value = UUID.randomUUID().toString()),
                        text = "wieviele etagen?",
                        required = true,
                        description = "da floors",
                        range = Range(
                            start = 1,
                            endInclusive = 10
                        )
                    )
                )
            )
            val updatedQuestions = conceptManagementApis.updateConceptAssignmentQuestions(
                created.id.toString(),
                submittedQuestions

            )!!.assignment.questions
            updatedQuestions.shouldBe(submittedQuestions)
            val retrievedQuestions = conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!.assignment.questions
            retrievedQuestions.shouldBe(submittedQuestions)

            conceptManagementApis.updateConceptAssignmentQuestions(
                created.id.toString(),
                CandidatureQuestions(listOf())
            )!!.assignment.questions!!.questions.shouldBeEmpty()
        }
    }

    "Prevent question update when not draft" {
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
            conceptManagementApis.getAssignmentAsAdmin(created.id.toString())!!.assignment.questions.shouldBeNull()
            val submittedQuestions = CandidatureQuestions(
                listOf(
                    EnumQuestion(
                        id = QuestionId(value = UUID.randomUUID().toString()),
                        text = "enum",
                        required = false,
                        description = null,
                        values = listOf("foo", "bar")
                    ),
                    IntRangeQuestion(
                        id = QuestionId(value = UUID.randomUUID().toString()),
                        text = "wieviele etagen?",
                        required = true,
                        description = "da floors",
                        range = Range(
                            start = 1,
                            endInclusive = 10
                        )
                    )
                )
            )
            conceptManagementApis.startConceptAssignment(created.id.toString(), Clock.System.now(), Clock.System.now().plus(10.hours))
            conceptManagementApis.updateConceptAssignmentQuestions(
                created.id.toString(),
                submittedQuestions,
                expectError = HttpStatusCode.FailedDependency

            )
        }
    }
})
