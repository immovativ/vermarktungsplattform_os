package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.repository.PasswordResetRepository
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.mailhogClient
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.ratelimit.Headers
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldNotBe
import io.ktor.client.request.header
import io.ktor.http.HttpStatusCode
import org.kodein.di.instance

class PasswordResetSpec : StringSpec({
    "Disclose no information when account does not exist" {
        withTestApplicationAndSetup {
            authApis.requestPwReset("me-no-existey@backoffice.de")
        }
    }

    "Rate limits after too many requests from same IP" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-rate-limit.conf") {
            repeat(2) {
                authApis.requestPwReset("me-no-existey@backoffice.de") {
                    header(Headers.X_REAL_IP, "192.168.1.1")
                }
            }
            authApis.requestPwReset("me-no-existey@backoffice.de", expectStatus = HttpStatusCode.TooManyRequests) {
                header(Headers.X_REAL_IP, "192.168.1.1")
            }

            authApis.requestPwReset("me-no-existey@backoffice.de", expectStatus = HttpStatusCode.OK) {
                header(Headers.X_REAL_IP, "8.8.8.8")
            }
        }
    }

    "No rate limit without IP" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-rate-limit.conf") {
            repeat(5) {
                authApis.requestPwReset("me-no-existey@backoffice.de")
            }
        }
    }

    "Reset when not expired does not reissue a token but resends the email with the previous token" {
        withTestApplicationAndSetup {
            authApis.createUserAndLogin(UserRole.PROJECT_GROUP, "temp@stadt.de")

            authApis.requestPwReset("temp@stadt.de")

            mailhogClient.getMessages(
                "Rücksetzen Ihres Passworts auf der Vermarktungsplattform Dietenbach",
                "noreply@vermarktungsplattform.de",
                "temp@stadt.de"
            ).shouldHaveSize(1)

            authApis.requestPwReset("temp@stadt.de", expectStatus = HttpStatusCode.OK)
            mailhogClient.getMessages(
                "Rücksetzen Ihres Passworts auf der Vermarktungsplattform Dietenbach",
                "noreply@vermarktungsplattform.de",
                "temp@stadt.de"
            )
                // 2 emails but same token
                .also { it.shouldHaveSize(2) }
                .map { it.extractToken() }.toSet().shouldHaveSize(1)
        }
    }

    "Reset when expired reissues a token and sends a mail" {
        withTestApplicationAndSetup {
            authApis.createUserAndLogin(UserRole.PROJECT_GROUP, "temp@stadt.de", "test")

            authApis.requestPwReset("temp@stadt.de")

            val token = mailhogClient.getMessage("temp@stadt.de").extractToken()

            val passwordResetRepository by it.instance<PasswordResetRepository>()
            passwordResetRepository.expireTokenForTesting(token)

            authApis.activateUser("temp@stadt.de", "nottest", HttpStatusCode.Forbidden)

            mailhogClient.deleteAllMessages()
            authApis.requestPwReset("temp@stadt.de", expectStatus = HttpStatusCode.OK)

            val newToken = mailhogClient.getMessage("temp@stadt.de").extractToken()
            newToken.shouldNotBe(token)

            authApis.activateUser("temp@stadt.de", "supernew", HttpStatusCode.OK)
            authApis.logInAs("temp@stadt.de", "supernew")
        }
    }
})
