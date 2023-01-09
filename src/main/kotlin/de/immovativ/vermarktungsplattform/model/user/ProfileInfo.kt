package de.immovativ.vermarktungsplattform.model.user

import kotlinx.datetime.Instant

@kotlinx.serialization.Serializable
data class ProfileInfo(
    val id: String,
    val email: String,
    val name: String,
    val lastLogin: Instant?,
    val lastModified: Instant
)
