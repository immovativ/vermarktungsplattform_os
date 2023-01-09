package de.immovativ.vermarktungsplattform.model.candidature

import de.immovativ.vermarktungsplattform.utils.requireUUID
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@JvmInline
value class CandidatureId(val value: String = UUID.randomUUID().toString()) {
    init {
        requireUUID(value)
    }
}
