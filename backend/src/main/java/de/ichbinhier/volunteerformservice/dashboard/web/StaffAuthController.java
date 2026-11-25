package de.ichbinhier.volunteerformservice.dashboard.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.nio.charset.StandardCharsets;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.dashboard.service.StaffAuthenticationService;
import de.ichbinhier.volunteerformservice.dashboard.dto.staff.LoginRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.staff.StaffMemberResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.staff.StaffMembersResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.staff.StaffResponse;
import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;
import de.ichbinhier.volunteerformservice.web.config.SignInCookie;
import de.ichbinhier.volunteerformservice.web.config.SignIns;

@Tag(name = "Dashboard: Anmeldung")
@RestController
@RequestMapping("/api/v1/staff")
public class StaffAuthController {

    /** The most bcrypt reads of a password; anything past it is ignored. */
    public static final int BCRYPT_MAX_BYTES = 72;

    private final StaffRepository staffRepo;
    private final StaffAuthenticationService authentication;
    private final SignIns signIns;
    private final SignInCookie cookie;

    StaffAuthController(StaffRepository staffRepo, StaffAuthenticationService authentication,
                        SignIns signIns, SignInCookie cookie) {
        this.staffRepo = staffRepo;
        this.authentication = authentication;
        this.signIns = signIns;
        this.cookie = cookie;
    }

    @Operation(summary = "Anmelden und Sitzungs-Cookie erhalten")
    @ApiResponse(responseCode = "200", description = "Angemeldet; das Cookie wird gesetzt")
    @ApiResponse(responseCode = "400", description = "Eingaben ungültig", content = @Content)
    @ApiResponse(responseCode = "401", description = "Anmeldung fehlgeschlagen", content = @Content)
    @ApiResponse(responseCode = "429", description = "Zu viele Anmeldeversuche", content = @Content)
    @PostMapping("/session")
    ResponseEntity<StaffResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw new FieldValidationException("password", "PASSWORD_TOO_LONG");
        }

        Staff staff = authentication.authenticate(
                request.getEmail(), request.getPassword(), http.getRemoteAddr());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.carrying(signIns.open(staff)).toString())
            .body(new StaffResponse(staff.getId(), staff.getName(), staff.getEmail()));
    }

    @Operation(summary = "Abmelden")
    @ApiResponse(responseCode = "204", description = "Sitzung beendet", content = @Content)
    @DeleteMapping("/session")
    ResponseEntity<Void> logout(HttpServletRequest request) {
        SignInCookie.tokenIn(request).ifPresent(signIns::close);

        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, cookie.cleared().toString())
            .build();
    }

    @Operation(summary = "Angemeldetes Teammitglied abrufen", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping("/me")
    ResponseEntity<StaffResponse> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw ApiException.unauthenticated();
        }

        Staff staff = (Staff) auth.getPrincipal();
        return ResponseEntity.ok(new StaffResponse(staff.getId(), staff.getName(), staff.getEmail()));
    }

    @Operation(summary = "Teammitglieder auflisten", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping("/members")
    ResponseEntity<StaffMembersResponse> members() {
        List<StaffMemberResponse> members = staffRepo.findAll().stream()
            .map(s -> new StaffMemberResponse(s.getId(), s.getName()))
            .toList();

        return ResponseEntity.ok(new StaffMembersResponse(members));
    }

}
