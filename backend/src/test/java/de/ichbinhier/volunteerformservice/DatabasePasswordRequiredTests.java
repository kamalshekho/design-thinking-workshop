package de.ichbinhier.volunteerformservice;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

/**
 * The database password has no default, and a missing one stops the start
 * instead of being sent to the database as the text {@code ${DB_PASSWORD}}.
 */
class DatabasePasswordRequiredTests {

    @Test
    void refusesToStartWithoutDbPassword() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty(DatabasePasswordRequired.PROPERTY, "${DB_PASSWORD}");

        assertThatThrownBy(() -> check(environment))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DB_PASSWORD is not set");
    }

    @Test
    void startsWithDbPassword() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty(DatabasePasswordRequired.PROPERTY, "${DB_PASSWORD}")
                .withProperty("DB_PASSWORD", "from the environment");

        assertThatCode(() -> check(environment)).doesNotThrowAnyException();
    }

    private static void check(MockEnvironment environment) {
        DatabasePasswordRequired check = new DatabasePasswordRequired();
        check.setEnvironment(environment);
        check.postProcessBeanFactory(null);
    }

}
