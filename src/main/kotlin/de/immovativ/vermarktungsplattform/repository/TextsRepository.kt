package de.immovativ.vermarktungsplattform.repository

import arrow.core.Either
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

object TextsTable : Table("texts") {
    val name: Column<String> = varchar("name", 255)
    val value: Column<String> = text("value")
}

class TextsRepository {
    fun get(name: String) = Either.catch {
        transaction {
            TextsTable
                .select { TextsTable.name eq name }
                .firstOrNull()
                ?.let {
                    it[TextsTable.value]
                }
        }
    }

    fun update(name: String, value: String) = Either.catch {
        transaction {
            TextsTable.update({ TextsTable.name eq name }) {
                it[TextsTable.value] = value
            }
        }
    }
}
