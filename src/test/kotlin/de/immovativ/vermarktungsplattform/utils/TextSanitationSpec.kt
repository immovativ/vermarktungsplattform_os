package de.immovativ.vermarktungsplattform.utils

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class TextSanitationSpec : StringSpec({
    "removes all kind of malicious payloads" {
        val toSanitize = """
            <script>alert('yolo')</script>
            <style onLoad style onLoad="javascript:javascript:alert(1)"></style onLoad>
            <h1 style="color: #fff">Hello how are you doing</h1>
            <a href="javascript\x3Ajavascript:alert(1)">test</a>
            <a href="http://google.de" onclick="alert(1)">test</a>
            <image style='filter:url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22><script>parent.alert(129)</script></svg>")'>
            <style>@keyframes slidein {}</style><a href="https://google.de" style="animation-duration:1s;animation-name:slidein;animation-iteration-count:2" onanimationiteration="alert(1)">yolo</a>
            <a href="javas	cript:alert(1)">XSS</a>
            <a href="javascript://%0aalert(1)">XSS</a>
        """.trimIndent()

        val sanitized = TextSanitizer
            .sanitize(toSanitize)
            .trim('\n')

        sanitized shouldBe """
            <h1 style="color:#fff">Hello how are you doing</h1>
            test
            <a href="http://google.de" rel="nofollow">test</a>

            <a href="https://google.de" rel="nofollow">yolo</a>
            XSS
            XSS
        """.trimIndent()
    }

    "keeps benign content (mostly) unchanged" {
        val toSanitize = """
           <p><strong>...fuer Stadtentwicklung in Zeiten von Strukturwandel und Digitalisierung!</strong></p><h3>headline</h3><p>bla</p>
            <table style="border-collapse:collapse;width: 100%;"><tbody>
            <tr>
                <td style="width: 50%;">asdf<br></td>
                <td style="width: 50%;">asdf<br></td></tr>
            <tr>
                <td style="width: 50%;">ffd<br></td>
                <td style="width: 50%;">asdf<br></td></tr>
            <tr>
            <td style="width: 50%;">asdf<br></td>
            <td style="width: 50%;">asdf<br></td></tr></tbody></table><p><img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="" width="300"></p><br><p><span style="background-color: rgb(249, 203, 156);">Fuer weitere Fragen melden Sie sich <strong><span style="color: rgb(255, 255, 0);">unter</span></strong></span></p><p><a href="mailto:yolocopter@lol.de">yolocopter@lol.de</a><br></p>
        """.trimIndent()

        val sanitized = TextSanitizer
            .sanitize(toSanitize)

        // the sanitizer is making minor adjustments to the format and is making the @-char html-safe
        sanitized.trimIndent() shouldBe """
             <p><strong>...fuer Stadtentwicklung in Zeiten von Strukturwandel und Digitalisierung!</strong></p><h3>headline</h3><p>bla</p>
              <table style="border-collapse:collapse;width:100%"><tbody><tr><td style="width:50%">asdf<br /></td><td style="width:50%">asdf<br /></td></tr><tr><td style="width:50%">ffd<br /></td><td style="width:50%">asdf<br /></td></tr><tr><td style="width:50%">asdf<br /></td><td style="width:50%">asdf<br /></td></tr></tbody></table><p><img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="" width="300" /></p><br /><p><span style="background-color:rgb( 249 , 203 , 156 )">Fuer weitere Fragen melden Sie sich <strong><span style="color:rgb( 255 , 255 , 0 )">unter</span></strong></span></p><p><a href="mailto:yolocopter&#64;lol.de" rel="nofollow">yolocopter&#64;lol.de</a><br /></p>
        """.trimIndent()
    }
})
