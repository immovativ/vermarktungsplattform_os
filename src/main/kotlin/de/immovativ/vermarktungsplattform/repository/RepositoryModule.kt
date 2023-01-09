package de.immovativ.vermarktungsplattform.repository

import org.kodein.di.DI
import org.kodein.di.bind
import org.kodein.di.bindSingleton
import org.kodein.di.singleton

val repositoryModule = DI.Module("repositoryModule") {
    bind<UserRepository>() with singleton { UserRepository() }
    bind<ConceptAssignmentRepository>() with singleton { ConceptAssignmentRepository() }
    bind<PasswordResetRepository>() with singleton { PasswordResetRepository() }
    bindSingleton { TextsRepository() }
    bindSingleton { UserDataRepository() }
    bindSingleton { CandidatureRepository() }
    bindSingleton { AdminCandidatureRepository() }
    bindSingleton { MessageRepository() }
    bindSingleton { ConstructionSitesRepository() }
    bindSingleton { ParcelsRepository() }
    bindSingleton { ConstructionSiteDetailsRepository() }
    bindSingleton { NotificationRepository() }
}
