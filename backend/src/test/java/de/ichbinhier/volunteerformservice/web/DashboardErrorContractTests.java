package de.ichbinhier.volunteerformservice.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SessionManager;

/**
 * The dashboard words every failure by looking `code` up in `de.errors`, so
 * every failure has to carry one. See `dashboard/API.md` "Errors".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardErrorContractTests {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SessionManager sessions;

    private Category socialMedia;

    private Staff ashton;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        socialMedia = categories.save(category("Social Media", 1));
        ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.example")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", sessions.createSession(ashton));
    }

    @Test
    void answersAMissingSignInWithUnauthenticated() throws Exception {
        mvc.perform(get("/api/v1/staff/applications"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Unauthenticated"))
                .andExpect(jsonPath("$.type").value("https://ichbinhier.eu/problems/unauthenticated"))
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void answersAnUnknownAddressAndAWrongPasswordAlike() throws Exception {
        signInWith("ashton.blackwell@ichbinhier.example", "wrong")
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        signInWith("nobody@ichbinhier.example", "correct horse")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void answersAnUnknownApplicationWithNotFound() throws Exception {
        mvc.perform(patch("/api/v1/staff/applications/" + UUID.randomUUID())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_REVIEW\"}"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mvc.perform(delete("/api/v1/staff/applications/not-a-uuid/permanently").cookie(signIn))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void refusesToEraseAnApplicationThatIsNotDiscarded() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        mvc.perform(delete("/api/v1/staff/applications/" + onFile.getId() + "/permanently").cookie(signIn))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOT_DISCARDED"));
    }

    @Test
    void namesTheFieldOfARejectedApplicationChange() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        patchApplication(onFile, "{\"status\":\"ARCHIVED\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("status"))
                .andExpect(jsonPath("$.errors[0].code").value("STATUS_UNKNOWN"));

        patchApplication(onFile, "{\"ownerId\":\"" + UUID.randomUUID() + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("ownerId"))
                .andExpect(jsonPath("$.errors[0].code").value("OWNER_UNKNOWN"));

        patchApplication(onFile, "{\"internalNotes\":\"" + "n".repeat(4001) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("internalNotes"))
                .andExpect(jsonPath("$.errors[0].code").value("NOTES_TOO_LONG"));
    }

    @Test
    void rejectsWhatAnApplicantWroteRatherThanIgnoringIt() throws Exception {
        Application onFile = applications.save(application(socialMedia));

        patchApplication(onFile, "{\"name\":\"Somebody Else\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("IMMUTABLE_FIELD"));

        patchApplication(onFile, "{\"consentAt\":\"2026-09-08T10:00:00Z\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("consentAt"))
                .andExpect(jsonPath("$.errors[0].code").value("IMMUTABLE_FIELD"));
    }

    @Test
    void namesTheFieldOfARejectedCategory() throws Exception {
        createCategory("{\"name\":\"   \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_NAME_REQUIRED"));

        createCategory("{\"name\":\"" + "N".repeat(61) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_NAME_TOO_LONG"));

        createCategory("{\"name\":\"Fundraising\",\"description\":\"" + "d".repeat(141) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("description"))
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_DESCRIPTION_TOO_LONG"));

        createCategory("{\"name\":\"  social media \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_NAME_TAKEN"));
    }

    @Test
    void refusesARenameOntoAnotherCategorysName() throws Exception {
        Category fundraising = categories.save(category("Fundraising", 2));

        mvc.perform(patch("/api/v1/staff/categories/" + fundraising.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Social Media\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_NAME_TAKEN"));

        mvc.perform(patch("/api/v1/staff/categories/" + fundraising.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Fundraising\",\"active\":false}"))
                .andExpect(status().isOk());
    }

    @Test
    void refusesToDeleteACategoryAnApplicationNames() throws Exception {
        applications.save(application(socialMedia));

        mvc.perform(delete("/api/v1/staff/categories/" + socialMedia.getId()).cookie(signIn))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("CATEGORY_IN_USE"));
    }

    @Test
    void refusesAnIncompleteDisplayOrder() throws Exception {
        Category fundraising = categories.save(category("Fundraising", 2));

        reorder("{\"ids\":[\"" + socialMedia.getId() + "\"]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("ids"))
                .andExpect(jsonPath("$.errors[0].code").value("ORDER_INCOMPLETE"));

        reorder("{\"ids\":[\"" + socialMedia.getId() + "\",\"" + socialMedia.getId() + "\"]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("ORDER_INCOMPLETE"));

        reorder("{\"ids\":[]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("ORDER_INCOMPLETE"));

        reorder("{\"ids\":[\"" + fundraising.getId() + "\",\"" + socialMedia.getId() + "\"]}")
                .andExpect(status().isOk());
    }

    private ResultActions signInWith(String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/staff/session")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }

    private ResultActions patchApplication(Application application, String body) throws Exception {
        return mvc.perform(patch("/api/v1/staff/applications/" + application.getId())
                .cookie(signIn)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions createCategory(String body) throws Exception {
        return mvc.perform(post("/api/v1/staff/categories")
                .cookie(signIn)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions reorder(String body) throws Exception {
        return mvc.perform(put("/api/v1/staff/categories/order")
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
