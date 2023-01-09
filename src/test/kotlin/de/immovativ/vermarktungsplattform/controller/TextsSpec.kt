package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode

class TextsSpec : StringSpec({
    "Non existent text should yield an empty string" {
        withTestApplicationAndSetup {
            val nonExistentTextResponse = makeRequest(HttpMethod.Get, "/api/texts/fkbr")

            nonExistentTextResponse shouldHaveStatus HttpStatusCode.OK
            nonExistentTextResponse.bodyAsText() shouldBe """"""""
        }
    }

    "Update AGB and get it back" {
        withTestApplicationAndSetup {
            authApis.loginAsConsulting()

            val updateRequest = makeRequest(HttpMethod.Put, "/api/texts/termsAndConditions") {
                setBody("Dies ist die neue AGB")
            }

            updateRequest shouldHaveStatus HttpStatusCode.OK

            val updatedRequest = makeRequest(HttpMethod.Get, "/api/texts/termsAndConditions")
            updatedRequest shouldHaveStatus HttpStatusCode.OK
            updatedRequest.bodyAsText() shouldBe """"Dies ist die neue AGB""""
        }
    }

    "Strips malicious code from AGB" {
        withTestApplicationAndSetup {
            authApis.loginAsConsulting()

            val updateRequest = makeRequest(HttpMethod.Put, "/api/texts/termsAndConditions") {
                setBody(
                    """
                    <h1>Dies ist die neue AGB</h1>
                    <script>alert(1)</script>
                    """.trimIndent()
                )
            }

            updateRequest shouldHaveStatus HttpStatusCode.OK

            val updatedRequest = makeRequest(HttpMethod.Get, "/api/texts/termsAndConditions")
            updatedRequest shouldHaveStatus HttpStatusCode.OK
            updatedRequest.bodyAsText().trim() shouldBe """"<h1>Dies ist die neue AGB</h1>\n""""
        }
    }
})
