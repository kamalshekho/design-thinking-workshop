package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SessionManager;

/**
 * What a permanent erase takes with it. The State changes own a non-nullable
 * foreign key on their Application, and the erase is the platform's only path
 * to actually removing what a person wrote, so it must not leave a trail of
 * their Application's life behind. See `dashboard/API.md`, "Erasing an
 * Application erases its state changes".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardErasePathTests {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private StateChangeRepository changes;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SessionManager sessions;

    private Category socialMedia;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        changes.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        socialMedia = categories.save(category("Social Media", 1));
        Staff ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.example")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", sessions.createSession(ashton));
    }

    /**
     * A State change points at its Application, so the rows go first — and they
     * go here too, so a class that runs after this one finds an empty table.
     */
    @AfterEach
    void clear() {
        changes.deleteAll();
        applications.deleteAll();
    }

    @Test
    void erasesTheStateChangesWithTheApplication() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        patchApplication(onFile, "{\"status\":\"IN_REVIEW\"}");
        patchApplication(onFile, "{\"discarded\":true}");
        assertThat(applicationIdsOnRecord()).contains(onFile.getId());

        mvc.perform(delete("/api/v1/staff/applications/" + onFile.getId() + "/permanently")
                        .cookie(signIn))
                .andExpect(status().isNoContent());

        assertThat(applications.findById(onFile.getId())).isEmpty();
        assertThat(applicationIdsOnRecord()).isEmpty();
    }

    @Test
    void keepsAnotherApplicationsStateChanges() throws Exception {
        Application erased = applications.save(application(socialMedia));
        Application kept = applications.save(application(socialMedia));

        patchApplication(erased, "{\"discarded\":true}");
        patchApplication(kept, "{\"status\":\"IN_REVIEW\"}");

        mvc.perform(delete("/api/v1/staff/applications/" + erased.getId() + "/permanently")
                        .cookie(signIn))
                .andExpect(status().isNoContent());

        assertThat(applicationIdsOnRecord()).containsExactly(kept.getId());
    }

    private List<UUID> applicationIdsOnRecord() {
        return changes.findAll().stream()
                .map(StateChange::getApplication)
                .map(Application::getId)
                .distinct()
                .toList();
    }

    private void patchApplication(Application application, String body) throws Exception {
        mvc.perform(patch("/api/v1/staff/applications/" + application.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    private static Category category(String name, int displayOrder) {
        return Category.builder().name(name).displayOrder(displayOrder).active(true).build();
    }

    private static Application application(Category category) {
        return Application.builder()
                .submissionId(UUID.randomUUID())
                .category(category)
                .name("Anna Müller")
                .email("anna@example.de")
                .weeklyTime(WeeklyTime.HOURS_1_2)
                .about("Ich arbeite seit drei Jahren in der Moderation.")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .build();
    }

}
