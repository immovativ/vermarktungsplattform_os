package de.immovativ.vermarktungsplattform.model.paging

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.maps.shouldContainExactly
import io.kotest.matchers.shouldBe
import io.ktor.http.Parameters
import org.jetbrains.exposed.sql.SortOrder

class PagingRequestTest : StringSpec({

    "safe from empty request" {
        val paging = PagingRequest.fromQueryParameters(Parameters.Empty)

        paging.page shouldBe 1
        paging.pageSize shouldBe 20
        paging.sortBy shouldBe "-createdAt"
    }
    "safe from ok request" {
        val paging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("limit", "30")
                set("order", "+lol")
                set("page", "4")
            }
        )

        paging.page shouldBe 4
        paging.pageSize shouldBe 30
        paging.sortBy shouldBe "+lol"
    }

    "safe from malicious request" {
        val paging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("limit", "nope")
                set("order", "oof")
                set("page", "nopenope")
            }
        )

        paging.page shouldBe 1
        paging.pageSize shouldBe 20
        paging.sortBy shouldBe "oof" // this is handled by sql column mapping
    }

    "safe from empty sort" {
        val paging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("order", "")
            }
        )

        paging.sortBy shouldBe "-createdAt"
    }

    "safe from large limit" {
        val paging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("limit", "900000000")
            }
        )

        paging.pageSize shouldBe 100
    }

    "safe from zero/negative limit" {
        val paging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("limit", "0")
            }
        )

        paging.pageSize shouldBe 1

        val negPaging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("limit", "-5")
            }
        )

        negPaging.pageSize shouldBe 1
    }

    "safe from zero/negative page" {
        val paging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("page", "0")
            }
        )

        paging.page shouldBe 1

        val negPaging = PagingRequest.fromQueryParameters(
            Parameters.build {
                set("page", "-4")
            }
        )

        negPaging.page shouldBe 1
    }

    "sort results desc" {
        val paging = PagingRequest(
            pageSize = 3,
            page = 2,
            sortBy = "-name"
        )

        val received = mutableMapOf<String, SortOrder>()
        paging.sortResults({ it }, {
            received.put(it.first, it.second)
        })

        received.shouldContainExactly(
            mapOf(
                "name" to SortOrder.DESC
            )
        )
    }

    "sort results asc" {
        val paging = PagingRequest(
            pageSize = 3,
            page = 2,
            sortBy = "+name"
        )

        val received = mutableMapOf<String, SortOrder>()
        paging.sortResults({ it }, {
            received.put(it.first, it.second)
        })

        received.shouldContainExactly(
            mapOf(
                "name" to SortOrder.ASC
            )
        )
    }

    "handle broken sort" {
        val paging = PagingRequest(
            pageSize = 3,
            page = 2,
            sortBy = ""
        )

        val received = mutableMapOf<String, SortOrder>()
        paging.sortResults({
            when (it) {
                "foo" -> "foo"
                else -> "empty"
            }
        }, {
            received.put(it.first, it.second)
        })

        received.shouldContainExactly(
            mapOf(
                "empty" to SortOrder.ASC // asc is default
            )
        )
    }
})
