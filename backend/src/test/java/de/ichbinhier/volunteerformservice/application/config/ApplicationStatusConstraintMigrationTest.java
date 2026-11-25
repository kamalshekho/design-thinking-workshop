package de.ichbinhier.volunteerformservice.application.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Statement;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApplicationStatusConstraintMigrationTest {

    @Test
    void recreatesCheckConstraintWithAllStatusesOnPostgres() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        DatabaseMetaData metaData = mock(DatabaseMetaData.class);
        Statement statement = mock(Statement.class);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(metaData);
        when(metaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(connection.createStatement()).thenReturn(statement);

        ApplicationStatusConstraintMigration migration = new ApplicationStatusConstraintMigration(dataSource);
        migration.afterPropertiesSet();

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(statement, times(2)).execute(sqlCaptor.capture());

        assertThat(sqlCaptor.getAllValues().get(0))
                .isEqualTo("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
        String addConstraintSql = sqlCaptor.getAllValues().get(1);
        assertThat(addConstraintSql)
                .startsWith("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN (");
        for (ApplicationStatus status : ApplicationStatus.values()) {
            assertThat(addConstraintSql).contains("'" + status.name() + "'");
        }
    }

    @Test
    void skipsMigrationOnNonPostgresAndNullProductName() throws Exception {
        for (String productName : new String[] { "H2", null }) {
            DataSource dataSource = mock(DataSource.class);
            Connection connection = mock(Connection.class);
            DatabaseMetaData metaData = mock(DatabaseMetaData.class);

            when(dataSource.getConnection()).thenReturn(connection);
            when(connection.getMetaData()).thenReturn(metaData);
            when(metaData.getDatabaseProductName()).thenReturn(productName);

            ApplicationStatusConstraintMigration migration = new ApplicationStatusConstraintMigration(dataSource);
            migration.afterPropertiesSet();

            verify(connection, never()).createStatement();
        }
    }

}
