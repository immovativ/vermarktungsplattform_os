package de.immovativ.vermarktungsplattform.service

import com.github.mustachejava.DefaultMustacheFactory
import de.immovativ.vermarktungsplattform.service.MustacheSyntax.render
import io.kotest.assertions.fail
import io.kotest.core.spec.style.FunSpec
import java.nio.file.Paths
import kotlin.io.path.absolutePathString
import kotlin.io.path.createTempFile
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText

class EmailTemplateServiceTest : FunSpec({

    val mustacheFactory = DefaultMustacheFactory("templates")

    val passwordResetHtmlTemplate = mustacheFactory.compile("passwordReset-html.mustache")
    val passwordResetPlainTemplate = mustacheFactory.compile("passwordReset-plain.mustache")

    test("password reset") {

        val input = PasswordResetTemplateInput(
            url = "https://www.immovativ.de/reset-password/123456789",
            "foo@bar.com"
        )

        val plain = passwordResetPlainTemplate.render(input)
        Helper.checkEquals(plain, "src/test/resources/fixtures/emails/password-reset-text.txt")
        val html = passwordResetHtmlTemplate.render(input)
        Helper.checkEquals(html, "src/test/resources/fixtures/emails/password-reset-html.html")
    }
})

object Helper {
    fun checkEquals(generated: String, expectedPath: String) {
        val expected = Paths.get(expectedPath).takeIf { it.exists() }?.readText() ?: ""
        if (generated == expected) {
            // ok
        } else {
            createTempFile("invitation-template")
                .also { it.writeText(generated) }
                .also {
                    fail(
                        "Template content does not match. Check ${it.absolutePathString()} for the actual contents." +
                            "\nCheck the difference:" +
                            "\n\tdiff -y ${it.absolutePathString()} $expectedPath" +
                            "\n(or open the files in your browser)" +
                            "\nIf that looks good:" +
                            "\n\tcp ${it.absolutePathString()} $expectedPath"
                    )
                }
        }
    }
}
