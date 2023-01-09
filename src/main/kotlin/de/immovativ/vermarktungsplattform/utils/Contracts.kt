package de.immovativ.vermarktungsplattform.utils

import java.util.UUID

class ContractException(message: String?) : IllegalArgumentException(message)

private fun String.isValidUUID(): Boolean = try {
    UUID.fromString(this)
    true
} catch (e: IllegalArgumentException) {
    false
}

fun requireUUID(value: String) {
    if (!value.isValidUUID()) {
        throw ContractException("value='$value' is not a valid uuid.")
    }
}

fun requireSize(value: String, sizeLimit: Int) {
    if (value.length > sizeLimit) {
        throw ContractException("size limit exceeded.")
    }
}
