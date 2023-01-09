package de.immovativ.vermarktungsplattform.model.user

import kotlinx.datetime.Instant

data class PasswordReset(
    val email: String,
    val token: String,
    val createdAt: Instant
)
data class MaybePasswordReset(
    val email: String,
    val token: String?,
    val createdAt: Instant?,
    val role: UserRole,
    val name: String
)

data class PasswordResetData(
    val email: String,
    val token: String,
    val role: UserRole,
    val name: String
)
