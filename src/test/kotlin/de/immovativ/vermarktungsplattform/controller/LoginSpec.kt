package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.login.LoginRequest
import de.immovativ.vermarktungsplattform.model.user.UserRole
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.jwtVerifier
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.projectGroupEmail
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.projectGroupPassword
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.booleans.shouldBeTrue
import io.kotest.matchers.comparables.shouldBeLessThan
import io.kotest.matchers.nulls.shouldNotBeNull
import io.ktor.client.request.accept
import io.ktor.client.request.header
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.setCookie
import kotlinx.coroutines.delay

class LoginSpec : StringSpec({

    "Respond with bad request upon login with wrong body" {
        withTestApplicationAndSetup {
            val response = makeRequest(HttpMethod.Post, "/api/login") {
                contentType(ContentType.Application.Json)
                setBody("{}")
            }
            response shouldHaveStatus HttpStatusCode.BadRequest
        }
    }
    "Refuse login with wrong password" {
        withTestApplicationAndSetup {
            val response = makeRequest(HttpMethod.Post, "/api/login") {
                contentType(ContentType.Application.Json)
                accept(ContentType.Application.Json)
                setBody(
                    LoginRequest(
                        email = "projekt@dietenbach.de",
                        password = "falsch"
                    )
                )
            }
            response shouldHaveStatus HttpStatusCode.Forbidden
        }
    }

    "Refuse login with not existing user" {
        withTestApplicationAndSetup {
            val response = makeRequest(HttpMethod.Post, "/api/login") {
                contentType(ContentType.Application.Json)
                accept(ContentType.Application.Json)
                setBody(
                    LoginRequest(
                        email = "test@immovativ.de",
                        password = "irgendwas"
                    )
                )
            }
            response shouldHaveStatus HttpStatusCode.Forbidden
        }
    }

    "project user authorization refresh works" {
        withTestApplicationAndSetup {
            val loginResponse = authApis.loginAsProjectGroup().loginResponse
            loginResponse shouldHaveStatus HttpStatusCode.OK
            loginResponse.setCookie().find { it.name == "vmp_auth" }!!.value.shouldNotBeNull()
            val oldJwtBearer = loginResponse.setCookie().find { it.name == "vmp_auth" }!!.value
            val oldDecoded = jwtVerifier.verify(oldJwtBearer.removePrefix("bearer=%23s"))

            // Sleep for 1 second
            delay(1_000)

            val refreshResponse = makeRequest(HttpMethod.Get, "/api/authorization/refresh")
            refreshResponse shouldHaveStatus HttpStatusCode.NoContent
            val jwtBearer = refreshResponse.setCookie().find { it.name == "vmp_auth" }!!.value
            val decoded = jwtVerifier.verify(jwtBearer.removePrefix("bearer=%23s"))

            oldDecoded.expiresAt.shouldBeLessThan(decoded.expiresAt)
        }
    }

    "consulting authorization refresh works" {

        withTestApplicationAndSetup {

            val loggedIn = authApis.loginAsConsulting()
            val oldJwtBearer = loggedIn.loginResponse.setCookie().find { it.name == "vmp_auth" }!!.value
            val oldDecoded = jwtVerifier.verify(oldJwtBearer.removePrefix("bearer=%23s"))

            // Sleep for 1 second
            delay(1_000)

            val refreshResponse = makeRequest(HttpMethod.Get, "/api/authorization/refresh")
            refreshResponse shouldHaveStatus HttpStatusCode.NoContent
            val jwtBearer = refreshResponse.setCookie().find { it.name == "vmp_auth" }!!.value
            val decoded = jwtVerifier.verify(jwtBearer.removePrefix("bearer=%23s"))

            oldDecoded.expiresAt.shouldBeLessThan(decoded.expiresAt)
        }
    }

    "candidate authorization refresh works" {

        withTestApplicationAndSetup {

            val loggedIn = authApis.loginAsCandidate()
            val oldJwtBearer = loggedIn.loginResponse.setCookie().find { it.name == "vmp_auth" }!!.value
            val oldDecoded = jwtVerifier.verify(oldJwtBearer.removePrefix("bearer=%23s"))

            // Sleep for 1 second
            delay(1_000)

            val refreshResponse = makeRequest(HttpMethod.Get, "/api/authorization/refresh")
            refreshResponse shouldHaveStatus HttpStatusCode.NoContent
            val jwtBearer = refreshResponse.setCookie().find { it.name == "vmp_auth" }!!.value
            val decoded = jwtVerifier.verify(jwtBearer.removePrefix("bearer=%23s"))

            oldDecoded.expiresAt.shouldBeLessThan(decoded.expiresAt)
        }
    }

    "Update project group password" {
        withTestApplicationAndSetup {
            val user = this.authApis.createUserAndLogin(UserRole.PROJECT_GROUP)

            personalDataManagementApis.updatePassword(user.password, "t3lEtuBb135!")

            authApis.attemptLogin(user.email, user.password, HttpStatusCode.Forbidden)
            authApis.attemptLogin(user.email, "t3lEtuBb135!", HttpStatusCode.OK)
        }
    }
    "Update candidate password" {
        withTestApplicationAndSetup {
            val user = this.authApis.createUserAndLogin(UserRole.CANDIDATE)

            personalDataManagementApis.updatePassword(user.password, "t3lEtuBb135!")

            authApis.attemptLogin(user.email, user.password, HttpStatusCode.Forbidden)
            authApis.attemptLogin(user.email, "t3lEtuBb135!", HttpStatusCode.OK)
        }
    }
    "Update consulting password" {
        withTestApplicationAndSetup {
            val user = authApis.createUserAndLogin(UserRole.CONSULTING)

            personalDataManagementApis.updatePassword(user.password, "t3lEtuBb135!")

            authApis.attemptLogin(user.email, user.password, HttpStatusCode.Forbidden)
            authApis.attemptLogin(user.email, "t3lEtuBb135!", HttpStatusCode.OK)
        }
    }

    "prevent password change when not logged in" {
        withTestApplicationAndSetup {
            personalDataManagementApis.updatePassword("current", "t3lEtuBb135!", expectStatus = HttpStatusCode.Forbidden)
        }
    }

    "prevent password change when wrong password used" {
        withTestApplicationAndSetup {
            val user = authApis.loginAsProjectGroup()

            personalDataManagementApis.updatePassword("wrong_password", "t3lEtuBb135!", expectStatus = HttpStatusCode.Forbidden)

            authApis.attemptLogin(user.email, user.password, HttpStatusCode.OK)
            authApis.attemptLogin(user.email, "wrong_password", HttpStatusCode.Forbidden)
        }
    }

    "Login with secure cookie behind reverse proxy" {
        withTestApplicationAndSetup(configFileName = "application-with-secure-cookie.conf") {
            val loginResponse = makeRequest(HttpMethod.Post, "/api/login") {
                contentType(ContentType.Application.Json)
                accept(ContentType.Application.Json)
                // without this header, the request would blow up
                header(HttpHeaders.XForwardedProto, "https")
                setBody(
                    LoginRequest(
                        email = projectGroupEmail,
                        password = projectGroupPassword
                    )
                )
            }
            loginResponse shouldHaveStatus HttpStatusCode.OK
            val cookie = loginResponse.setCookie().find { it.name == "vmp_auth" }!!
            cookie.secure.shouldBeTrue()
        }
    }
})
