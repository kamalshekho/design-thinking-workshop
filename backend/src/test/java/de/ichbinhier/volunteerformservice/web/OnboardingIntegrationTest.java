package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.domain.WeeklyTime;
import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.repository.StateChangeRepository;
import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.onboarding.repository.OnboardingStepCompletionRepository;
import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SignIns;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OnboardingIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private ApplicationRepository applications;
    @Autowired private StateChangeRepository stateChanges;
    @Autowired private OnboardingStepCompletionRepository stepCompletions;
    @Autowired private CategoryRepository categories;
    @Autowired private StaffRepository staffMembers;
    @Autowired private SignIns signIns;

    private Cookie signIn;
    private Category category;

    @BeforeEach
    void reset() {
        stepCompletions.deleteAll();
        stateChanges.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        category = categories.save(Category.builder()
                .name("Social Media")
                .description("")
                .displayOrder(1)
                .active(true)
                .build());

        Staff staff = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash("not used here")
                .build());
        signIn = new Cookie("ibh_session", signIns.open(staff));
    }

    @Test
    void createsTokenOnFirstAcceptedAndKeepsItOnSecondAccepted() throws Exception {
        Application app = saveApplication(ApplicationStatus.IN_REVIEW);

        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.onboarding.doneSteps").value(0))
                .andExpect(jsonPath("$.onboarding.totalSteps").value(4))
                .andExpect(jsonPath("$.onboarding.link", containsString("/onboarding/")));

        String firstToken = applications.findById(app.getId()).orElseThrow().getOnboardingToken();
        assertThat(firstToken).isNotBlank();
        assertThat(firstToken.length()).isGreaterThanOrEqualTo(43);

        // Move away and back to ACCEPTED -> token stays the same
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "IN_REVIEW" }
                                """))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboarding.link", containsString("/onboarding/" + firstToken)));

        assertThat(applications.findById(app.getId()).orElseThrow().getOnboardingToken())
                .isEqualTo(firstToken);
    }

    @Test
    void publicGetAndPutWorkWithoutSignInAndNeverLeakEmail() throws Exception {
        Application app = saveApplication(ApplicationStatus.IN_REVIEW);
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED" }
                                """))
                .andExpect(status().isOk());

        String token = applications.findById(app.getId()).orElseThrow().getOnboardingToken();
        long stateChangesBefore = stateChanges.count();

        mvc.perform(get("/api/onboarding/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mara Weber"))
                .andExpect(jsonPath("$.steps.length()").value(4))
                .andExpect(jsonPath("$.steps[0].id").value("RULES"))
                .andExpect(jsonPath("$.steps[0].done").value(false))
                .andExpect(content().string(not(containsString("mara.weber@example.org"))))
                .andExpect(content().string(not(containsString("Social Media"))));

        mvc.perform(put("/api/onboarding/{token}/steps/RULES", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "done": true }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steps[0].id").value("RULES"))
                .andExpect(jsonPath("$.steps[0].done").value(true));

        // Checking a step does not create a StateChange
        assertThat(stateChanges.count()).isEqualTo(stateChangesBefore);

        // Dashboard reflects updated doneSteps
        mvc.perform(get("/api/v1/staff/applications").cookie(signIn))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications[0].onboarding.doneSteps").value(1))
                .andExpect(jsonPath("$.applications[0].onboarding.totalSteps").value(4));

        // Unchecking works too
        mvc.perform(put("/api/onboarding/{token}/steps/RULES", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "done": false }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steps[0].done").value(false));
    }

    @Test
    void returns400ForUnknownStepId() throws Exception {
        Application app = saveApplication(ApplicationStatus.IN_REVIEW);
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED" }
                                """))
                .andExpect(status().isOk());

        String token = applications.findById(app.getId()).orElseThrow().getOnboardingToken();

        mvc.perform(put("/api/onboarding/{token}/steps/UNKNOWN_STEP", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "done": true }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    @Test
    void returns404ForInvalidTokenDeclinedOrDiscarded() throws Exception {
        mvc.perform(get("/api/onboarding/non-existent-token"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        Application app = saveApplication(ApplicationStatus.IN_REVIEW);
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED" }
                                """))
                .andExpect(status().isOk());
        String token = applications.findById(app.getId()).orElseThrow().getOnboardingToken();

        // Still valid in ACTIVE
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACTIVE" }
                                """))
                .andExpect(status().isOk());
        mvc.perform(get("/api/onboarding/{token}", token))
                .andExpect(status().isOk());

        // Invalid in DECLINED
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "DECLINED" }
                                """))
                .andExpect(status().isOk());
        mvc.perform(get("/api/onboarding/{token}", token))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        mvc.perform(put("/api/onboarding/{token}/steps/RULES", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "done": true }
                                """))
                .andExpect(status().isNotFound());

        // Back to ACCEPTED, then discarded -> 404
        mvc.perform(patch("/api/v1/staff/applications/{id}", app.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "ACCEPTED", "discarded": true }
                                """))
                .andExpect(status().isOk());
        mvc.perform(get("/api/onboarding/{token}", token))
                .andExpect(status().isNotFound());

        // Permanent erase succeeds even when onboarding steps exist
        mvc.perform(delete("/api/v1/staff/applications/{id}/permanently", app.getId())
                        .cookie(signIn))
                .andExpect(status().isNoContent());
    }

    private Application saveApplication(ApplicationStatus status) {
        return applications.save(Application.builder()
                .submissionId(UUID.randomUUID())
                .category(category)
                .name("Mara Weber")
                .email("mara.weber@example.org")
                .weeklyTime(WeeklyTime.HOURS_3_5)
                .about("Test")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .status(status)
                .build());
    }
}
