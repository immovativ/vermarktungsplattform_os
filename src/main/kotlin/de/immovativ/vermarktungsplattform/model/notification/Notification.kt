package de.immovativ.vermarktungsplattform.model.notification

data class Notification(
    val id: String,
    val recipient: String,
    val subject: String,
    val htmlText: String,
    val plainText: String
)
