package de.immovativ.vermarktungsplattform.model.user

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: UserId,
    val name: String,
    val email: String,
    val passwordHash: String?,
    val salt: String?,
    val role: UserRole,
    val status: UserStatus,
    val createdAt: Instant,
    val updatedAt: Instant
)
