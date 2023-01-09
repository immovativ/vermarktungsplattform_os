package de.immovativ.vermarktungsplattform.model.messaging

@kotlinx.serialization.Serializable
data class MessageRequest(
    val contents: String
)
