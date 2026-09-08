package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;

import com.jayway.jsonpath.JsonPath;

import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FormApiTests {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private CategoryRepository categories;

    private Category socialMedia;

    @BeforeEach
    void reset() {
        applications.deleteAll();
        categories.deleteAll();
        socialMedia = categories.save(category("Social Media", 1, true));
    }

    @Test
    void returnsActiveCategoriesInDisplayOrderWithoutCaching() throws Exception {
        categories.save(category("Rechtliche Unterstützung", 3, true));
        categories.save(category("Etwas anderes", 2, false));

        mvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache"))
                .andExpect(jsonPath("$.categories.length()").value(2))
                .andExpect(jsonPath("$.categories[0].id").value(socialMedia.getId().toString()))
                .andExpect(jsonPath("$.categories[0].label").value("Social Media"))
                .andExpect(jsonPath("$.categories[1].label").value("Rechtliche Unterstützung"));
    }

    @Test
    void createsAnApplication() throws Exception {
        mvc.perform(submit(body(UUID.randomUUID(), socialMedia.getId(), "HOURS_1_2", "")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationId").isNotEmpty());

        assertThat(applications.findAll())
                .singleElement()
                .satisfies(
                        stored -> {
                            assertThat(stored.getName()).isEqualTo("Anna Müller");
                            assertThat(stored.getConsentTextVersion()).isEqualTo("2026-09");
                            assertThat(stored.getConsentAt()).isNotNull();
                        });
    }

    @Test
    void answersTheSameApplicationIdForARepeatedSubmissionId() throws Exception {
        UUID submissionId = UUID.randomUUID();

        String first = applicationId(body(submissionId, socialMedia.getId(), "HOURS_1_2", ""));
        String second = applicationId(body(submissionId, socialMedia.getId(), "HOURS_1_2", ""));

        assertThat(second).isEqualTo(first);
        assertThat(applications.findAll()).hasSize(1);
    }

    @Test
    void storesNothingWhenTheHoneypotIsFilled() throws Exception {
        mvc.perform(submit(body(UUID.randomUUID(), socialMedia.getId(), "HOURS_1_2", "spam")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationId").isNotEmpty());

        assertThat(applications.findAll()).isEmpty();
    }

    @Test
    void reportsFieldCodesAsProblemJson() throws Exception {
        String body =
                """
                {
                  "submissionId": "%s",
                  "categoryId": "%s",
                  "name": "",
                  "email": "not-an-address",
                  "weeklyTime": "HOURS_1_2",
                  "privacyConsent": false,
                  "consentTextVersion": "2026-09",
                  "website": ""
                }
                """
                        .formatted(UUID.randomUUID(), socialMedia.getId());

        mvc.perform(submit(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[?(@.code == 'NAME_REQUIRED')].field").value("name"))
                .andExpect(jsonPath("$.errors[?(@.code == 'EMAIL_INVALID')].field").value("email"))
                .andExpect(
                        jsonPath("$.errors[?(@.code == 'CONSENT_REQUIRED')].field")
                                .value("privacyConsent"));
    }

    @Test
    void reportsAnUnknownWeeklyTime() throws Exception {
        mvc.perform(submit(body(UUID.randomUUID(), socialMedia.getId(), "HOURS_9_9", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("weeklyTime"))
                .andExpect(jsonPath("$.errors[0].code").value("WEEKLY_TIME_UNKNOWN"));
    }

    @Test
    void separatesAnUnknownCategoryFromADeactivatedOne() throws Exception {
        Category retired = categories.save(category("Etwas anderes", 2, false));

        mvc.perform(submit(body(UUID.randomUUID(), UUID.randomUUID(), "HOURS_1_2", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("categoryId"))
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_UNKNOWN"));

        mvc.perform(submit(body(UUID.randomUUID(), retired.getId(), "HOURS_1_2", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_UNAVAILABLE"));

        assertThat(applications.findAll()).isEmpty();
    }

    private String applicationId(String body) throws Exception {
        String response =
                mvc.perform(submit(body))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return JsonPath.read(response, "$.applicationId");
    }

    private static RequestBuilder submit(String body) {
        return post("/api/v1/applications").contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private static String body(
            UUID submissionId, UUID categoryId, String weeklyTime, String website) {
        return """
               {
                 "submissionId": "%s",
                 "categoryId": "%s",
                 "name": "Anna Müller",
                 "email": "anna@example.de",
                 "weeklyTime": "%s",
                 "about": "Ich arbeite seit drei Jahren in der Moderation.",
                 "privacyConsent": true,
                 "consentTextVersion": "2026-09",
                 "website": "%s"
               }
               """
                .formatted(submissionId, categoryId, weeklyTime, website);
    }

    private static Category category(String name, int displayOrder, boolean active) {
        return Category.builder().name(name).displayOrder(displayOrder).active(active).build();
    }
}
