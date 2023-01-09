package de.immovativ.vermarktungsplattform.model.login

import de.immovativ.vermarktungsplattform.model.user.UserRole

sealed class ExtendSessionResult {
    data class Proceed(val id: String, val email: String, val role: UserRole) : ExtendSessionResult()
    object Missing : ExtendSessionResult()
    object BlockedOrInactive : ExtendSessionResult()
}
