package de.immovativ.vermarktungsplattform.model.dashboard

import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import kotlinx.datetime.Instant

@kotlinx.serialization.Serializable
data class DashboardPublicationStartStop(
    val startOrStop: Instant,
    val id: String
)

@kotlinx.serialization.Serializable
data class AdminDashboard(
    val assignmentsByState: Map<ConceptAssignmentState, Long>,
    val nextPublication: DashboardPublicationStartStop?,
    val nextFinish: DashboardPublicationStartStop?,
    val candidaturesInReview: Long,
    val candidaturesOnActiveAssignments: Long

)
