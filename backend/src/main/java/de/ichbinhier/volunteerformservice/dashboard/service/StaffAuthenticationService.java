package de.ichbinhier.volunteerformservice.dashboard.service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.config.SignInAttempts;

@Service
public class StaffAuthenticationService {

    private final StaffRepository staffMembers;
    private final PasswordEncoder passwordEncoder;
    private final SignInAttempts attempts;
    private final String unknownEmailHash;

    public StaffAuthenticationService(StaffRepository staffMembers, PasswordEncoder passwordEncoder,
            SignInAttempts attempts) {
        this.staffMembers = staffMembers;
        this.passwordEncoder = passwordEncoder;
        this.attempts = attempts;
        this.unknownEmailHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    public Staff authenticate(String email, String password, String address) {
        Optional<Duration> throttled = attempts.throttleFor(address);
        if (throttled.isPresent()) {
            throw ApiException.rateLimited(throttled.get());
        }

        Optional<Staff> found = staffMembers.findByEmail(email);
        String hash = found.map(Staff::getPasswordHash).orElse(unknownEmailHash);
        boolean matches = passwordEncoder.matches(password, hash);
        if (found.isEmpty() || !matches) {
            attempts.failed(address);
            throw ApiException.invalidCredentials();
        }

        attempts.succeeded(address);
        return found.get();
    }
}
