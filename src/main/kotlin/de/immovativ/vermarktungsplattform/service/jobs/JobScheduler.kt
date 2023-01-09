package de.immovativ.vermarktungsplattform.service.jobs

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import mu.KLogging
import net.javacrumbs.shedlock.core.ClockProvider
import net.javacrumbs.shedlock.core.LockConfiguration
import net.javacrumbs.shedlock.core.LockingTaskExecutor
import net.javacrumbs.shedlock.core.LockingTaskExecutor.TaskWithResult
import java.util.concurrent.Executors
import kotlin.coroutines.CoroutineContext
import kotlin.time.Duration
import kotlin.time.toJavaDuration

class JobScheduler(
    private val runEvery: Duration,
    private val lockingTaskExecutor: LockingTaskExecutor,
    private val lockForAtLeast: Duration,
    // hopefully sane default which doesn't hinder future jobs from grabbing stale locks
    // -> run at most 90% of the total interval
    private val lockForAtMost: Duration = runEvery * 0.90,
    private val name: String,
    private val runnableWithHasMoreIndicator: TaskWithResult<Boolean>
) : CoroutineScope {
    companion object : KLogging()

    private val executor = Executors.newSingleThreadExecutor { r -> Thread(r, name) }
    private val job: Job = Job()

    override val coroutineContext: CoroutineContext = executor.asCoroutineDispatcher() + job

    init {
        require(runEvery.isPositive()) {
            "runEvery has to be a positive value"
        }

        require(lockForAtMost.isPositive()) {
            "lockForAtMost has to be a positive value"
        }

        require(lockForAtLeast.isPositive()) {
            "lockForAtLeast has to be a positive value"
        }

        logger.info { "Job '$name' registered which runs every $runEvery and locks for at least $lockForAtLeast / at most $lockForAtMost." }
    }

    fun schedule() = launch {
        var nextDelay = runEvery

        while (true) {
            delay(nextDelay)

            try {
                logger.info { "Run job '$name'" }

                val taskResult = lockingTaskExecutor.executeWithLock(
                    runnableWithHasMoreIndicator,
                    LockConfiguration(
                        ClockProvider.now(),
                        name,
                        lockForAtMost.toJavaDuration(),
                        lockForAtLeast.toJavaDuration()
                    )
                )

                nextDelay = if (taskResult.wasExecuted() && taskResult.result == true) {
                    val lockAtLeastPlusLeeway = lockForAtLeast + (lockForAtLeast / 2)

                    logger.debug { "Task has more to offer, rerun in $lockAtLeastPlusLeeway ($lockForAtLeast + Leeway)" }

                    lockAtLeastPlusLeeway
                } else {
                    if (taskResult.wasExecuted()) {
                        logger.debug { "Task has nothing left to do. Next run will be in $runEvery." }
                    } else {
                        logger.debug { "Task was not executed, because it was locked. Next run will be in $runEvery." }
                    }

                    runEvery
                }
            } catch (e: Exception) {
                if (e is CancellationException) {
                    throw e
                }

                logger.error(e) { "Caught exception in job '$name' loop" }
            }
        }
    }

    fun shutdown() {
        job.cancel()
        executor.shutdown()
    }
}
