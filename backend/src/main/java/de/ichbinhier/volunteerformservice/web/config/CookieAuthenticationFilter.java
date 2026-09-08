package de.ichbinhier.volunteerformservice.web.config;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

/**
 * Turns the {@code ibh_session} cookie into an authenticated request, and slides
 * the Sign-in's twelve hours forward while it is at it (`A17`).
 *
 * <p>The Staff member is loaded per request from the token's id rather than kept
 * in {@link SignIns}, so a corrected name reaches {@code GET /me} without a new
 * sign-in and a deleted Staff member stops authenticating at once.
 */
public class CookieAuthenticationFilter extends OncePerRequestFilter {

    private final StaffRepository staffRepo;

    private final SignIns signIns;

    private final SignInCookie cookie;

    public CookieAuthenticationFilter(StaffRepository staffRepo, SignIns signIns, SignInCookie cookie) {
        this.staffRepo = staffRepo;
        this.signIns = signIns;
        this.cookie = cookie;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        SignInCookie.tokenIn(request)
                .flatMap(token -> signIns.touch(token)
                        .flatMap(staffRepo::findById)
                        .map(staff -> new SignedIn(token, staff)))
                .ifPresent(signedIn -> {
                    Staff staff = signedIn.staff();
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(staff, null, staff.getAuthorities()));
                    if (!endsTheSignIn(request)) {
                        response.addHeader(HttpHeaders.SET_COOKIE,
                                cookie.carrying(signedIn.token()).toString());
                    }
                });

        filterChain.doFilter(request, response);
    }

    /**
     * A sign-out would otherwise leave two {@code Set-Cookie} headers on one
     * response — this filter's refreshed cookie and the controller's cleared one.
     */
    private static boolean endsTheSignIn(HttpServletRequest request) {
        return "DELETE".equals(request.getMethod())
                && "/api/v1/staff/session".equals(request.getRequestURI());
    }

    private record SignedIn(String token, Staff staff) {
    }

}
