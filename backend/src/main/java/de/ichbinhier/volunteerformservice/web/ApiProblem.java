package de.ichbinhier.volunteerformservice.web;

import java.net.URI;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;

/**
 * Builds the {@code application/problem+json} body the dashboard reads, with the
 * {@code code} it looks its German wording up by. The dashboard never reads a
 * message from here — see {@code dashboard/API.md} "Errors".
 */
public final class ApiProblem {

    private static final String TYPE_PREFIX = "https://ichbinhier.eu/problems/";

    private ApiProblem() {
    }

    /**
     * The same body for the Spring Security filter chain, which answers before a
     * controller advice can. Every value here is ASCII, so it needs no escaping
     * and no Jackson mapper — the servlet API is all the filter chain has.
     */
    public static String asJson(HttpStatusCode status, String code) {
        return """
               {"type":"%s","title":"%s","status":%d,"code":"%s"}"""
                .formatted(type(code), title(code), status.value(), code);
    }

    public static ProblemDetail of(HttpStatusCode status, String code) {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(type(code));
        problem.setTitle(title(code));
        problem.setProperty("code", code);
        return problem;
    }

    /**
     * The code for a status nothing in the contract names — a `405`, a `415`, a
     * Spring-raised `400`. An unknown code falls the dashboard back to its
     * general message, which beats an empty body with a bare status.
     */
    public static String codeFor(HttpStatusCode status) {
        if (status.is5xxServerError()) {
            return "INTERNAL_ERROR";
        }
        if (status.value() == HttpStatus.UNAUTHORIZED.value()) {
            return "UNAUTHENTICATED";
        }
        HttpStatus known = HttpStatus.resolve(status.value());
        return known != null ? known.name() : "INTERNAL_ERROR";
    }

    private static URI type(String code) {
        return URI.create(TYPE_PREFIX + code.toLowerCase(Locale.ROOT).replace('_', '-'));
    }

    private static String title(String code) {
        String words = code.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }

}
