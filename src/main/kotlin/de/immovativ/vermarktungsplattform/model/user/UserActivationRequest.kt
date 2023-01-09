package de.immovativ.vermarktungsplattform.model.user

import kotlinx.serialization.Serializable

@Serializable
data class UserActivationRequest(
    val password: String,
    val token: String
)
