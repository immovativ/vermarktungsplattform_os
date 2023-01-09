package de.immovativ.vermarktungsplattform.model.user

import kotlinx.serialization.Serializable

@Serializable
data class UserDataUpdateRequest(
    val accountType: UserAccountType,
    val company: String? = null,
    val salutation: Salutation,
    val street: String,
    val houseNumber: String,
    val zipCode: String,
    val city: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String
) {
    init {
        if (accountType == UserAccountType.COMPANY) {
            require(!company.isNullOrBlank()) {
                "companyName must be set for company account type"
            }
        }
    }
}
