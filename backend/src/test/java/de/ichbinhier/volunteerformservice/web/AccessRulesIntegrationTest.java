package de.ichbinhier.volunteerformservice.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SignIns;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AccessRulesIntegrationTest {

    @Autowired private MockMvc mvc;

    @Autowired private StaffRepository staffMembers;

    @Autowired private SignIns signIns;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        staffMembers.deleteAll();
        Staff ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash("not used here")
                .build());
        signIn = new Cookie("ibh_session", signIns.open(ashton));
    }

    @Test
    void refusesAnUnlistedPath() throws Exception {
        mvc.perform(get("/api/v1/unknown"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void refusesAnUnlistedPathToASignedInStaffMemberToo() throws Exception {
        mvc.perform(get("/api/v1/unknown").cookie(signIn))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void refusesAnUnlistedMethodOnAPublicPath() throws Exception {
        mvc.perform(delete("/api/v1/applications"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

        mvc.perform(get("/api/v1/applications"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void answersTheHealthcheckWithoutASignIn() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void opensNoOtherActuatorPath() throws Exception {
        mvc.perform(post("/actuator/health"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/actuator"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/actuator/env"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void hidesApiDocumentationWithoutDocsProfile() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isUnauthorized());
    }

}
