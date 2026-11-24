package de.ichbinhier.volunteerformservice.web.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
@Profile("docs")
class OpenApiConfig {

    @Bean
    OpenAPI volunteerApi() {
        return new OpenAPI()
                .info(new Info().title("Freiwilligenplattform API").version("v1")
                        .description("Schnittstellen für Formular und Dashboard. "
                                + "Für geschützte Dashboard-Anfragen zuerst über POST /api/v1/staff/session anmelden. "
                                + "Der Browser speichert das Sitzungs-Cookie automatisch. "
                                + "Schreibende Anfragen verändern Daten; Formular-Anfragen können E-Mails auslösen."))
                .components(new Components().addSecuritySchemes("staffSession",
                        new SecurityScheme().type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE).name(SignInCookie.NAME)
                                .description("Sitzungs-Cookie nach erfolgreicher Anmeldung.")));
    }
}
