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

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;

/**
 * One account per Staff member, with initial passwords out of the environment
 * (`A1`, `A17`). The seeder is a {@code !test} bean, so it is built by hand here
 * rather than left to start with the context.
 */
@SpringBootTest
@ActiveProfiles("test")
class StaffSeederTests {

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

    /**
     * A dashboard nobody can sign in to is worse than a backend that refuses to
     * start, and the refusal has to name the variable a person must set.
     */
    @Test
    void refusesToStartWhenAnInitialPasswordIsMissing() {
        List<String> missingTheLast =
                List.of("first pass", "second pass", "third pass", "fourth pass", "");

        assertThatThrownBy(() -> seeder(missingTheLast).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("STAFF_5_PASSWORD");
    }

    /**
     * Seeded by address rather than behind one "is the table empty" check, so an
     * already-seeded deployment keeps starting without the variables it no
     * longer needs, and a partly-seeded one gets the rest.
     */
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

    /**
     * Earlier builds seeded one account whose password was a literal in the
     * seeder, so it stays a working key to the dashboard on every machine that
     * ran them. It may own Applications, so it is taken off those before the row
     * goes.
     */
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
