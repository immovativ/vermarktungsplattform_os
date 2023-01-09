package de.immovativ.vermarktungsplattform

import de.immovativ.vermarktungsplattform.model.candidature.CandidatureWithDetails
import de.immovativ.vermarktungsplattform.model.candidature.EditCandidatureRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.AdminConceptAssignment
import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidatureQuestions
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptDetails
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.conceptassignment.UpdateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.messaging.MessageRequest
import de.immovativ.vermarktungsplattform.model.question.EnumQuestion
import de.immovativ.vermarktungsplattform.model.question.FileUploadQuestion
import de.immovativ.vermarktungsplattform.model.question.FreeTextQuestion
import de.immovativ.vermarktungsplattform.model.question.IntRangeQuestion
import de.immovativ.vermarktungsplattform.model.question.PercentQuestion
import de.immovativ.vermarktungsplattform.model.question.Question
import de.immovativ.vermarktungsplattform.model.question.QuestionId
import de.immovativ.vermarktungsplattform.model.question.Range
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentType
import de.immovativ.vermarktungsplattform.repository.ConstructionSitesRepository
import de.immovativ.vermarktungsplattform.repository.ParcelsRepository
import de.immovativ.vermarktungsplattform.service.ConstructionSiteImportService
import de.immovativ.vermarktungsplattform.service.ParcelImportService
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.TestBase
import io.ktor.client.call.body
import io.ktor.http.HttpMethod
import kotlinx.datetime.Clock
import kotlinx.serialization.encodeToString
import org.kodein.di.instance
import kotlin.random.Random
import kotlin.time.Duration.Companion.hours

enum class TargetState {
    REVIEW,
    DRAFT,
    ACTIVE
}

object TestDataGenerator {
    @JvmStatic
    fun main(args: Array<String>) {
        withTestApplicationAndSetup { di ->

            val constructionSitesRepository by di.instance<ConstructionSitesRepository>()
            val constructionSiteImportService = ConstructionSiteImportService(constructionSitesRepository, cookieClient)

            val parcelsRepository by di.instance<ParcelsRepository>()
            val parcelImportService = ParcelImportService(parcelsRepository, constructionSitesRepository, cookieClient)

            constructionSiteImportService.importFromLocal()
            parcelImportService.importFromLocal()

            publishConcept(
                name = "Ankerprojekt Baufeld 1.3",
                buildingType = BuildingType.MGW,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "3",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 4,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.ACTIVE
            )
            publishConcept(
                name = "Ankerprojekt Baufeld 1.1",
                buildingType = BuildingType.MGW,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "1",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 4,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.ACTIVE
            )
            publishConcept(
                name = "Ankerprojekt Baufeld 1.17",
                buildingType = BuildingType.MGW,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "17",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 4,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.ACTIVE
            )

            publishConcept(
                name = "Baufeld 1.5 Anliegerwohnung 1",
                buildingType = BuildingType.KGW,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "5",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 3,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.ACTIVE,
                conceptAssignmentType = ConceptAssignmentType.ANCHOR
            )
            publishConcept(
                name = "Baufeld 1.5 Anliegerwohnung 2",
                buildingType = BuildingType.GGW,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "2",
                        constructionSiteId = "5",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 3,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.ACTIVE,
                conceptAssignmentType = ConceptAssignmentType.ANCHOR
            )
            publishConcept(
                name = "Baufeld 1.5 Anliegerwohnung 3",
                buildingType = BuildingType.GGW,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "3",
                        constructionSiteId = "5",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 3,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.DRAFT,
                conceptAssignmentType = ConceptAssignmentType.ANCHOR
            )
            publishConcept(
                name = "Ankerprojekt Baufeld 1.15",
                buildingType = BuildingType.GTH,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "15",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 2,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.DRAFT
            )
            publishConcept(
                name = "Ankerprojekt Baufeld 1.14",
                buildingType = BuildingType.GTH,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "14",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 2,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.ACTIVE
            )
            publishConcept(
                name = "Ankerprojekt Baufeld 1.28",
                buildingType = BuildingType.KTH,
                parcelRefs = listOf(
                    ParcelRef(
                        parcelId = "1",
                        constructionSiteId = "28",
                        constructionAreaId = "1"
                    )
                ),
                allowedFloors = 2,
                allowedHeight = Random.nextDouble(10.0, 100.0),
                ts = TargetState.REVIEW
            )
        }
    }

    private suspend fun TestBase.publishConcept(
        name: String,
        buildingType: BuildingType,
        parcelRefs: List<ParcelRef>,
        allowedFloors: Int,
        allowedHeight: Double,
        ts: TargetState,
        conceptAssignmentType: ConceptAssignmentType = ConceptAssignmentType.ANLIEGER
    ): AdminConceptAssignment {
        authApis.loginAsProjectGroup()
        val conceptAssignment = conceptManagementApis.createConceptAssignment(
            CreateConceptAssignmentRequest(
                name = name,
                parcelRefs = parcelRefs,
                buildingType = buildingType,
                conceptAssignmentType = conceptAssignmentType
            )
        )!!
        conceptManagementApis.updateConceptAssignment(
            conceptAssignment.id.toString(),
            UpdateConceptAssignmentRequest(
                ConceptDetails(
                    buildingType = buildingType,
                    allowedFloors = allowedFloors,
                    allowedBuildingHeightMeters = allowedHeight,
                    energyText = null
                )
            )
        )
        repeat(Random.nextInt(0, 3)) {
            conceptManagementApis.attachData(
                conceptAssignment.id.toString(),
                "${faker.adjective.positive()}.${faker.file.extension()}"
            )
        }

        conceptManagementApis.addPreviewImage(conceptAssignment.id.toString())

        val attachmentMeta =
            conceptManagementApis.attachData(conceptAssignment.id.toString(), "Berechnung_Graue_Energie.xls")!!
        val questions = listOf(
            IntRangeQuestion(
                id = QuestionId(),
                text = "Wie viele Wohneinheiten sieht Ihr Konzept vor?",
                range = Range(0, 100),
                required = true
            ),
            FreeTextQuestion(
                id = QuestionId(),
                text = "Wie hoch wird ihr geplantes Gebäude?",
                required = true
            ),
            FreeTextQuestion(
                id = QuestionId(),
                text = "Welchen energetischen Gebäudestandard halten Sie ein?",
                required = true
            ),
            PercentQuestion(
                id = QuestionId(),
                text = "Wie viel Prozent ihrer Dachfläche wird mit PV-Modulen ausgestattet?",
                required = true
            ),
            EnumQuestion(
                id = QuestionId(),
                text = "Planen Sie, die Fassade zu begrünen?",
                required = true,
                values = listOf("Ja", "Nein")
            ),
            EnumQuestion(
                id = QuestionId(),
                text = "Planen Sie, als wesentlichen Baustoff Holz zu verwenden??",
                required = true,
                values = listOf("Ja", "Nein")
            ),
            FileUploadQuestion(
                id = QuestionId(),
                text = "Bitte füllen Sie den Fragebogen zur grauen Energie aus und laden diesen hier hoch.",
                required = true,
                attachmentMetadata = attachmentMeta.attachments[0]
            ),
            FileUploadQuestion(
                id = QuestionId(),
                text = "Sollten Sie bereits über eine 3D-Planung ihres Gebäudes verfügen, so laden Sie diese bitte hier hoch. ",
                required = false
            )
        )
        conceptManagementApis.updateConceptAssignmentQuestions(
            conceptAssignment.id.toString(),
            CandidatureQuestions(questions)
        )

        if (ts != TargetState.DRAFT) {
            conceptManagementApis.startConceptAssignment(
                conceptAssignment.id.toString(),
                start = Clock.System.now().minus(Random.nextInt(50, 356).hours),
                end = if (ts == TargetState.REVIEW) Clock.System.now()
                    .minus(Random.nextInt(1, 24).hours) else Clock.System.now()
                    .plus(Random.nextInt(8, 356).hours)
            )

            repeat(Random.nextInt(2, 15)) {
                applyAsCandidate(conceptAssignment, questions)
            }

            if (ts == TargetState.REVIEW) {
                authApis.loginAsProjectGroup()
                conceptManagementApis.finishConceptAssignmentManually(conceptAssignment.id.toString())
            }
        }
        return conceptAssignment
    }

    private suspend fun TestBase.applyAsCandidate(
        conceptAssignment: AdminConceptAssignment,
        questions: List<Question>
    ) {
        authApis.createUserAndLogin()

        candidatureApis.createCandidature(
            ConceptAssignmentId(conceptAssignment.id.toString())
        )

        val candidaturesResponse = makeRequest(HttpMethod.Get, "/api/candidate/candidatures")
        val candidatureWithDetails: List<CandidatureWithDetails> = candidaturesResponse.body()

        val answers: Map<QuestionId, String> = questions.associate {
            when (it) {
                is EnumQuestion -> it.id to it.values.random().toString()
                is PercentQuestion -> it.id to "%.2f".format(Random.nextDouble())
                is FreeTextQuestion -> it.id to faker.hitchhikersGuideToTheGalaxy.quotes()
                is IntRangeQuestion -> it.id to Random.nextInt(it.range.start, it.range.endInclusive).toString()
                is FileUploadQuestion -> {
                    val uploadedMeta = candidatureApis.addAttachmentAsCandidate(
                        candidatureWithDetails.first().id,
                        "${faker.commerce.productName().replace(" ", "_")}.${faker.file.extension()}",
                        "contents"
                    )
                    it.id to KtorJson.encodeToString(uploadedMeta)
                }
            }
        }

        candidatureApis.editCandidature(
            candidatureWithDetails.first().id,
            EditCandidatureRequest(
                description = "Bewerbung \nDies ist die Beschreibung",
                answers = answers
            )
        )

        repeat(Random.nextInt(0, 3)) {
            candidatureApis.addAttachmentAsCandidate(
                candidatureWithDetails.first().id,
                "${faker.commerce.productName().replace(" ", "_")}.${faker.file.extension()}",
                "contents"
            )
        }

        candidatureApis.submitCandidature(
            candidatureId = candidatureWithDetails.first().id
        )

        if (Random.nextInt(0, 100) > 80) {
            repeat(Random.nextInt(1, 3)) {
                messagingApis.writeMessageAsCandidate(
                    candidatureWithDetails.first().id,
                    MessageRequest(
                        faker.hitchhikersGuideToTheGalaxy.quotes()
                    )
                )
            }

            // 50% chance to add attachment
            if (Random.nextInt(0, 100) > 50) {
                messagingApis.addMessageAttachmentAsCandidate(
                    candidatureId = candidatureWithDetails.first().id,
                    attachmentName = "${faker.construction.materials().replace(" ", "_")}.${faker.file.extension()}",
                    content = "this is the content"
                )
            }

            // maybe mark read + respond as admin
            if (Random.nextInt(0, 100) > 80) {
                authApis.loginAsProjectGroup()
                messagingApis.markReadAsAdmin(candidatureWithDetails.first().id)
                messagingApis.writeMessageAsAdmin(
                    candidatureWithDetails.first().id,
                    MessageRequest(
                        faker.greekPhilosophers.quotes()
                    )
                )
            }
        }
    }
}
