package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
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
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.config.SignInAttempts;
import de.ichbinhier.volunteerformservice.web.config.SignInCookie;
import de.ichbinhier.volunteerformservice.web.config.SignIns;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffAuthController {

    private final StaffRepository staffRepo;
    private final PasswordEncoder passwordEncoder;
    private final SignIns signIns;
    private final SignInAttempts attempts;
    private final SignInCookie cookie;

    @PostMapping("/session")
    ResponseEntity<StaffResponse> login(@RequestBody LoginRequest request, HttpServletRequest http) {
        String address = http.getRemoteAddr();

        Optional<Duration> throttled = attempts.throttleFor(address);
        if (throttled.isPresent()) {
            throw ApiException.rateLimited(throttled.get());
        }

        var staff = staffRepo.findByEmail(request.getEmail())
            .orElse(null);

        if (staff == null || !passwordEncoder.matches(request.getPassword(), staff.getPasswordHash())) {
            attempts.failed(address);
            throw ApiException.invalidCredentials();
        }

        attempts.succeeded(address);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.carrying(signIns.open(staff)).toString())
            .body(new StaffResponse(staff.getId(), staff.getName(), staff.getEmail()));
    }

    @DeleteMapping("/session")
    ResponseEntity<Void> logout(HttpServletRequest request) {
        SignInCookie.tokenIn(request).ifPresent(signIns::close);

        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, cookie.cleared().toString())
            .build();
    }

    @GetMapping("/me")
    ResponseEntity<StaffResponse> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw ApiException.unauthenticated();
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
