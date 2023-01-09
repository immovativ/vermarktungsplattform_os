package de.immovativ.vermarktungsplattform.repository

import de.immovativ.vermarktungsplattform.KtorJson
import io.ktor.util.reflect.instanceOf
import kotlinx.serialization.InternalSerializationApi
import kotlinx.serialization.serializer
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.ColumnType
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.statements.api.PreparedStatementApi
import org.postgresql.util.PGobject
import kotlin.reflect.KClass

@OptIn(InternalSerializationApi::class)
class JsonBinaryColumn<T : Any>(
    private val klass: KClass<T>
) : ColumnType() {
    override fun sqlType(): String = "JSONB"

    override fun setParameter(stmt: PreparedStatementApi, index: Int, value: Any?) {
        super.setParameter(
            stmt,
            index,
            value.let {
                val pgObject = PGobject()
                pgObject.type = sqlType()
                pgObject.value = value as String?

                pgObject
            }
        )
    }

    override fun valueFromDB(value: Any): T = when (value) {
        is PGobject -> value.value?.let {
            KtorJson.decodeFromString(klass.serializer(), it)
        } ?: error("$value is null")
        else -> error("$value is not a PGobject")
    }

    override fun valueToString(value: Any?) = when (value) {
        is Iterable<*> -> nonNullValueToString(value)
        else -> super.valueToString(value)
    }

    override fun notNullValueToDB(value: Any): Any {
        if (value.instanceOf(klass)) {
            @Suppress("UNCHECKED_CAST")
            return KtorJson.encodeToString(klass.serializer(), value as T)
        } else {
            error("$value is not ${klass.simpleName}")
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        if (!super.equals(other)) return false

        other as JsonBinaryColumn<*>

        if (klass != other.klass) return false

        return true
    }

    override fun hashCode(): Int {
        var result = super.hashCode()
        result = 31 * result + klass.hashCode()
        return result
    }
}

fun <T : Any> Table.jsonb(name: String, klass: KClass<T>): Column<T> = registerColumn(name, JsonBinaryColumn(klass))
