package de.immovativ.vermarktungsplattform.controller

import de.immovativ.vermarktungsplattform.model.login.LoginRequest
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withTestApplicationAndSetup
import de.immovativ.vermarktungsplattform.utils.ratelimit.Headers
import io.kotest.assertions.ktor.client.shouldHaveStatus
import io.kotest.core.spec.style.FreeSpec
import io.ktor.client.request.accept
import io.ktor.client.request.header
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType

class LoginRateLimitSpec : FreeSpec({

    "Don't rate limit when proxy header is broken" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-rate-limit.conf") {
            repeat(0.until(7).count()) {
                val response = makeRequest(HttpMethod.Post, "/api/login") {
                    contentType(ContentType.Application.Json)
                    accept(ContentType.Application.Json)
                    header("X-REAL-IP", "   ")
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
    }

    "Don't rate limit without real ip from proxy" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-rate-limit.conf") {
            repeat(0.until(7).count()) {
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
    }

    "rate limit with real ip (case insensitive) from proxy. Other ip works" - {
        listOf(Headers.X_REAL_IP, "X-ReAl-Ip").forEach { ipHeader ->
            "with header $ipHeader" - {
                withTestApplicationAndSetup(configFileName = "application-with-fast-rate-limit.conf") {
                    repeat(0.until(5).count()) {
                        makeRequest(HttpMethod.Post, "/api/login") {
                            contentType(ContentType.Application.Json)
                            accept(ContentType.Application.Json)
                            header(ipHeader, "192.168.1.1")
                            setBody(
                                LoginRequest(
                                    email = "projekt@dietenbach.de",
                                    password = "falsch"
                                )
                            )
                        }.shouldHaveStatus(HttpStatusCode.Forbidden)
                    }

                    makeRequest(HttpMethod.Post, "/api/login") {
                        contentType(ContentType.Application.Json)
                        accept(ContentType.Application.Json)
                        header(ipHeader, "192.168.1.1")
                        setBody(
                            LoginRequest(
                                email = "projekt@dietenbach.de",
                                password = "falsch"
                            )
                        )
                    }.shouldHaveStatus(HttpStatusCode.TooManyRequests)

                    makeRequest(HttpMethod.Post, "/api/login") {
                        contentType(ContentType.Application.Json)
                        accept(ContentType.Application.Json)
                        header(ipHeader, "8.8.8.8")
                        setBody(
                            LoginRequest(
                                email = "projekt@dietenbach.de",
                                password = "falsch"
                            )
                        )
                    }.shouldHaveStatus(HttpStatusCode.Forbidden)
                }
            }
        }
    }

    "Reset rate limit when successfully logging in" {
        withTestApplicationAndSetup(configFileName = "application-with-fast-rate-limit.conf") {
            repeat(0.until(4).count()) {
                makeRequest(HttpMethod.Post, "/api/login") {
                    contentType(ContentType.Application.Json)
                    header(Headers.X_REAL_IP, "192.168.1.1")
                    setBody(
                        LoginRequest(
                            email = "projekt@dietenbach.de",
                            password = "falsch"
                        )
                    )
                }.shouldHaveStatus(HttpStatusCode.Forbidden)
            }

            makeRequest(HttpMethod.Post, "/api/login") {
                contentType(ContentType.Application.Json)
                accept(ContentType.Application.Json)
                header(Headers.X_REAL_IP, "192.168.1.1")
                setBody(
                    LoginRequest(
                        email = "projekt@dietenbach.de",
                        password = "projekt"
                    )
                )
            }.shouldHaveStatus(HttpStatusCode.OK)

            repeat(0.until(2).count()) {
                makeRequest(HttpMethod.Post, "/api/login") {
                    contentType(ContentType.Application.Json)
                    accept(ContentType.Application.Json)
                    header(Headers.X_REAL_IP, "192.168.1.1")
                    setBody(
                        LoginRequest(
                            email = "projekt@dietenbach.de",
                            password = "falsch"
                        )
                    )
                }.shouldHaveStatus(HttpStatusCode.Forbidden)
            }
        }
    }
})
