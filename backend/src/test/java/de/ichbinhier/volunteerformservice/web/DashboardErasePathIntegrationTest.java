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

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.domain.StateChange;
import de.ichbinhier.volunteerformservice.application.domain.WeeklyTime;
import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.repository.StateChangeRepository;
import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SignIns;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardErasePathIntegrationTest {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private StateChangeRepository changes;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SignIns signIns;

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
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", signIns.open(ashton));
    }

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
