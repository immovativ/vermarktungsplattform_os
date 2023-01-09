package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureState
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentState
import de.immovativ.vermarktungsplattform.model.dashboard.AdminDashboard
import de.immovativ.vermarktungsplattform.model.dashboard.DashboardPublicationStartStop
import de.immovativ.vermarktungsplattform.repository.CandidatureTable
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentTable
import mu.KLogging
import org.jetbrains.exposed.sql.Join
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.isNotNull
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.count
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class DashboardService() {
    companion object : KLogging()

    fun getAdminDashboard(): Either<Throwable, AdminDashboard> = Either.catch {
        transaction {
            val candidatures = Join(
                table = CandidatureTable,
                otherTable = ConceptAssignmentTable,
                joinType = JoinType.INNER,
                onColumn = CandidatureTable.conceptAssignmentId,
                otherColumn = ConceptAssignmentTable.id
            )

            val assignmentsByState = ConceptAssignmentTable
                .slice(ConceptAssignmentTable.id.count(), ConceptAssignmentTable.state)
                .selectAll()
                .groupBy(ConceptAssignmentTable.state).associate {
                    it[ConceptAssignmentTable.state] to it[ConceptAssignmentTable.id.count()]
                }
            AdminDashboard(
                assignmentsByState = assignmentsByState,
                nextPublication = ConceptAssignmentTable
                    .slice(ConceptAssignmentTable.assignmentStart, ConceptAssignmentTable.id)
                    .select(
                        ConceptAssignmentTable.state.eq(ConceptAssignmentState.WAITING)
                            .and(ConceptAssignmentTable.assignmentStart.isNotNull())
                    )
                    .orderBy(ConceptAssignmentTable.assignmentStart, SortOrder.ASC)
                    .limit(1).firstNotNullOfOrNull { row ->
                        row[ConceptAssignmentTable.assignmentStart]?.let {
                            DashboardPublicationStartStop(
                                startOrStop = it,
                                id = row[ConceptAssignmentTable.id]
                            )
                        }
                    },

                nextFinish = ConceptAssignmentTable
                    .slice(ConceptAssignmentTable.assignmentEnd, ConceptAssignmentTable.id)
                    .select(
                        ConceptAssignmentTable.state.eq(ConceptAssignmentState.ACTIVE)
                            .and(ConceptAssignmentTable.assignmentEnd.isNotNull())
                    )
                    .orderBy(ConceptAssignmentTable.assignmentEnd, SortOrder.ASC)
                    .limit(1).firstNotNullOfOrNull { row ->
                        row[ConceptAssignmentTable.assignmentEnd]?.let {
                            DashboardPublicationStartStop(
                                startOrStop = it,
                                id = row[ConceptAssignmentTable.id]
                            )
                        }
                    },
                candidaturesInReview = candidatures
                    .select {
                        ConceptAssignmentTable.state.eq(ConceptAssignmentState.REVIEW)
                            .and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
                    }
                    .count(),
                candidaturesOnActiveAssignments = candidatures
                    .select {
                        ConceptAssignmentTable.state.eq(ConceptAssignmentState.ACTIVE)
                            .and(CandidatureTable.state.eq(CandidatureState.SUBMITTED))
                    }
                    .count()
            )
        }
    }
}
