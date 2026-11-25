package de.ichbinhier.volunteerformservice.application.config;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Locale;

import javax.sql.DataSource;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Creates the index behind the per-address limit (`A26`). Before every submit
 * the limit looks up the address's Applications of the last 24 hours with
 * {@code upper(email) = upper(?)}. Without an index on that expression
 * PostgreSQL reads the whole table: 54 ms at 75,000 rows in the load test
 * ({@code load-test/RESULTS.md}), growing with every Application. Hibernate
 * cannot declare an index on an expression, so it is created here, after
 * Hibernate has updated the schema.
 */
@Slf4j
@Component
@DependsOn("entityManagerFactory")
@RequiredArgsConstructor
public class ApplicationEmailIndexMigration implements InitializingBean {

    private final DataSource dataSource;

    @Override
    public void afterPropertiesSet() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            if (productName == null || !productName.toLowerCase(Locale.ROOT).contains("postgresql")) {
                return;
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "CREATE INDEX IF NOT EXISTS ix_applications_upper_email_submitted_at "
                                + "ON applications (upper(email), submitted_at)");
            }
            log.info("Ensured index ix_applications_upper_email_submitted_at for the per-address limit.");
        }
    }

}
