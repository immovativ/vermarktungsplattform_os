package de.immovativ.vermarktungsplattform.model.user

import kotlinx.serialization.Serializable

enum class UserAccountType {
    COMPANY,
    PERSONAL
}

enum class Salutation {
    HERR,
    FRAU,
    DIVERS;
}

@Serializable
data class UserCreationRequest(
    val accountType: UserAccountType,
    val company: String? = null,
    val salutation: Salutation,
    val street: String,
    val houseNumber: String,
    val zipCode: String,
    val city: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String,
    val email: String,
    val tosAndPrivacyPolicyConsent: Boolean
) {
    init {
        if (accountType == UserAccountType.COMPANY) {
            require(!company.isNullOrBlank()) {
                "companyName must be set for company account type"
            }
        }

        require(tosAndPrivacyPolicyConsent) {
            "tosAndPrivacyPolicyConsent must be set to true"
        }
    }
}

@Serializable
data class DelegateCreationRequest(
    val accountType: UserAccountType,
    val company: String? = null,
    val salutation: Salutation,
    val street: String,
    val houseNumber: String,
    val zipCode: String,
    val city: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String,
    val email: String
) {
    init {
        if (accountType == UserAccountType.COMPANY) {
            require(!company.isNullOrBlank()) {
                "companyName must be set for company account type"
            }
        }
    }

    fun toUserCreationRequest() = UserCreationRequest(
        accountType = accountType,
        company = company,
        salutation = salutation,
        street = street,
        houseNumber = houseNumber,
        zipCode = zipCode,
        city = city,
        firstName = firstName,
        lastName = lastName,
        phoneNumber = phoneNumber,
        email = email,
        tosAndPrivacyPolicyConsent = true
    )
}
