package de.ichbinhier.volunteerformservice.web.config;

import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import de.ichbinhier.volunteerformservice.staff.StaffRepository;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            StaffRepository staffRepo,
            SignIns signIns,
            SignInCookie signInCookie,
            ProblemAuthenticationEntryPoint unauthenticated,
            ProblemAccessDeniedHandler forbidden) throws Exception {

        // Every public path is named with its method, and whatever is not named
        // is refused, so an endpoint added later is closed until someone opens it.
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // The container's own error dispatch, never a request a client sends.
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/applications").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/staff/session").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/api/v1/staff/session").permitAll()
                // For the container healthcheck; answers UP or DOWN and nothing else.
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                .requestMatchers("/api/v1/staff/**").authenticated()
                .anyRequest().denyAll()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(unauthenticated)
                .accessDeniedHandler(forbidden)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(
                new CookieAuthenticationFilter(staffRepo, signIns, signInCookie),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

}
