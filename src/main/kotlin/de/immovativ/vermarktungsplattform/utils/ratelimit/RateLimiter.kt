package de.immovativ.vermarktungsplattform.utils.ratelimit

import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withContext
import mu.KotlinLogging
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

interface RateLimiter {
    suspend fun handle(key: RateLimitKey, maxRequests: Long, window: Duration): Rate
    suspend fun reset(key: RateLimitKey): Rate
}

class InMemoryRateLimiter(
    private val mapPurgeSize: Int,
    private val mapPurgeWaitDuration: Duration
) : RateLimiter {
    private val scope =
        CoroutineScope(
            Dispatchers.Default + SupervisorJob() + CoroutineExceptionHandler { _, ex ->
                logger.error(
                    "Uncaught exception in in-memory rate limiter storage",
                    ex
                )
            }
        )
    private val mutex = Mutex()
    private val isPurgeRunning = AtomicBoolean(false)
    private var lastPurgeTime = Instant.now()
    private val map = ConcurrentHashMap<String, Rate>()
    private val logger = KotlinLogging.logger {}

    fun size(): Int = map.size

    override suspend fun handle(key: RateLimitKey, maxRequests: Long, window: Duration): Rate =
        withContext(Dispatchers.Default) {
            map.compute(key.value) { _, v ->
                when {
                    v == null -> Rate(remainingRequests = maxRequests, resetAt = Instant.now().plus(window))
                    v.hasExpired() -> Rate(remainingRequests = maxRequests, resetAt = Instant.now().plus(window))
                        .also { logger.debug { "Rate limit bucket $key has expired, reset" } }
                    else -> v.consume()
                }
            }!!.also { launchPurgeIfNeeded() }
        }

    override suspend fun reset(key: RateLimitKey): Rate =
        withContext(Dispatchers.Default) {
            map.compute(key.value) { _, v ->
                when {
                    v == null -> null
                    v.hasExpired() -> v
                    else -> v.expireNow()
                }
            }!!.also { launchPurgeIfNeeded() }
        }

    private fun launchPurgeIfNeeded() {
        logger.debug { "Should purge: ${shouldPurge()}" }
        if (shouldPurge() && mutex.tryLock()) {
            logger.debug { "Launching purge in coroutine scope" }
            scope.launch {
                try {
                    logger.debug { "Purging rate limit information, current size = ${map.size}" }
                    val shouldRemove = map.filterValues { it.hasExpired() }.keys
                    shouldRemove.forEach { k ->
                        logger.debug { "Removing stale bucket $k" }
                        map.remove(k)
                    }
                    lastPurgeTime = Instant.now()
                    isPurgeRunning.set(false)
                    logger.debug { "Purged rate limit information, new size = ${map.size}" }
                } finally {
                    mutex.unlock()
                }
            }
        }
    }

    private fun shouldPurge() =
        map.size > mapPurgeSize && Duration.between(
            lastPurgeTime,
            Instant.now()
        ) > mapPurgeWaitDuration
}
