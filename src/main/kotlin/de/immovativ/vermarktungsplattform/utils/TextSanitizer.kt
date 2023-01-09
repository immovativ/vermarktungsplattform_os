package de.immovativ.vermarktungsplattform.utils

import org.owasp.html.PolicyFactory
import org.owasp.html.Sanitizers

object TextSanitizer {
    private val sanitationPolicy: PolicyFactory = Sanitizers.FORMATTING
        .and(Sanitizers.LINKS)
        .and(Sanitizers.BLOCKS)
        .and(Sanitizers.STYLES)
        .and(Sanitizers.TABLES)
        .and(Sanitizers.IMAGES)

    fun sanitize(unsafe: String?): String? {
        return if (unsafe == null) {
            null
        } else {
            sanitationPolicy.sanitize(unsafe)
        }
    }

    @JvmName("sanitizeNonNull")
    fun sanitize(unsafe: String): String =
        sanitationPolicy.sanitize(unsafe)
}
