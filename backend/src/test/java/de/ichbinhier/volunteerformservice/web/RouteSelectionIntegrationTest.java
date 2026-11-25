package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

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
class RouteSelectionIntegrationTest {

    @Autowired private MockMvc mvc;

    @Autowired private JdbcTemplate jdbc;

    @Autowired private StateChangeRepository changes;

    @Autowired private ApplicationRepository applications;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SignIns signIns;

    private Category socialMedia;

    private Category inactive;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        changes.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();
        jdbc.update("update route_selection_counts set selection_count = 0");

        socialMedia = categories.save(category("Social Media", 1, true));
        inactive = categories.save(category("Etwas anderes", 2, false));
        Staff ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", signIns.open(ashton));
    }

    @Test
    void countsEachSelectionAndListsEveryRouteAndCategory() throws Exception {
        select("{\"route\":\"COMMUNITY\"}").andExpect(status().isAccepted())
                .andExpect(content().string(""));
        select("{\"route\":\"COMMUNITY\"}").andExpect(status().isAccepted());
        select("{\"route\":\"SUPPORTING_MEMBER\"}").andExpect(status().isAccepted());
        select(categoryBody(socialMedia.getId().toString())).andExpect(status().isAccepted());

        mvc.perform(get("/api/v1/staff/route-selections").cookie(signIn))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fixedRoutes.length()").value(2))
                .andExpect(jsonPath("$.fixedRoutes[0].route").value("COMMUNITY"))
                .andExpect(jsonPath("$.fixedRoutes[0].count").value(2))
                .andExpect(jsonPath("$.fixedRoutes[1].route").value("SUPPORTING_MEMBER"))
                .andExpect(jsonPath("$.fixedRoutes[1].count").value(1))
                .andExpect(jsonPath("$.categories.length()").value(2))
                .andExpect(jsonPath("$.categories[0].categoryId").value(socialMedia.getId().toString()))
                .andExpect(jsonPath("$.categories[0].name").value("Social Media"))
                .andExpect(jsonPath("$.categories[0].count").value(1))
                .andExpect(jsonPath("$.categories[1].categoryId").value(inactive.getId().toString()))
                .andExpect(jsonPath("$.categories[1].count").value(0));
    }

    @Test
    void countsADeactivatedCategory() throws Exception {
        select(categoryBody(inactive.getId().toString())).andExpect(status().isAccepted());

        assertThat(selectionCountOf(inactive)).isEqualTo(1);
    }

    @Test
    void acceptsButIgnoresWhatItCannotCount() throws Exception {
        select(categoryBody(UUID.randomUUID().toString())).andExpect(status().isAccepted());
        select(categoryBody("not-a-uuid")).andExpect(status().isAccepted());
        select("{\"route\":\"CATEGORY\"}").andExpect(status().isAccepted());
        select("{\"route\":\"SOMETHING_ELSE\"}").andExpect(status().isAccepted());
        select("{}").andExpect(status().isAccepted());

        assertThat(jdbc.queryForObject(
                "select sum(selection_count) from route_selection_counts", Long.class)).isZero();
        assertThat(selectionCountOf(socialMedia)).isZero();
    }

    @Test
    void keepsTheCountWhenACategoryIsSavedAgain() throws Exception {
        select(categoryBody(socialMedia.getId().toString())).andExpect(status().isAccepted());

        Category loaded = categories.findById(socialMedia.getId()).orElseThrow();
        loaded.setDescription("Beiträge planen");
        categories.save(loaded);

        assertThat(selectionCountOf(socialMedia)).isEqualTo(1);
    }

    @Test
    void needsNoSignInToCountButOneToRead() throws Exception {
        select("{\"route\":\"COMMUNITY\"}").andExpect(status().isAccepted());

        mvc.perform(get("/api/v1/staff/route-selections"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions select(String body) throws Exception {
        return mvc.perform(post("/api/v1/route-selections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private long selectionCountOf(Category category) {
        return jdbc.queryForObject(
                "select selection_count from categories where id = ?", Long.class, category.getId());
    }

    private static String categoryBody(String categoryId) {
        return "{\"route\":\"CATEGORY\",\"categoryId\":\"" + categoryId + "\"}";
    }

    private static Category category(String name, int displayOrder, boolean active) {
        return Category.builder().name(name).displayOrder(displayOrder).active(active).build();
    }
}
