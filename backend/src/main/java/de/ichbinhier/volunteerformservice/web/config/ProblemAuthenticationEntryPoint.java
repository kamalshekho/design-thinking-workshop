package de.ichbinhier.volunteerformservice.web.config;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.web.ApiProblem;

/**
 * A missing or expired Sign-in answers {@code 401 UNAUTHENTICATED} with a body.
 * The dashboard covers itself with the sign-in screen on that code and keeps the
 * staff member's unsent work, so the code has to arrive.
 */
@Component
public class ProblemAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(ApiProblem.asJson(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED"));
    }

}
