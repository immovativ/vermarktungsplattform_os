package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import de.immovativ.vermarktungsplattform.model.email.EmailTemplate
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStopping
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.retry
import kotlinx.coroutines.future.await
import kotlinx.coroutines.runBlocking
import mu.KotlinLogging
import net.axay.simplekotlinmail.delivery.MailerManager
import net.axay.simplekotlinmail.delivery.mailerBuilder
import net.axay.simplekotlinmail.email.emailBuilder
import org.kodein.di.DI
import org.kodein.di.instance
import kotlin.time.Duration.Companion.seconds

class EmailSendingFailed(cause: Throwable) : Exception(cause)

class EmailService(di: DI) {
    companion object {
        val logger = KotlinLogging.logger { }
    }

    private val application by di.instance<Application>()
    private val config = application.environment.config
    private val smtpHost = config.property("email.smtp.host").getString()
    private val smtpPort = config.property("email.smtp.port").getString()
    private val smtpUsername = config.property("email.smtp.username").getString()
    private val smtpPassword = config.property("email.smtp.password").getString()
    private val sender = config.property("email.sender").getString()

    private val mailer = mailerBuilder(
        host = smtpHost,
        port = smtpPort.toInt(),
        username = smtpUsername,
        password = smtpPassword
    ).also {
        application.environment.monitor.subscribe(ApplicationStopping) {
            runBlocking {
                MailerManager.shutdownMailers()
            }
        }
    }

    suspend fun sendEmail(emailAddress: String, template: EmailTemplate): Either<Throwable, Unit> = Either.catch {
        val email = emailBuilder {
            from(sender)
            to(emailAddress)

            withSubject(template.subject)
            withPlainText(template.plainText)
            withHTMLText(template.htmlText)
        }

        flow {
            logger.debug { "Trying to send email to $emailAddress." }
            val sent = mailer.sendMail(email).await()
            emit(sent)
        }.retry(1) {
            logger.warn { "Retry sending mail." }
            logger.debug { "Retry sending mail to $emailAddress." }

            delay(2.seconds)

            it is Exception
        }.catch {
            logger.error(it) { "Sending email failed" }
            throw EmailSendingFailed(it)
        }.collect {
            logger.debug { "Sending email to $emailAddress was successful." }
        }
    }
}
