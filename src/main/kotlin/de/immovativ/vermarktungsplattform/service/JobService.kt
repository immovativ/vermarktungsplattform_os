package de.immovativ.vermarktungsplattform.service

import de.immovativ.vermarktungsplattform.features.DatasourceAttributeKey
import de.immovativ.vermarktungsplattform.service.jobs.JobScheduler
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStarted
import io.ktor.server.application.ApplicationStopping
import io.ktor.server.config.ApplicationConfig
import kotlinx.coroutines.runBlocking
import mu.KotlinLogging
import net.javacrumbs.shedlock.core.DefaultLockingTaskExecutor
import net.javacrumbs.shedlock.provider.jdbc.JdbcLockProvider
import org.kodein.di.DI
import org.kodein.di.instance
import kotlin.time.Duration

class JobService(di: DI) {
    companion object {
        val logger = KotlinLogging.logger { }
    }

    private val application by di.instance<Application>()
    private val config = application.environment.config

    private val lock = JdbcLockProvider(application.attributes[DatasourceAttributeKey])
    private val lockExec = DefaultLockingTaskExecutor(lock)
    private val conceptAssignmentService by di.instance<ConceptAssignmentService>()
    private val notificationService by di.instance<NotificationService>()

    private val startStopEligibleAssignmentsJob = JobScheduler(
        runEvery = Duration.parse(propertyOrException("job.assignments.startstop.interval", config)),
        lockingTaskExecutor = lockExec,
        lockForAtLeast = Duration.parse(propertyOrException("job.assignments.startstop.lockAtLeastFor", config)),
        name = "assignments.startstop",
        runnableWithHasMoreIndicator = {
            conceptAssignmentService.startStopEligibleAssignments()
        }
    )

    private val sendNotifications = JobScheduler(
        runEvery = Duration.parse(propertyOrException("job.notification.interval", config)),
        lockingTaskExecutor = lockExec,
        lockForAtLeast = Duration.parse(propertyOrException("job.notification.lockAtLeastFor", config)),
        name = "notification",
        runnableWithHasMoreIndicator = {
            runBlocking {
                notificationService.sendMessage()
            }
        }
    )

    fun load() {
        application.environment.monitor.subscribe(ApplicationStarted) {
            start()
        }
        application.environment.monitor.subscribe(ApplicationStopping) {
            shutdown()
        }
    }

    private fun start() {
        sendNotifications.schedule()
        startStopEligibleAssignmentsJob.schedule()
    }

    private fun shutdown() {
        sendNotifications.shutdown()
        startStopEligibleAssignmentsJob.shutdown()
    }

    private fun propertyOrException(property: String, configuration: ApplicationConfig): String {
        return configuration.propertyOrNull(property)?.getString()
            ?: throw RuntimeException("Property $property is not configured!")
    }
}
