package de.immovativ.vermarktungsplattform.service

import com.github.mustachejava.DefaultMustacheFactory
import com.github.mustachejava.Mustache
import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureView
import de.immovativ.vermarktungsplattform.model.conceptassignment.CandidateConceptAssignmentWithAttachments
import de.immovativ.vermarktungsplattform.model.conceptassignment.ConceptAssignmentId
import de.immovativ.vermarktungsplattform.model.email.EmailTemplate
import de.immovativ.vermarktungsplattform.service.MustacheSyntax.render
import io.ktor.server.application.Application
import org.kodein.di.DI
import org.kodein.di.instance
import java.io.StringWriter

data class UserInvitationTemplateInput(
    val url: String,
    val name: String,
    val title: String
)

data class PasswordResetTemplateInput(
    val url: String,
    val email: String
)

data class NewMessageTemplateInput(
    val title: String
)

data class GrantTemplateInput(
    val title: String
)

data class RejectTemplateInput(
    val title: String
)

object MustacheSyntax {
    fun Mustache.render(scope: Any): String = StringWriter().let {
        this.execute(it, scope).flush()
        it.toString()
    }
}

class EmailTemplateService(di: DI) {
    private val application by di.instance<Application>()
    private val config = application.environment.config
    private val mustacheFactory = DefaultMustacheFactory("templates")

    private val passwordResetHtmlTemplate = mustacheFactory.compile("passwordReset-html.mustache")
    private val passwordResetPlainTemplate = mustacheFactory.compile("passwordReset-plain.mustache")

    private val candidateInvitationHtmlTemplate = mustacheFactory.compile("candidateInvitation-html.mustache")
    private val candidateInvitationPlainTemplate = mustacheFactory.compile("candidateInvitation-plain.mustache")

    private val newMessageHtmlTemplate = mustacheFactory.compile("newMessage-html.mustache")
    private val newMessagePlainTemplate = mustacheFactory.compile("newMessage-plain.mustache")

    private val grantHtmlTemplate = mustacheFactory.compile("grant-html.mustache")
    private val grantPlainTemplate = mustacheFactory.compile("grant-plain.mustache")

    private val rejectHtmlTemplate = mustacheFactory.compile("reject-html.mustache")
    private val rejectPlainTemplate = mustacheFactory.compile("reject-plain.mustache")

    private val passwordResetUrl = config.property("urls.pwReset").getString()
    private val invitationUrl = config.property("urls.pwInvite").getString()

    fun passwordReset(token: String, email: String): EmailTemplate {
        val url = passwordResetUrl
        val input = PasswordResetTemplateInput(
            url = "$url/$token",
            email = email
        )

        return EmailTemplate(
            subject = "Rücksetzen Ihres Passworts auf der Vermarktungsplattform Dietenbach",
            plainText = passwordResetPlainTemplate.render(input),
            htmlText = passwordResetHtmlTemplate.render(input)
        )
    }

    fun candidateInvitation(token: String, name: String, conceptAssignmentId: ConceptAssignmentId?): EmailTemplate {
        val title = "Bitte schließen Sie die Registrierung ab"
        val conceptAssignmentIdQueryParameter = conceptAssignmentId?.let { "?conceptAssignmentId=${it.value}" } ?: ""
        val input = UserInvitationTemplateInput(
            url = "$invitationUrl/$token$conceptAssignmentIdQueryParameter",
            name = name,
            title = title
        )

        return EmailTemplate(
            subject = title,
            plainText = candidateInvitationPlainTemplate.render(input),
            htmlText = candidateInvitationHtmlTemplate.render(input)
        )
    }

    fun newMessage(conceptAssignment: CandidateConceptAssignmentWithAttachments): EmailTemplate {
        val subject = "Sie haben eine neue Nachricht für Ihre Bewerbung: ${conceptAssignment.assignment.name}"

        val input = NewMessageTemplateInput(
            title = subject
        )

        return EmailTemplate(
            subject = subject,
            plainText = newMessagePlainTemplate.render(input),
            htmlText = newMessageHtmlTemplate.render(input)
        )
    }

    fun grant(adminCandidatureView: AdminCandidatureView): EmailTemplate {
        val subject =
            "Sie haben den Zuschlag zu Ihrer Bewerbung \"${adminCandidatureView.details.conceptAssignmentWithAttachments.assignment.name}\" erhalten!"

        val input = GrantTemplateInput(
            title = subject
        )

        return EmailTemplate(
            subject = subject,
            plainText = grantPlainTemplate.render(input),
            htmlText = grantHtmlTemplate.render(input)
        )
    }

    fun reject(conceptAssignmentName: String): EmailTemplate {
        val subject =
            "Ihre Bewerbung \"${conceptAssignmentName}\" wurde abgelehnt!"

        val input = RejectTemplateInput(
            title = subject
        )

        return EmailTemplate(
            subject = subject,
            plainText = rejectPlainTemplate.render(input),
            htmlText = rejectHtmlTemplate.render(input)
        )
    }
}
