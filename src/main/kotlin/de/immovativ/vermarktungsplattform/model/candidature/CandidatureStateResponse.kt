package de.immovativ.vermarktungsplattform.model.candidature

import kotlinx.serialization.Serializable

@Serializable
data class CandidatureStateResponse(
    val candidatureId: CandidatureId,
    val state: CandidatureState
)
