package de.immovativ.vermarktungsplattform.model.question

import de.immovativ.vermarktungsplattform.model.attachment.AttachmentMetadata
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class Question {
    abstract val id: QuestionId
    abstract val text: String
    abstract val description: String?
    abstract val required: Boolean
}

@Serializable
data class Range<T : Number>(
    val start: T,
    val endInclusive: T
)

@Serializable
@SerialName("intRangeQuestion")
data class IntRangeQuestion(
    override val id: QuestionId,
    override val text: String,
    override val required: Boolean,
    override val description: String? = null,
    val range: Range<Int> = Range(1, 6)
) : Question()

@Serializable
@SerialName("percentQuestion")
data class PercentQuestion(
    override val id: QuestionId,
    override val text: String,
    override val required: Boolean,
    override val description: String? = null
) : Question()

@Serializable
@SerialName("enumQuestion")
data class EnumQuestion(
    override val id: QuestionId,
    override val text: String,
    override val required: Boolean,
    override val description: String? = null,
    val values: List<String>
) : Question()

@Serializable
@SerialName("freeTextQuestion")
data class FreeTextQuestion(
    override val id: QuestionId,
    override val text: String,
    override val required: Boolean,
    override val description: String? = null
) : Question()

@Serializable
@SerialName("fileUploadQuestion")
data class FileUploadQuestion(
    override val id: QuestionId,
    override val text: String,
    override val required: Boolean,
    override val description: String? = null,
    val attachmentMetadata: AttachmentMetadata? = null
) : Question()
