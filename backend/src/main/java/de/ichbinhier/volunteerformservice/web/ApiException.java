package de.ichbinhier.volunteerformservice.web;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
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

    /** Headers the failure itself carries, such as {@code Retry-After}. */
    private final HttpHeaders headers;

    public ApiException(HttpStatus status, String code) {
        this(status, code, HttpHeaders.EMPTY);
    }

    public ApiException(HttpStatus status, String code, HttpHeaders headers) {
        super(code);
        this.status = status;
        this.code = code;
        this.headers = headers;
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

    /**
     * Too many failed sign-ins from one address (`A20`). {@code Retry-After} is
     * a courtesy for anything reading the API by hand — the dashboard shows one
     * general message and leaves the action retryable.
     */
    public static ApiException rateLimited(Duration retryAfter) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, String.valueOf(Math.max(1, retryAfter.toSeconds())));
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", headers);
    }

}
