package de.immovativ.vermarktungsplattform.service

import de.immovativ.vermarktungsplattform.model.candidature.AdminCandidatureView
import de.immovativ.vermarktungsplattform.model.candidature.CandidatureId
import de.immovativ.vermarktungsplattform.model.email.EmailTemplate
import de.immovativ.vermarktungsplattform.repository.CandidatureRepository
import de.immovativ.vermarktungsplattform.repository.ConceptAssignmentRepository
import de.immovativ.vermarktungsplattform.repository.NotificationRepository
import de.immovativ.vermarktungsplattform.repository.UserRepository
import mu.KLogging
import org.kodein.di.DI
import org.kodein.di.instance

class NotificationService(di: DI) {
    companion object : KLogging()

    private val emailTemplateService by di.instance<EmailTemplateService>()
    private val candidatureRepository by di.instance<CandidatureRepository>()
    private val conceptAssignmentRepository by di.instance<ConceptAssignmentRepository>()
    private val userRepository by di.instance<UserRepository>()
    private val notificationRepository by di.instance<NotificationRepository>()
    private val emailService by di.instance<EmailService>()

    fun newMessage(candidatureId: CandidatureId) {
        val userIdAndConceptAssignmentId =
            candidatureRepository.findUserIdAndConceptAssignmentIdBy(candidatureId) ?: return

        val (userId, conceptAssignmentId) = userIdAndConceptAssignmentId

        val foundUser = userRepository.findById(userId.value) ?: return
        val conceptAssignment = conceptAssignmentRepository.findByIdForCandidate(conceptAssignmentId.value) ?: return

        val template = emailTemplateService.newMessage(conceptAssignment)

        notificationRepository.create(
            email = foundUser.email,
            template = template
        )
    }

    suspend fun sendMessage(): Boolean {
        val amount = 10

        val notifications = notificationRepository.getNotifications(amount + 1)
        val hasMore = notifications.size > amount

        // Try to send mail and delete, whether the sending was successful or not
        for (notification in notifications) {
            emailService.sendEmail(
                notification.recipient,
                EmailTemplate(notification.subject, notification.plainText, notification.htmlText)
            ).tap {
                notificationRepository.deleteById(notificationId = notification.id)
            }.tapLeft {
                notificationRepository.deleteById(notificationId = notification.id)
            }
        }

        logger.info { "Sent ${notifications.size} notification(s)." }

        return hasMore
    }

    fun grant(adminCandidatureView: AdminCandidatureView) {
        val template = emailTemplateService.grant(adminCandidatureView)

        notificationRepository.create(
            email = adminCandidatureView.email,
            template = template
        )
    }

    fun reject(adminCandidatureView: AdminCandidatureView) {
        val template = emailTemplateService.reject(
            conceptAssignmentName = adminCandidatureView.details.conceptAssignmentWithAttachments.assignment.name
        )

        notificationRepository.create(
            email = adminCandidatureView.email,
            template = template
        )
    }

    fun reject(candidatureId: CandidatureId) {
        val userIdAndConceptAssignmentId =
            candidatureRepository.findUserIdAndConceptAssignmentIdBy(candidatureId) ?: return

        val (userId, conceptAssignmentId) = userIdAndConceptAssignmentId

        val foundUser = userRepository.findById(userId.value) ?: return
        val conceptAssignment = conceptAssignmentRepository.findByIdForCandidate(conceptAssignmentId.value) ?: return

        val template = emailTemplateService.reject(conceptAssignment.assignment.name)

        notificationRepository.create(
            email = foundUser.email,
            template = template
        )
    }
}
