package de.immovativ.vermarktungsplattform.model.user

@kotlinx.serialization.Serializable
data class PasswordResetRequest(
    val email: String
)
