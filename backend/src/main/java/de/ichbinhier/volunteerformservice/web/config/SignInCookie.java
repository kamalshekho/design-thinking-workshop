package de.ichbinhier.volunteerformservice.web.config;

import java.time.Duration;
import java.util.Optional;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * The one cookie the dashboard carries. Server-side and opaque rather than a
 * bearer token, because an {@code EventSource} cannot set request headers and a
 * token would end up in the live stream's query string, where the proxy logs it
 * — see {@code dashboard/API.md}.
 *
 * <p>{@code Max-Age} matches the Sign-in's inactivity, and the cookie is written
 * again on every authenticated response: a {@code Max-Age} fixed once at
 * sign-in would expire twelve hours later whatever the Staff member did in
 * between, which is not the sliding window `A17` asks for.
 */
@Component
public class SignInCookie {

    public static final String NAME = "ibh_session";

    private final Duration maxAge;

    SignInCookie(SignInProperties properties) {
        this.maxAge = properties.getInactivity();
    }

    public ResponseCookie carrying(String token) {
        return base(token).maxAge(maxAge).build();
    }

    public ResponseCookie cleared() {
        return base("").maxAge(0).build();
    }

    public static Optional<String> tokenIn(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName())) {
                return Optional.ofNullable(cookie.getValue());
            }
        }
        return Optional.empty();
    }

    private static ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/");
    }

}
