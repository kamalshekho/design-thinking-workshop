package de.ichbinhier.volunteerformservice.web;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/**
 * A failure the dashboard words by its {@code code} rather than by a field —
 * the top-level codes in {@code dashboard/API.md} "Errors".
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    public static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public static ApiException unauthenticated() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED");
    }

    public static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    public static ApiException notDiscarded() {
        return new ApiException(HttpStatus.BAD_REQUEST, "NOT_DISCARDED");
    }

    public static ApiException categoryInUse() {
        return new ApiException(HttpStatus.CONFLICT, "CATEGORY_IN_USE");
    }

}
