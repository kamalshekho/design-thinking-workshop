package de.ichbinhier.volunteerformservice.staff;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;


@Component
@Profile("!test")
@RequiredArgsConstructor
public class StaffSeeder implements ApplicationRunner {

    private final StaffRepository staffRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (staffRepo.count() > 0) {
            return;
        }

        staffRepo.save(Staff.builder()
            .name("Test Staff")
            .email("staff@ichbinhier.example")
            .passwordHash(passwordEncoder.encode("password"))
            .build());
    }

}
