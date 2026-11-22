package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
import org.springframework.test.web.servlet.ResultActions;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.domain.StateChange;
import de.ichbinhier.volunteerformservice.application.domain.StateChangeField;
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
class DashboardWritePathIntegrationTest {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private StateChangeRepository changes;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SignIns signIns;

    private Category socialMedia;

    private Staff ashton;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        changes.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        socialMedia = categories.save(category("Social Media", 1));
        ashton = staffMembers.save(Staff.builder()
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
    void clearsTheOwnerOnAnExplicitNull() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        patchApplication(onFile, "{\"ownerId\":\"" + ashton.getId() + "\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownerId").value(ashton.getId().toString()));

        patchApplication(onFile, "{\"ownerId\":null}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownerId").value(nullValue()));

        assertThat(applications.findById(onFile.getId()).orElseThrow().getOwner()).isNull();
        assertThat(recordedValues(StateChangeField.OWNER))
                .containsExactly(ashton.getId().toString(), null);
    }

    @Test
    void leavesTheOwnerAloneWhenTheFieldIsAbsent() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        patchApplication(onFile, "{\"ownerId\":\"" + ashton.getId() + "\"}")
                .andExpect(status().isOk());

        patchApplication(onFile, "{\"status\":\"IN_REVIEW\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownerId").value(ashton.getId().toString()));

        assertThat(recordedValues(StateChangeField.OWNER)).containsExactly(ashton.getId().toString());
    }

    @Test
    void recordsAStateChangeOnlyWhenTheStateChanges() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        patchApplication(onFile, "{\"discarded\":false}").andExpect(status().isOk());
        assertThat(recordedValues(StateChangeField.DISCARDED)).isEmpty();

        patchApplication(onFile, "{\"discarded\":true}").andExpect(status().isOk());
        Instant discardedAt = applications.findById(onFile.getId()).orElseThrow().getDiscardedAt();
        assertThat(discardedAt).isNotNull();

        patchApplication(onFile, "{\"discarded\":true}").andExpect(status().isOk());
        assertThat(applications.findById(onFile.getId()).orElseThrow().getDiscardedAt())
                .isEqualTo(discardedAt);

        patchApplication(onFile, "{\"discarded\":false}").andExpect(status().isOk());

        assertThat(recordedValues(StateChangeField.DISCARDED)).containsExactly("true", "false");
        assertThat(recordedValues(StateChangeField.STATUS)).isEmpty();
    }

    private List<String> recordedValues(StateChangeField field) {
        return changes.findAll().stream()
                .filter(change -> change.getField() == field)
                .sorted((left, right) -> left.getChangedAt().compareTo(right.getChangedAt()))
                .map(StateChange::getToValue)
                .toList();
    }

    private ResultActions patchApplication(Application application, String body) throws Exception {
        return mvc.perform(patch("/api/v1/staff/applications/" + application.getId())
                .cookie(signIn)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
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
