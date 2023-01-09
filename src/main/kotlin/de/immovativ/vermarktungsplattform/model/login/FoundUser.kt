package de.immovativ.vermarktungsplattform.model.login

import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.model.user.UserStatus

data class FoundUser(
    val id: String,
    val email: String,
    val passwordHash: String,
    val role: UserRole,
    val status: UserStatus
)
