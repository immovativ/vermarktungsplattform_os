package de.immovativ.vermarktungsplattform.model.candidature.admin

import kotlinx.datetime.Instant

@kotlinx.serialization.Serializable
data class AdminCommentRequest(val text: String?)

@kotlinx.serialization.Serializable
data class AdminComment(val text: String?, val updated: Instant?)
