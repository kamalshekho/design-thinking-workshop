package de.ichbinhier.volunteerformservice.web.config;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.web.ApiProblem;

/**
 * A signed-in Staff member asking for a path no rule opens answers
 * {@code 403 FORBIDDEN} with a body, like every other failure. Without this,
 * Spring Security answers with an empty body.
 */
@Component
public class ProblemAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(ApiProblem.asJson(HttpStatus.FORBIDDEN, ApiProblem.codeFor(HttpStatus.FORBIDDEN)));
    }

}
