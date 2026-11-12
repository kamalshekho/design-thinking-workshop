package de.ichbinhier.volunteerformservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class VolunteerFormServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VolunteerFormServiceApplication.class, args);
    }

}
