package de.immovativ.vermarktungsplattform.repository

import org.jetbrains.exposed.sql.Expression
import org.jetbrains.exposed.sql.QueryAlias
import org.jetbrains.exposed.sql.QueryBuilder
import org.jetbrains.exposed.sql.transactions.TransactionManager

class SubQueryExpression<T>(private val aliasQuery: QueryAlias) : Expression<T>() {
    override fun toQueryBuilder(queryBuilder: QueryBuilder) {
        aliasQuery.describe(TransactionManager.current(), queryBuilder)
    }
}
