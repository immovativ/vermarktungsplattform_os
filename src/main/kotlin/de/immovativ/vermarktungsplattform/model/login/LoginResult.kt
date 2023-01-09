package de.immovativ.vermarktungsplattform.model.login

import de.immovativ.vermarktungsplattform.model.user.UserRole

sealed class LoginResult {
    data class Proceed(val id: String, val email: String, val role: UserRole) : LoginResult()
    data class NotFound(val email: String) : LoginResult()
    data class WrongPw(val email: String) : LoginResult()
    object BlockedOrInactive : LoginResult()
}
