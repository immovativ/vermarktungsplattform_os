package de.immovativ.vermarktungsplattform.model.user

sealed class ActivationResult {
    object Expired : ActivationResult()
    object WrongToken : ActivationResult()
    data class Successful(val email: String) : ActivationResult()
}
