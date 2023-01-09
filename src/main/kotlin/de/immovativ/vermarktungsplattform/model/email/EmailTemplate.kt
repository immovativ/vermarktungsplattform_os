package de.immovativ.vermarktungsplattform.model.email

data class EmailTemplate(
    val subject: String,
    val plainText: String,
    val htmlText: String
)
