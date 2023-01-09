package de.immovativ.vermarktungsplattform.model.attachment

import de.immovativ.vermarktungsplattform.utils.requireUUID
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@JvmInline
value class AttachmentId(val value: String = UUID.randomUUID().toString()) {
    init {
        requireUUID(value)
    }
}
