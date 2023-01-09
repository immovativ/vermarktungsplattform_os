package de.immovativ.vermarktungsplattform.model.candidature

import de.immovativ.vermarktungsplattform.model.question.QuestionId
import kotlinx.serialization.Serializable

@Serializable
data class EditCandidatureRequest(
    val description: String,
    val answers: Map<QuestionId, String>
)
