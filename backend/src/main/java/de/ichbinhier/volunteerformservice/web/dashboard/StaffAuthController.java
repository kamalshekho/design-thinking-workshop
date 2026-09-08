package de.ichbinhier.volunteerformservice.web.dashboard;

import java.time.Duration;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SessionManager;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffAuthController {

    private final StaffRepository staffRepo;
    private final PasswordEncoder passwordEncoder;
    private final SessionManager sessionManager;

    @PostMapping("/session")
    ResponseEntity<StaffResponse> login(@RequestBody LoginRequest request) {
        var staff = staffRepo.findByEmail(request.getEmail())
            .orElse(null);

        if (staff == null || !passwordEncoder.matches(request.getPassword(), staff.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header("Content-Type", "application/problem+json")
                .body(null);
        }

        String sessionToken = sessionManager.createSession(staff);
        ResponseCookie cookie = ResponseCookie
            .from("ibh_session", sessionToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofHours(12))
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(new StaffResponse(staff.getId(), staff.getName(), staff.getEmail()));
    }

    @DeleteMapping("/session")
    ResponseEntity<Void> logout(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("ibh_session".equals(cookie.getName())) {
                    sessionManager.invalidateSession(cookie.getValue());
                    break;
                }
            }
        }

        ResponseCookie cookie = ResponseCookie
            .from("ibh_session", "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();

        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .build();
    }

    @GetMapping("/me")
    ResponseEntity<StaffResponse> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Staff staff = (Staff) auth.getPrincipal();
        return ResponseEntity.ok(new StaffResponse(staff.getId(), staff.getName(), staff.getEmail()));
    }

    @GetMapping("/members")
    ResponseEntity<StaffMembersResponse> members() {
        List<StaffMemberResponse> members = staffRepo.findAll().stream()
            .map(s -> new StaffMemberResponse(s.getId(), s.getName()))
            .toList();

        return ResponseEntity.ok(new StaffMembersResponse(members));
    }

}
