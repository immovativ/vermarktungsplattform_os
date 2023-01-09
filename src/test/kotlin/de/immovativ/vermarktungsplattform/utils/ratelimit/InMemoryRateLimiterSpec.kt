package de.immovativ.vermarktungsplattform.utils.ratelimit

import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.booleans.shouldBeFalse
import io.kotest.matchers.booleans.shouldBeTrue
import io.kotest.matchers.ints.shouldBeLessThan
import io.kotest.matchers.shouldBe
import java.time.Duration

class InMemoryRateLimiterSpec : FunSpec({
    test("rate limit requests") {
        val rateLimiter = InMemoryRateLimiter(mapPurgeSize = 10, mapPurgeWaitDuration = Duration.ZERO)

        repeat((0..99).count()) {
            val rate = rateLimiter.handle(RateLimitKey("foo"), maxRequests = 100, window = Duration.ofMinutes(5L))
            rate.shouldLimit().shouldBeFalse()
        }
        rateLimiter
            .handle(RateLimitKey("foo"), maxRequests = 100, window = Duration.ofMinutes(5L))
            .shouldLimit()
            .shouldBeTrue()

        rateLimiter
            .handle(RateLimitKey("bar"), maxRequests = 100, window = Duration.ofMinutes(5L))
            .shouldLimit()
            .shouldBeFalse()
    }

    test("expire rate limit explicitly") {
        val rateLimiter = InMemoryRateLimiter(mapPurgeSize = 10, mapPurgeWaitDuration = Duration.ZERO)

        repeat((0..99).count()) {
            val rate = rateLimiter.handle(RateLimitKey("foo"), maxRequests = 100, window = Duration.ofMinutes(5L))
            rate.shouldLimit().shouldBeFalse()
        }
        rateLimiter
            .handle(RateLimitKey("foo"), maxRequests = 100, window = Duration.ofMinutes(5L))
            .also { it.shouldLimit().shouldBeTrue() }

        rateLimiter
            .reset(RateLimitKey("foo"))

        rateLimiter
            .handle(RateLimitKey("foo"), maxRequests = 100, window = Duration.ofMinutes(5L))
            .shouldLimit().shouldBeFalse()
    }

    test("purge rate limit map") {
        val rateLimiter = InMemoryRateLimiter(mapPurgeSize = 5, mapPurgeWaitDuration = Duration.ZERO)

        repeat((0..99).count()) {
            rateLimiter
                .handle(RateLimitKey("foo-$it"), maxRequests = 100, window = Duration.ZERO)
                .shouldLimit().shouldBeFalse()
        }

        rateLimiter.size().shouldBeLessThan(20)
    }

    test("don't purge when wait duration not reached") {
        val rateLimiter = InMemoryRateLimiter(mapPurgeSize = 5, mapPurgeWaitDuration = Duration.ofHours(42L))

        repeat((0..99).count()) {
            rateLimiter
                .handle(RateLimitKey("foo-$it"), maxRequests = 100, window = Duration.ZERO)
                .shouldLimit().shouldBeFalse()
        }

        rateLimiter.size().shouldBe(100)
    }
})
