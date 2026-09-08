package de.ichbinhier.volunteerformservice.email;

// Sends one transactional email. Implementations are swappable — the rest of
// the codebase only depends on this interface, never on a provider directly.
public interface EmailSender {

    void send(String toAddress, String subject, String htmlBody);

}
