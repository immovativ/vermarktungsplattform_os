package de.immovativ.vermarktungsplattform.utils

import org.kodein.di.DI
import org.kodein.di.bind
import org.kodein.di.instance
import org.kodein.di.singleton

val testModule = DI.Module("testModule") {
    bind<ConstructionSiteFixtures>() with singleton { ConstructionSiteFixtures(instance(), instance()) }
}
