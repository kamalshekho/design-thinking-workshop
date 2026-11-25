package de.ichbinhier.volunteerformservice.application.config;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Keeps PostgreSQL's {@code applications_status_check} constraint aligned with
 * {@link ApplicationStatus}. Hibernate 6 creates this check constraint on a
 * fresh schema for {@code @Enumerated(EnumType.STRING)}, but {@code ddl-auto=update}
 * does not widen it when a new enum constant such as {@code ACCEPTED} is added.
 */
@Slf4j
@Component
@DependsOn("entityManagerFactory")
@RequiredArgsConstructor
public class ApplicationStatusConstraintMigration implements InitializingBean {

    private final DataSource dataSource;

    @Override
    public void afterPropertiesSet() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            if (productName == null || !productName.toLowerCase(Locale.ROOT).contains("postgresql")) {
                return;
            }

            String allowed = Arrays.stream(ApplicationStatus.values())
                    .map(status -> "'" + status.name() + "'")
                    .collect(Collectors.joining(", "));

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
                statement.execute(
                        "ALTER TABLE applications ADD CONSTRAINT applications_status_check "
                                + "CHECK (status IN (" + allowed + "))");
            }
            log.info("Ensured applications_status_check allows all {} ApplicationStatus values.",
                    ApplicationStatus.values().length);
        }
    }

}
