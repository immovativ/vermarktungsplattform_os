package de.immovativ.vermarktungsplattform.model.question

import de.immovativ.vermarktungsplattform.utils.requireUUID
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@JvmInline
value class QuestionId(val value: String = UUID.randomUUID().toString()) {
    init {
        requireUUID(value)
    }
}
