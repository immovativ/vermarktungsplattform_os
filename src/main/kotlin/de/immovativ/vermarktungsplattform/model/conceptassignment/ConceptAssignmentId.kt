package de.immovativ.vermarktungsplattform.model.conceptassignment

import de.immovativ.vermarktungsplattform.utils.requireUUID
import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class ConceptAssignmentId(val value: String) {
    init {
        requireUUID(value)
    }
}
