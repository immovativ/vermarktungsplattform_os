package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.conceptassignment.BuildingType
import de.immovativ.vermarktungsplattform.model.conceptassignment.CreateConceptAssignmentRequest
import de.immovativ.vermarktungsplattform.model.conceptassignment.ParcelRef
import de.immovativ.vermarktungsplattform.model.user.Salutation
import de.immovativ.vermarktungsplattform.model.user.UserAccountType
import de.immovativ.vermarktungsplattform.model.user.UserDataUpdateRequest
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.FakeData
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class UserSpec : StringSpec({
    "User creation works (with concept assignment)" {
        withTestApplicationAndSetup {
            authApis.loginAsProjectGroup()
            val constructionSite = constructionSiteFixtures.persistConstructionSite("1", "14")
            constructionSiteFixtures.persistParcel(constructionSite, "66")

            val conceptAssignment = conceptManagementApis.createConceptAssignment(
                CreateConceptAssignmentRequest(
                    name = "foo",
                    parcelRefs = listOf(
                        ParcelRef(
                            parcelId = "66",
                            constructionSiteId = "14",
                            constructionAreaId = "1"
                        )
                    ),
                    BuildingType.GGW
                )
            )

            authApis.createUserAndLogin(
                conceptAssignment!!.id
            )
        }
    }

    "User creation works (without concept assignment)" {
        withTestApplicationAndSetup {
            authApis.createUserAndLogin()
        }
    }

    "User can retrieve and update his user data" {
        withTestApplicationAndSetup {
            authApis.createUserAndLogin()

            val userData = personalDataManagementApis.getUserData()!!

            val newPhoneNumber = FakeData.faker.phoneNumber.phoneNumber()

            personalDataManagementApis.updateUserData(
                UserDataUpdateRequest(
                    accountType = UserAccountType.valueOf(userData.accountType),
                    company = userData.company,
                    salutation = Salutation.valueOf(userData.salutation),
                    street = userData.street,
                    houseNumber = userData.houseNumber,
                    zipCode = userData.zipCode,
                    city = userData.city,
                    firstName = userData.firstName,
                    lastName = userData.lastName,
                    phoneNumber = newPhoneNumber
                )
            )

            val updatedUserData = personalDataManagementApis.getUserData()!!

            updatedUserData.phoneNumber shouldBe newPhoneNumber
        }
    }
})
