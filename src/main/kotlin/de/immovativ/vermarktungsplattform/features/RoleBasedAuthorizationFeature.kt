package de.immovativ.vermarktungsplattform.features

import de.immovativ.vermarktungsplattform.model.user.UserRole
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCallPipeline
import io.ktor.server.application.BaseApplicationPlugin
import io.ktor.server.application.call
import io.ktor.server.application.plugin
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.RouteSelector
import io.ktor.server.routing.RouteSelectorEvaluation
import io.ktor.server.routing.RoutingResolveContext
import io.ktor.server.routing.application
import io.ktor.util.AttributeKey
import io.ktor.util.pipeline.PipelinePhase
import mu.KLogging

class RoleBasedAuthorizationFeature {
    companion object Plugin : BaseApplicationPlugin<ApplicationCallPipeline, Unit, RoleBasedAuthorizationFeature>,
        KLogging() {
        override val key = AttributeKey<RoleBasedAuthorizationFeature>("RoleBasedAuthorization")

        val AuthorizationPhase = PipelinePhase("Authorization")

        override fun install(
            pipeline: ApplicationCallPipeline,
            configure: Unit.() -> Unit
        ): RoleBasedAuthorizationFeature {
            return RoleBasedAuthorizationFeature()
        }
    }

    fun intercept(
        pipeline: ApplicationCallPipeline,
        expectedRoles: Set<UserRole>
    ) {
        pipeline.insertPhaseAfter(ApplicationCallPipeline.Plugins, PipelinePhase("Challenge"))
        pipeline.insertPhaseBefore(ApplicationCallPipeline.Call, AuthorizationPhase)

        pipeline.intercept(AuthorizationPhase) {
            val jwtRole = call.principal<JWTPrincipal>()?.get("role")
            if (jwtRole == null) {
                call.respond(
                    HttpStatusCode.Forbidden,
                    "No role in token"
                )
                finish()
            } else {
                try {
                    val actualRole = UserRole.valueOf(jwtRole)

                    if (!expectedRoles.contains(actualRole)) {
                        logger.debug { "Role $jwtRole not found in roles: ${UserRole.values()}" }
                        call.respond(HttpStatusCode.Forbidden)
                        finish()
                    }
                } catch (e: IllegalArgumentException) {
                    logger.warn { "Cannot parse jwt role '$jwtRole'" }

                    call.respond(HttpStatusCode.Forbidden, "Cannot parse token role")
                    finish()
                }
            }
        }
    }
}

class AuthorizedRouteSelector : RouteSelector() {
    override fun evaluate(context: RoutingResolveContext, segmentIndex: Int): RouteSelectorEvaluation =
        RouteSelectorEvaluation.Constant
}

private fun Route.authorizedRoute(expectedRoles: Set<UserRole>, build: Route.() -> Unit): Route {
    val authorizedRoute = createChild(AuthorizedRouteSelector())
    application.plugin(RoleBasedAuthorizationFeature).intercept(authorizedRoute, expectedRoles)
    authorizedRoute.build()
    return authorizedRoute
}

fun Route.withRoles(vararg expectedRoles: UserRole, build: Route.() -> Unit) =
    authorizedRoute(expectedRoles.toSet(), build)
