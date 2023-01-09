package de.immovativ.vermarktungsplattform.model.user

import kotlinx.serialization.Serializable

@Serializable
data class UpdatePersonalDataRequest(
    val name: String
)
