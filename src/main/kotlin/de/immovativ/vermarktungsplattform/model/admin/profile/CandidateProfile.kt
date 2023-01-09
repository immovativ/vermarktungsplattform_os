package de.immovativ.vermarktungsplattform.model.admin.profile

import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.user.UserData
import kotlinx.datetime.Instant

@kotlinx.serialization.Serializable
data class ProfileCandidature(
    val id: CandidatureId,
    val conceptName: String,
    val conceptId: String,
    val state: CandidatureState,
    val updatedAt: Instant,
    val buildingType: BuildingType
)

@kotlinx.serialization.Serializable
data class CandidateProfile(
    val email: String,
    val userData: UserData,
    val candidatures: List<ProfileCandidature>
)
