package de.ichbinhier.volunteerformservice.web.config;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.staff.Staff;


@Component
public class SessionManager {

    private final ConcurrentHashMap<String, Staff> sessions = new ConcurrentHashMap<>();

    public String createSession(Staff staff) {
        String token = java.util.UUID.randomUUID().toString();
        sessions.put(token, staff);
        return token;
    }

    public Staff getStaff(String token) {
        return sessions.get(token);
    }

    public void invalidateSession(String token) {
        sessions.remove(token);
    }

}
