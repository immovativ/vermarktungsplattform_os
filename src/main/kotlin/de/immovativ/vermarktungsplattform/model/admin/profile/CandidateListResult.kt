package de.immovativ.vermarktungsplattform.model.admin.profile

import de.immovativ.vermarktungsplattform.model.user.UserId
import de.immovativ.vermarktungsplattform.model.user.UserStatus

@kotlinx.serialization.Serializable
data class CandidateListResult(
    val userId: UserId,
    val email: String,
    val company: String?,
    val firstName: String,
    val lastName: String,
    val street: String,
    val houseNumber: String,
    val zipCode: String,
    val city: String,
    val candidatures: Long,
    val userStatus: UserStatus
)
