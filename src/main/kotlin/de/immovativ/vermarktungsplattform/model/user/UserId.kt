package de.immovativ.vermarktungsplattform.model.user

import de.immovativ.vermarktungsplattform.utils.requireUUID
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@JvmInline
value class UserId(val value: String = UUID.randomUUID().toString()) {
    init {
        requireUUID(value)
    }
}
sealed class ProvidedAuth {
    data class LoggedInUser(val id: UserId) : ProvidedAuth()
    object LoggedInAdmin : ProvidedAuth()
}
