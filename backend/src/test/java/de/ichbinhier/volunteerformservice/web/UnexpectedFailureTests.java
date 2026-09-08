package de.ichbinhier.volunteerformservice.web;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import de.ichbinhier.volunteerformservice.category.CategoryRepository;

/** A defect still leaves as a code the dashboard can word, not as an empty 500. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UnexpectedFailureTests {

    @Autowired private MockMvc mvc;

    @MockitoBean private CategoryRepository categories;

    @Test
    void answersAFailingQueryWithInternalError() throws Exception {
        given(categories.findByActiveTrueOrderByDisplayOrderAsc())
                .willThrow(new IllegalStateException("the database is on fire"));

        mvc.perform(get("/api/v1/categories"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"));
    }

}
