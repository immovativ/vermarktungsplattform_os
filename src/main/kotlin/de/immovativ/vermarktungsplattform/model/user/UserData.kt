package de.immovativ.vermarktungsplattform.model.user

import kotlinx.datetime.Instant

@kotlinx.serialization.Serializable
data class UserData(
    val userId: UserId,
    val accountType: String,
    val company: String? = null,
    val street: String,
    val houseNumber: String,
    val zipCode: String,
    val city: String,
    val salutation: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val userStatus: UserStatus? = null
)
