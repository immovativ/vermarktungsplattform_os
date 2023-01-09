package de.immovativ.vermarktungsplattform.repository

interface TestCleanable {

    val priority: Int
        get() = 0

    fun deleteAllOnlyForTesting()
}
