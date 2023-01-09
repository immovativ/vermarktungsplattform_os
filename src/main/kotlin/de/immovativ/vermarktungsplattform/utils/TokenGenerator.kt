package de.immovativ.vermarktungsplattform.utils

import java.security.SecureRandom

class TokenGenerator {
    companion object {
        private val random = SecureRandom()

        fun generate(length: Int = 32): String {
            val characters = ('a'..'z') + ('A'..'Z') + ('0'..'9')

            return List(length) {
                val idx = random.nextInt(length) % characters.size
                characters.elementAt(idx)
            }.joinToString("")
        }
    }
}
