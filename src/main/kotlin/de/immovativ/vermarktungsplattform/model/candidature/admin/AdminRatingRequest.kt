package de.immovativ.vermarktungsplattform.model.candidature.admin

@kotlinx.serialization.Serializable
@JvmInline
value class AdminRating(val value: Int)

@kotlinx.serialization.Serializable
data class AdminRatingRequest(val rating: AdminRating?) {
    fun isValid(): Boolean = rating
        ?.value
        ?.let {
            it in 1..5
        } ?: true
}
