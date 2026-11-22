package de.ichbinhier.volunteerformservice.staff;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.domain.WeeklyTime;
import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.config.StaffSeedProperties;
import de.ichbinhier.volunteerformservice.staff.config.StaffSeeder;
import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;

@SpringBootTest
@ActiveProfiles("test")
class StaffSeederIntegrationTest {

    private static final List<String> FIVE_PASSWORDS =
            List.of("first pass", "second pass", "third pass", "fourth pass", "fifth pass");

    @Autowired private StaffRepository staffMembers;

    @Autowired private ApplicationRepository applications;

    @Autowired private CategoryRepository categories;

    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void reset() {
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();
    }

    @Test
    void seedsOneAccountPerStaffMember() {
        seeder(FIVE_PASSWORDS).run(null);

        assertThat(staffMembers.findAll())
                .hasSize(5)
                .extracting(Staff::getEmail)
                .containsExactlyInAnyOrder(
                        "ashton.blackwell@ichbinhier.online",
                        "samuel.adeyemi@ichbinhier.online",
                        "marlene.kirchner@ichbinhier.online",
                        "tomasz.wieczorek@ichbinhier.online",
                        "yasmin.sadeghi@ichbinhier.online");
    }

    @Test
    void storesEachInitialPasswordHashedAndUsable() {
        seeder(FIVE_PASSWORDS).run(null);

        Staff ashton = staffMembers.findByEmail("ashton.blackwell@ichbinhier.online").orElseThrow();
        assertThat(ashton.getPasswordHash()).isNotEqualTo("first pass");
        assertThat(passwordEncoder.matches("first pass", ashton.getPasswordHash())).isTrue();
    }

    @Test
    void refusesToStartWhenAnInitialPasswordIsMissing() {
        List<String> missingTheLast =
                List.of("first pass", "second pass", "third pass", "fourth pass", "");

        assertThatThrownBy(() -> seeder(missingTheLast).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("STAFF_5_PASSWORD");
    }

    @Test
    void fillsInTheMissingAccountsAndLeavesTheRestUntouched() {
        Staff alreadyThere = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash(passwordEncoder.encode("chosen later"))
                .build());

        seeder(List.of("", "second pass", "third pass", "fourth pass", "fifth pass")).run(null);

        assertThat(staffMembers.findAll()).hasSize(5);
        assertThat(staffMembers.findById(alreadyThere.getId()).orElseThrow().getPasswordHash())
                .isEqualTo(alreadyThere.getPasswordHash());
    }

    @Test
    void retiresTheHardCodedAccountAndTakesItOffItsApplications() {
        staffMembers.save(Staff.builder()
                .name("Test Staff")
                .email("staff@ichbinhier.example")
                .passwordHash(passwordEncoder.encode("password"))
                .build());
        Staff retired = staffMembers.findByEmail("staff@ichbinhier.example").orElseThrow();
        Category socialMedia = categories.save(
                Category.builder().name("Social Media").displayOrder(1).active(true).build());
        Application owned = applications.save(application(socialMedia, retired));

        seeder(FIVE_PASSWORDS).run(null);

        assertThat(staffMembers.findByEmail("staff@ichbinhier.example")).isEmpty();
        assertThat(applications.findById(owned.getId()).orElseThrow().getOwner()).isNull();
    }

    private StaffSeeder seeder(List<String> passwords) {
        StaffSeedProperties properties = new StaffSeedProperties();
        properties.setSeedPasswords(passwords);
        return new StaffSeeder(staffMembers, applications, passwordEncoder, properties);
    }

    private static Application application(Category category, Staff owner) {
        return Application.builder()
                .submissionId(UUID.randomUUID())
                .category(category)
                .name("Anna Müller")
                .email("anna@example.de")
                .weeklyTime(WeeklyTime.HOURS_1_2)
                .about("Ich arbeite seit drei Jahren in der Moderation.")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .owner(owner)
                .build();
    }

}
