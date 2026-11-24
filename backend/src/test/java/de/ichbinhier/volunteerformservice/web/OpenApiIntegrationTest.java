package de.ichbinhier.volunteerformservice.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "docs"})
class OpenApiIntegrationTest {

    @Autowired private MockMvc mvc;

    @Test
    void describesPublicAndProtectedEndpoints() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/applications'].post.summary").value("Bewerbung absenden"))
                .andExpect(jsonPath("$.paths['/api/v1/staff/applications'].get.security[0].staffSession").isArray())
                .andExpect(jsonPath("$.components.securitySchemes.staffSession.name").value("ibh_session"));
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/staff/applications")).andExpect(status().isUnauthorized());
    }
}
