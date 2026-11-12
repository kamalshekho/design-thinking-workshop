package de.ichbinhier.volunteerformservice;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Refuses to start when {@code DB_PASSWORD} is not set.
 *
 * <p>{@code application.properties} gives the database password no default, so
 * that no deployment runs on a password written in this repo. Spring Boot binds
 * an unresolved placeholder as its literal text, though, and would then try
 * {@code ${DB_PASSWORD}} as the password: a database that accepts any password
 * would let that start. Checked as a bean factory post-processor so it runs
 * before the data source is created.
 */
@Component
class DatabasePasswordRequired implements BeanFactoryPostProcessor, EnvironmentAware {

    static final String PROPERTY = "spring.datasource.password";

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
        try {
            environment.getProperty(PROPERTY);
        } catch (IllegalArgumentException unresolved) {
            throw new IllegalStateException(
                    "DB_PASSWORD is not set. The backend has no default database password; "
                            + "set DB_PASSWORD in the environment (see \"Running locally\" in backend/README.md).",
                    unresolved);
        }
    }

}
