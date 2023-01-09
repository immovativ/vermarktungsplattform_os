package de.immovativ.vermarktungsplattform.model.paging

import arrow.core.Either
import arrow.core.getOrElse
import io.ktor.http.Parameters
import org.jetbrains.exposed.sql.SortOrder

@kotlinx.serialization.Serializable
data class PageResult<T>(
    val items: List<T>,
    val total: Long,
    val page: Int,
    val limit: Int
)

data class PagingRequest(
    val pageSize: Int,
    val page: Int,
    // +foo = foo ascending
    // -foo = foo descending
    val sortBy: String
) {
    companion object {
        fun fromQueryParameters(queryParameters: Parameters, defaultSortBy: String = "-createdAt"): PagingRequest {
            return PagingRequest(
                pageSize = Either.catch {
                    queryParameters["limit"]?.toInt()?.let {
                        when {
                            it < 1 -> 1
                            it > 100 -> 100
                            else -> it
                        }
                    } ?: 20
                }.getOrElse { 20 },
                page = Either.catch {
                    queryParameters["page"]?.toInt()?.let {
                        when {
                            it < 1 -> 1
                            else -> it
                        }
                    } ?: 1
                }.getOrElse { 1 },
                sortBy = queryParameters["order"]?.takeIf {
                    it.isNotBlank()
                } ?: defaultSortBy
            )
        }
    }

    fun skipCount(): Long = ((page - 1) * pageSize).toLong()

    fun <R, T>sortResults(toFieldFromLowercase: (String) -> R, sort: (Pair<R, SortOrder>) -> T): T {
        val field = toFieldFromLowercase(sortBy.drop(1).lowercase())
        return if (sortBy.startsWith("-")) {
            sort(field to SortOrder.DESC)
        } else {
            sort(field to SortOrder.ASC)
        }
    }
}
