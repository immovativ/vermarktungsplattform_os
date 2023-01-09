package de.immovativ.vermarktungsplattform.features

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStopping
import io.ktor.server.application.createApplicationPlugin
import io.ktor.server.config.ApplicationConfig
import io.ktor.util.AttributeKey
import mu.KLogging
import mu.KotlinLogging
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database

val DatasourceAttributeKey = AttributeKey<HikariDataSource>("Datasource")

val DBPlugin = createApplicationPlugin(name = "database") {
    val logger = KotlinLogging.logger("db_plugin")
    DBSetup.connectWithHikari(application)
    DBSetup.initializeExposed(application)
    DBSetup.migrateDatabase(application)

    application.environment.monitor.subscribe(ApplicationStopping) {
        val ds = it.attributes[DatasourceAttributeKey]
        try {
            if (ds.isRunning) {
                logger.debug { "Start closing database." }
                ds.close()
                logger.info("Closing database was successful.")
            } else {
                logger.info("Database connection was already closed.")
            }
        } catch (e: Throwable) {
            logger.warn(e) { "Closing database resources failed." }
        }
    }
}

object DBSetup : KLogging() {
    private lateinit var flyway: Flyway
    private lateinit var database: Database

    fun connectWithHikari(application: Application) {
        val configuration = application.environment.config

        val hikariConfiguration = HikariConfig()
        hikariConfiguration.driverClassName = "org.postgresql.Driver"
        hikariConfiguration.jdbcUrl = propertyOrException("database.jdbcUrl", configuration)
        hikariConfiguration.username = propertyOrException("database.username", configuration)
        hikariConfiguration.password = propertyOrException("database.password", configuration)
        hikariConfiguration.maximumPoolSize = 4
        hikariConfiguration.isAutoCommit = false
        hikariConfiguration.transactionIsolation = "TRANSACTION_REPEATABLE_READ"
        hikariConfiguration.initializationFailTimeout = 10_000
        hikariConfiguration.connectionTimeout = 10_000
        hikariConfiguration.validate()

        try {
            logger.debug { "Start creating datasource for JDBC-URL ${hikariConfiguration.jdbcUrl}." }

            application.attributes.put(DatasourceAttributeKey, HikariDataSource(hikariConfiguration))

            logger.info { "Creation of datasource was successful." }
        } catch (e: Throwable) {
            logger.error(e) { "Failed to create datasource" }
            throw RuntimeException("Creation of datasource failed", e)
        }
    }

    fun initializeExposed(application: Application) {
        try {
            logger.debug { "Start initializing Exposed." }
            database = Database.connect(application.attributes[DatasourceAttributeKey])
            logger.info { "Initializing Exposed was successful." }
        } catch (e: Throwable) {
            throw RuntimeException("Initializing Exposed failed", e)
        }
    }

    fun migrateDatabase(application: Application) {
        try {
            logger.info { "Start database migration." }
            flyway = Flyway.configure().dataSource(application.attributes[DatasourceAttributeKey]).load()
            flyway.migrate()
            logger.info { "Database migration was successful." }
        } catch (e: Throwable) {
            logger.error(e) { "Failed database migration" }
            throw RuntimeException("Database migration failed", e)
        }
    }
}

private fun propertyOrException(property: String, configuration: ApplicationConfig): String {
    return configuration.propertyOrNull(property)?.getString()
        ?: throw RuntimeException("Property $property is not configured!")
}
