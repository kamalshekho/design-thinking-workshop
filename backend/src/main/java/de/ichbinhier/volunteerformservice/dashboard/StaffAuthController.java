package de.ichbinhier.volunteerformservice.dashboard;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
import de.ichbinhier.volunteerformservice.web.FieldValidationException;
import de.ichbinhier.volunteerformservice.web.config.SignInAttempts;
import de.ichbinhier.volunteerformservice.web.config.SignInCookie;
import de.ichbinhier.volunteerformservice.web.config.SignIns;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/v1/staff")
public class StaffAuthController {

    /** The most bcrypt reads of a password; anything past it is ignored. */
    static final int BCRYPT_MAX_BYTES = 72;

    private final StaffRepository staffRepo;
    private final PasswordEncoder passwordEncoder;
    private final SignIns signIns;
    private final SignInAttempts attempts;
    private final SignInCookie cookie;

    /**
     * What an unknown address is compared against. Without a comparison, a
     * wrong address would answer faster than a wrong password and tell a
     * caller which addresses belong to a Staff member. Hashed once, by the
     * same encoder, so the comparison costs what a real one costs.
     */
    private final String unknownEmailHash;

    StaffAuthController(StaffRepository staffRepo, PasswordEncoder passwordEncoder, SignIns signIns,
                        SignInAttempts attempts, SignInCookie cookie) {
        this.staffRepo = staffRepo;
        this.passwordEncoder = passwordEncoder;
        this.signIns = signIns;
        this.attempts = attempts;
        this.cookie = cookie;
        this.unknownEmailHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @PostMapping("/session")
    ResponseEntity<StaffResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw new FieldValidationException("password", "PASSWORD_TOO_LONG");
        }

        String address = http.getRemoteAddr();

        Optional<Duration> throttled = attempts.throttleFor(address);
        if (throttled.isPresent()) {
            throw ApiException.rateLimited(throttled.get());
        }

        Optional<Staff> found = staffRepo.findByEmail(request.getEmail());
        String hash = found.map(Staff::getPasswordHash).orElse(unknownEmailHash);
        boolean matches = passwordEncoder.matches(request.getPassword(), hash);

        if (found.isEmpty() || !matches) {
            attempts.failed(address);
            throw ApiException.invalidCredentials();
        }

        Staff staff = found.get();

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
