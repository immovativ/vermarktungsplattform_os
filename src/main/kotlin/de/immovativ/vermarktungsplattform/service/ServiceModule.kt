package de.immovativ.vermarktungsplattform.service

import org.kodein.di.DI
import org.kodein.di.bind
import org.kodein.di.bindSingleton
import org.kodein.di.instance
import org.kodein.di.singleton

val serviceModule = DI.Module("serviceModule") {
    bind<UserService>() with singleton { UserService(di) }
    bind<ConceptAssignmentService>() with singleton { ConceptAssignmentService(di) }
    bind<EmailService>() with singleton { EmailService(di) }
    bind<EmailTemplateService>() with singleton { EmailTemplateService(di) }
    bind<JobService>() with singleton { JobService(di) }
    bindSingleton { S3Service() }
    bindSingleton { CandidatureService(di) }
    bindSingleton { ProfileService(di) }
    bindSingleton { MessagingService(di) }
    bindSingleton { ConstructionSiteImportService(instance(), instance()) }
    bindSingleton { ParcelImportService(instance(), instance(), instance()) }
    bindSingleton { NotificationService(di) }

    bind<DashboardService>() with singleton { DashboardService() }
}
