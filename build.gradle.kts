import com.diffplug.gradle.spotless.SpotlessApply
import com.github.benmanes.gradle.versions.updates.DependencyUpdatesTask
import com.github.psxpaul.task.ExecFork
import org.gradle.api.tasks.testing.logging.TestLogEvent.FAILED
import org.gradle.api.tasks.testing.logging.TestLogEvent.PASSED
import org.gradle.api.tasks.testing.logging.TestLogEvent.SKIPPED
import org.gradle.api.tasks.testing.logging.TestLogEvent.STANDARD_ERROR
import org.gradle.api.tasks.testing.logging.TestLogEvent.STANDARD_OUT
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    application

    kotlin("jvm") version Dependencies.Kotlin
    kotlin("plugin.serialization") version Dependencies.Kotlin

    id("com.diffplug.spotless") version Dependencies.Spotless
    id("com.github.johnrengelman.shadow") version Dependencies.Shadow
    id("com.avast.gradle.docker-compose") version Dependencies.DockerCompose
    id("com.github.ben-manes.versions") version Dependencies.Versions
    id("com.github.psxpaul.execfork") version Dependencies.ExecFork
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(kotlin("stdlib"))

    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:${Dependencies.KotlinXSerializationJson}")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:${Dependencies.KotlinXDatetime}")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:${Dependencies.KotlinXCoroutines}")

    implementation("io.ktor:ktor-server-core:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-netty:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-client-core:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-client-cio:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-client-serialization:${Dependencies.Ktor}")

    implementation("io.ktor:ktor-server-call-id:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-status-pages:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-call-logging:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-content-negotiation:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-serialization-kotlinx-json:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-auth:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-auth-jwt:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-client-content-negotiation:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-webjars:${Dependencies.Ktor}")
    implementation("io.ktor:ktor-server-forwarded-header:${Dependencies.Ktor}")

    implementation("org.kodein.di:kodein-di-framework-ktor-server-jvm:${Dependencies.Kodein}")
    implementation("org.kodein.di:kodein-di-framework-ktor-server-controller-jvm:${Dependencies.Kodein}")

    implementation("org.flywaydb:flyway-core:${Dependencies.Flyway}")

    implementation("org.jetbrains.exposed:exposed-core:${Dependencies.Exposed}")
    implementation("org.jetbrains.exposed:exposed-dao:${Dependencies.Exposed}")
    implementation("org.jetbrains.exposed:exposed-jdbc:${Dependencies.Exposed}")
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:${Dependencies.Exposed}")

    implementation("com.zaxxer:HikariCP:${Dependencies.Hikari}")

    implementation("org.postgresql:postgresql:${Dependencies.Postgres}")

    implementation("ch.qos.logback:logback-classic:${Dependencies.Logback}")
    implementation("io.github.microutils:kotlin-logging:${Dependencies.KotlinLogging}")

    implementation("com.password4j:password4j:${Dependencies.Password4J}")

    implementation("io.arrow-kt:arrow-core:${Dependencies.Arrow}")

    implementation("net.axay:simplekotlinmail-core:${Dependencies.SimpleKotlinMail}")
    implementation("net.axay:simplekotlinmail-client:${Dependencies.SimpleKotlinMail}")
    implementation("net.axay:simplekotlinmail-html:${Dependencies.SimpleKotlinMail}")

    implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc:${Dependencies.Shedlock}")
    implementation("net.javacrumbs.shedlock:shedlock-core:${Dependencies.Shedlock}")

    implementation("com.github.spullara.mustache.java:compiler:${Dependencies.Mustache}")

    implementation("org.webjars:swagger-ui:${Dependencies.SwaggerUiWebjar}")

    implementation("org.apache.poi:poi-ooxml:${Dependencies.ApachePoi}")
    // apache poi uses log4j-api
    implementation("org.apache.logging.log4j:log4j-to-slf4j:${Dependencies.Log4jToSlf4j}")
    implementation("com.googlecode.owasp-java-html-sanitizer:owasp-java-html-sanitizer:${Dependencies.OwaspJavaHtmlSanitizer}")

    implementation("software.amazon.awssdk:s3:${Dependencies.AwsS3Sdk}")

    testImplementation("io.kotest:kotest-runner-junit5:${Dependencies.Kotest}")
    testImplementation("io.kotest:kotest-assertions-core:${Dependencies.Kotest}")
    testImplementation("io.kotest:kotest-assertions-json:${Dependencies.Kotest}")
    testImplementation("io.kotest:kotest-assertions-ktor:${Dependencies.KotestKtor}")

    testImplementation("io.ktor:ktor-server-test-host:${Dependencies.Ktor}")

    testImplementation("org.awaitility:awaitility-kotlin:${Dependencies.Awaitility}")

    testImplementation("io.github.serpro69:kotlin-faker:${Dependencies.KotlinFaker}")
}

defaultTasks("clean", "test")

spotless {
    kotlin {
        ktlint(Dependencies.Ktlint)
        toggleOffOn()
        trimTrailingWhitespace()
        indentWithSpaces()
        endWithNewline()
    }
    kotlinGradle {
        ktlint(Dependencies.Ktlint)
        trimTrailingWhitespace()
        indentWithSpaces()
        endWithNewline()
    }
    format("markdown") {
        target("**/*.md")
        trimTrailingWhitespace()
        indentWithSpaces(2)
        endWithNewline()
    }
}

application {
    mainClass.set("io.ktor.server.netty.EngineMain")
}

fun isNonStable(version: String): Boolean {
    val stableKeyword = listOf("RELEASE", "FINAL", "GA").any { version.toUpperCase().contains(it) }
    val regex = "^[0-9,.v-]+(-r)?$".toRegex()
    val isStable = stableKeyword || regex.matches(version)
    return isStable.not()
}

val ensureWebpack by tasks.registering {
    if (!file("./node_modules/.bin/webpack").exists() && System.getenv("CI") == null) {
        throw GradleException("Run `yarn install` to ensure webpack")
    }
}

val webpackDevServer by tasks.registering(ExecFork::class) {
    executable = "./node_modules/.bin/webpack"
    args = mutableListOf("serve", "--mode", "development", "--config", "webpack.config.js")
}

val runWebpack by tasks.registering(Exec::class) {
    commandLine = listOf(
        "./node_modules/.bin/webpack",
        "--config",
        "webpack.config.js"
    )
}

val testDataGenerator by tasks.registering(JavaExec::class) {
    dockerCompose.stopContainers.set(false)
    classpath = sourceSets["test"].runtimeClasspath
    mainClass.set("de.immovativ.vermarktungsplattform.TestDataGenerator")
}

tasks {
    withType<KotlinCompile> {
        kotlinOptions {
            jvmTarget = JavaVersion.VERSION_17.toString()
            freeCompilerArgs = listOf("-opt-in=kotlin.RequiresOptIn")
        }
    }

    withType<DependencyUpdatesTask> {
        rejectVersionIf {
            isNonStable(candidate.version) && !isNonStable(currentVersion)
        }
    }

    dockerCompose {
        isRequiredBy(run)
        isRequiredBy(testDataGenerator)

        if (System.getenv("CI") == null) {
            isRequiredBy(test)
        }

        if (System.getProperty("idea.active") != null || System.getProperty("idea.version") != null) {
            println("Stop containers set to false because test is run from IntelliJ IDEA!")
            stopContainers.set(false)
        }

        if (project.ext.has("dontStopContainers")) {
            stopContainers.set(false)
        }
    }

    compileKotlin {
        dependsOn(withType<SpotlessApply>())
    }

    test {
        useJUnitPlatform()
        testLogging {
            events = setOf(PASSED, SKIPPED, FAILED, STANDARD_ERROR, STANDARD_OUT)
        }

        outputs.upToDateWhen { false }
    }

    named("webpackDevServer") {
        dependsOn(ensureWebpack)
    }

    named<JavaExec>("run") {
        jvmArgs("-Dio.ktor.development=true")

        dependsOn(webpackDevServer)
    }

    shadowJar {
        manifest {
            attributes(
                mapOf(
                    "Main-Class" to application.mainClass
                )
            )
        }
        archiveBaseName.set("application")
    }
}
