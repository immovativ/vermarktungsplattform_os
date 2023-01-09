package de.immovativ.vermarktungsplattform.model.user

import kotlinx.serialization.Serializable

@Serializable
data class PasswordChangeRequest(
    val currentPassword: String,
    val newPassword: String
)
