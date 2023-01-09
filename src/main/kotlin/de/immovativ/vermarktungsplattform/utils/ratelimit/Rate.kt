package de.immovativ.vermarktungsplattform.utils.ratelimit

import java.time.Instant

data class Rate(
    val remainingRequests: Long,
    val resetAt: Instant
)

fun Rate.hasExpired(): Boolean = resetAt < Instant.now()

fun Rate.consume(): Rate = copy(remainingRequests = (remainingRequests - 1).coerceAtLeast(0))

fun Rate.expireNow(): Rate = copy(resetAt = Instant.now())

fun Rate.shouldLimit(): Boolean = !hasExpired() && remainingRequests == 0L
