package de.ichbinhier.volunteerformservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:end_to_end;DB_CLOSE_DELAY=-1")
@ActiveProfiles("test")
class ApplicationEndToEndTest {

    @LocalServerPort private int port;
    @Autowired private CategoryRepository categories;
    @Autowired private StaffRepository staff;
    @Autowired private PasswordEncoder passwords;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void submittedApplicationCanBeReviewedByStaff() throws Exception {
        Category category = categories.save(Category.builder()
                .name("Social Media").description("").active(true).displayOrder(1).build());
        staff.save(Staff.builder().name("Team Member").email("staff@example.org")
                .passwordHash(passwords.encode("correct-password")).build());

        var submitted = send("POST", "/api/v1/applications", """
                {"submissionId":"%s","categoryId":"%s","name":"Anna Müller",
                 "email":"anna@example.org","weeklyTime":"HOURS_1_2",
                 "privacyConsent":true,"consentTextVersion":"2026-09"}
                """.formatted(UUID.randomUUID(), category.getId()), null);
        assertThat(submitted.statusCode()).isEqualTo(201);
        String id = submitted.body().replaceAll(".*\\\"applicationId\\\":\\\"([^\\\"]+)\\\".*", "$1");
        assertThat(UUID.fromString(id)).isNotNull();

        assertThat(send("GET", "/api/v1/staff/applications", null, null).statusCode()).isEqualTo(401);
        var login = send("POST", "/api/v1/staff/session",
                "{\"email\":\"staff@example.org\",\"password\":\"correct-password\"}", null);
        assertThat(login.statusCode()).isEqualTo(200);
        String cookie = login.headers().firstValue("set-cookie").orElseThrow().split(";", 2)[0];

        var list = send("GET", "/api/v1/staff/applications", null, cookie);
        assertThat(list.statusCode()).isEqualTo(200);
        assertThat(list.body()).contains(id, "Anna Müller");

        var updated = send("PATCH", "/api/v1/staff/applications/" + id,
                "{\"status\":\"IN_REVIEW\"}", cookie);
        assertThat(updated.statusCode()).isEqualTo(200);
        assertThat(updated.body()).contains("IN_REVIEW");
        assertThat(send("GET", "/api/v1/staff/applications", null, cookie).body())
                .contains(id, "IN_REVIEW");
    }

    private HttpResponse<String> send(String method, String path, String body, String cookie)
            throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (cookie != null) request.header("Cookie", cookie);
        if (body != null) request.header("Content-Type", "application/json");
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body));
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
