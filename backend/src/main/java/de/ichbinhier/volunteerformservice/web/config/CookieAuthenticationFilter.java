package de.ichbinhier.volunteerformservice.web.config;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;


public class CookieAuthenticationFilter extends OncePerRequestFilter {

    private final StaffRepository staffRepo;
    private final SessionManager sessionManager;

    public CookieAuthenticationFilter(StaffRepository staffRepo, SessionManager sessionManager) {
        this.staffRepo = staffRepo;
        this.sessionManager = sessionManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("ibh_session".equals(cookie.getName())) {
                    Staff staff = sessionManager.getStaff(cookie.getValue());
                    if (staff != null) {
                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(staff, null, staff.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                    break;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

}
