package de.immovativ.vermarktungsplattform.model.attachment

@kotlinx.serialization.Serializable
data class AttachmentMetadata(
    val id: String, // also == s3 key
    val name: String, // filename
    val contentType: String
)
