package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SessionManager;

/**
 * What an open dashboard actually receives. Without these three events the
 * stream carries nothing but heartbeats and "the Application appears while you
 * watch" does not happen. See `dashboard/API.md`, "The live stream".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardStreamTests {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private StateChangeRepository changes;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SessionManager sessions;

    private final List<MvcResult> openStreams = new ArrayList<>();

    private Category socialMedia;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        changes.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        socialMedia = categories.save(
                Category.builder().name("Social Media").displayOrder(1).active(true).build());
        Staff ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.example")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", sessions.createSession(ashton));
    }

    /** A stream left open would keep receiving the next test class's events. */
    @AfterEach
    void closeStreams() {
        openStreams.forEach(stream -> stream.getRequest().getAsyncContext().complete());
        openStreams.clear();

        changes.deleteAll();
        applications.deleteAll();
    }

    @Test
    void marksTheStreamUnbuffered() throws Exception {
        MvcResult stream = openStream();

        assertThat(stream.getResponse().getHeader("X-Accel-Buffering")).isEqualTo("no");
        assertThat(stream.getResponse().getContentType())
                .startsWith(MediaType.TEXT_EVENT_STREAM_VALUE);
    }

    @Test
    void announcesAnApplicationTheFormJustStored() throws Exception {
        MvcResult stream = openStream();

        mvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submission(UUID.randomUUID())))
                .andExpect(status().isCreated());

        assertThat(eventsOn(stream))
                .singleElement()
                .satisfies(event -> {
                    assertThat(event.name()).isEqualTo("application.created");
                    assertThat(dataOf(event)).isEqualTo(onlyApplicationOnTheList());
                });
    }

    @Test
    void staysSilentForARepeatedSubmissionId() throws Exception {
        UUID submissionId = UUID.randomUUID();
        MvcResult stream = openStream();

        mvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submission(submissionId)))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submission(submissionId)))
                .andExpect(status().isCreated());

        assertThat(eventsOn(stream)).hasSize(1);
    }

    @Test
    void announcesEveryChangeAStaffMemberMakes() throws Exception {
        Application onFile = applications.save(application());
        MvcResult stream = openStream();

        patchApplication(onFile, "{\"status\":\"IN_REVIEW\"}");
        patchApplication(onFile, "{\"discarded\":true}");

        List<StreamEvent> events = eventsOn(stream);
        assertThat(events).extracting(StreamEvent::name)
                .containsExactly("application.updated", "application.updated");
        assertThat(dataOf(events.get(0))).containsEntry("status", "IN_REVIEW");
        assertThat(dataOf(events.get(1))).extractingByKey("discardedAt").isNotNull();
        assertThat(dataOf(events.get(1))).isEqualTo(onlyApplicationOnTheList());
    }

    /**
     * The erased Application arrives whole, in the same shape as the others,
     * because the dashboard holds it on the Verworfen screen too and needs the
     * row to know what to drop.
     */
    @Test
    void announcesAPermanentEraseWithTheApplicationItErased() throws Exception {
        Application onFile = applications.save(application());
        patchApplication(onFile, "{\"discarded\":true}");
        Map<String, Object> beforeTheErase = onlyApplicationOnTheList();

        MvcResult stream = openStream();
        mvc.perform(delete("/api/v1/staff/applications/" + onFile.getId() + "/permanently")
                        .cookie(signIn))
                .andExpect(status().isNoContent());

        assertThat(eventsOn(stream))
                .singleElement()
                .satisfies(event -> {
                    assertThat(event.name()).isEqualTo("application.deleted");
                    assertThat(dataOf(event)).isEqualTo(beforeTheErase);
                });
        assertThat(applications.findById(onFile.getId())).isEmpty();
    }

    @Test
    void reachesEveryOpenStreamIncludingTheOnesThatCausedTheChange() throws Exception {
        Application onFile = applications.save(application());
        MvcResult first = openStream();
        MvcResult second = openStream();

        patchApplication(onFile, "{\"status\":\"INTRO_BOOKED\"}");

        assertThat(eventsOn(first)).hasSize(1);
        assertThat(eventsOn(second)).hasSize(1);
        assertThat(eventsOn(first).get(0).data()).isEqualTo(eventsOn(second).get(0).data());
    }

    @Test
    void numbersTheEventsMonotonically() throws Exception {
        Application onFile = applications.save(application());
        MvcResult stream = openStream();

        patchApplication(onFile, "{\"status\":\"IN_REVIEW\"}");
        patchApplication(onFile, "{\"status\":\"INTRO_BOOKED\"}");

        List<Long> ids = eventsOn(stream).stream().map(StreamEvent::id).toList();
        assertThat(ids).hasSize(2);
        assertThat(ids.get(1)).isGreaterThan(ids.get(0));
    }

    private MvcResult openStream() throws Exception {
        MvcResult stream = mvc.perform(get("/api/v1/staff/events").cookie(signIn))
                .andExpect(request().asyncStarted())
                .andReturn();
        openStreams.add(stream);
        return stream;
    }

    private void patchApplication(Application application, String body) throws Exception {
        mvc.perform(patch("/api/v1/staff/applications/" + application.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    private Map<String, Object> onlyApplicationOnTheList() throws Exception {
        String body = mvc.perform(get("/api/v1/staff/applications").cookie(signIn))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        List<Map<String, Object>> listed = JsonPath.read(body, "$.applications");
        assertThat(listed).hasSize(1);
        return listed.get(0);
    }

    /**
     * The heartbeat comments are skipped; what is left is the {@code id},
     * {@code event} and {@code data} of each event, in the order the stream
     * sent them.
     */
    private static List<StreamEvent> eventsOn(MvcResult stream) throws Exception {
        List<StreamEvent> events = new ArrayList<>();
        long id = 0;
        String name = null;

        for (String line : stream.getResponse()
                .getContentAsString(StandardCharsets.UTF_8)
                .split("\n")) {
            if (line.startsWith("id:")) {
                id = Long.parseLong(line.substring("id:".length()).trim());
            } else if (line.startsWith("event:")) {
                name = line.substring("event:".length()).trim();
            } else if (line.startsWith("data:") && name != null) {
                events.add(new StreamEvent(id, name, line.substring("data:".length())));
                name = null;
            }
        }

        return events;
    }

    private static Map<String, Object> dataOf(StreamEvent event) {
        return JsonPath.read(event.data(), "$");
    }

    private record StreamEvent(long id, String name, String data) {}

    private Application application() {
        return Application.builder()
                .submissionId(UUID.randomUUID())
                .category(socialMedia)
                .name("Anna Müller")
                .email("anna@example.de")
                .weeklyTime(WeeklyTime.HOURS_1_2)
                .about("Ich arbeite seit drei Jahren in der Moderation.")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .build();
    }

    private String submission(UUID submissionId) {
        return """
               {
                 "submissionId": "%s",
                 "categoryId": "%s",
                 "name": "Anna Müller",
                 "email": "anna@example.de",
                 "weeklyTime": "HOURS_1_2",
                 "about": "Ich arbeite seit drei Jahren in der Moderation.",
                 "privacyConsent": true,
                 "consentTextVersion": "2026-09",
                 "website": ""
               }
               """
                .formatted(submissionId, socialMedia.getId());
    }

}
