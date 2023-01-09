package de.immovativ.vermarktungsplattform.utils

import de.immovativ.vermarktungsplattform.repository.JsonBinaryColumn
import de.immovativ.vermarktungsplattform.utils.AppSpecSupport.withBetterTestApplicationAndSetup
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.assertions.throwables.shouldThrowWithMessage
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import org.jetbrains.exposed.sql.transactions.transaction
import org.postgresql.util.PGobject

@Serializable
private data class Bar(val baz: String)

@Serializable
private data class Foo(val foo: Boolean, val bars: List<Bar>)

class JsonColumnTypeSpec : StringSpec({
    val columnType = JsonBinaryColumn(Foo::class)

    "valueFromDB" {
        withBetterTestApplicationAndSetup {
            transaction {
                val foo = PGobject()
                foo.type = "JSONB"
                foo.value = """{"foo":false,"bars":[{"baz":"lol"},{"baz":"rofl"}]}"""

                columnType.valueFromDB(foo) shouldBe Foo(
                    foo = false,
                    bars = listOf(
                        Bar("lol"),
                        Bar("rofl")
                    )
                )

                shouldThrow<SerializationException> {
                    val empty = PGobject()
                    empty.type = "JSONB"
                    empty.value = """{}"""

                    columnType.valueFromDB(empty)
                }

                shouldThrowWithMessage<IllegalStateException>("1 is not a PGobject") {
                    columnType.valueFromDB(1)
                }
            }
        }
    }

    "notNullValueToDB" {
        withBetterTestApplicationAndSetup {
            transaction {
                columnType.notNullValueToDB(
                    Foo(
                        foo = false,
                        bars = listOf(
                            Bar("lol"),
                            Bar("rofl")
                        )
                    )
                ) shouldBe """{"foo":false,"bars":[{"baz":"lol"},{"baz":"rofl"}]}"""

                shouldThrowWithMessage<IllegalStateException>("1 is not Foo") {
                    columnType.notNullValueToDB(1)
                }
            }
        }
    }
})
