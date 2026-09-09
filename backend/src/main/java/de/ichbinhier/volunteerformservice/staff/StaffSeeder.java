package de.ichbinhier.volunteerformservice.staff;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;

import lombok.RequiredArgsConstructor;

/**
 * One account per Staff member (`A1`, `A17`). There is no self-registration and
 * no user administration anywhere in the dashboard, so this is the only way an
 * account comes into being.
 *
 * <p>The five people are invented; the addresses sit at the association's real
 * domain and are sign-in identities only — no mail is ever sent to a Staff
 * member, so none of these mailboxes has to exist (`A17`).
 *
 * <p>Second of the seeders, after the Categories: the retirement below reaches
 * into the Applications, and the demo seed that runs third needs these accounts
 * to hand an Owner to.
 */
@Component
@Profile("!test")
@Order(2)
@RequiredArgsConstructor
public class StaffSeeder implements ApplicationRunner {

    /** The address of the single hard-coded account this seeder replaces. */
    private static final String RETIRED_ACCOUNT = "staff@ichbinhier.example";

    static final List<SeededMember> MEMBERS = List.of(
            new SeededMember("Ashton Blackwell", "ashton.blackwell@ichbinhier.online"),
            new SeededMember("Samuel Adeyemi", "samuel.adeyemi@ichbinhier.online"),
            new SeededMember("Marlene Kirchner", "marlene.kirchner@ichbinhier.online"),
            new SeededMember("Tomasz Wieczorek", "tomasz.wieczorek@ichbinhier.online"),
            new SeededMember("Yasmin Sadeghi", "yasmin.sadeghi@ichbinhier.online"));

    private final StaffRepository staffRepo;
    private final ApplicationRepository applications;
    private final PasswordEncoder passwordEncoder;
    private final StaffSeedProperties passwords;

    /**
     * Seeded by address rather than behind one {@code count() > 0} check, so a
     * database that already holds some of the five gets the rest, and a missing
     * password is only fatal for an account that is actually absent — an
     * already-seeded deployment keeps starting without the variables it no
     * longer needs.
     */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (int position = 1; position <= MEMBERS.size(); position++) {
            SeededMember member = MEMBERS.get(position - 1);
            if (staffRepo.findByEmail(member.email()).isPresent()) {
                continue;
            }
            staffRepo.save(Staff.builder()
                    .name(member.name())
                    .email(member.email())
                    .passwordHash(passwordEncoder.encode(passwords.passwordFor(position)))
                    .build());
        }

        retireTheHardCodedAccount();
    }

    /**
     * Earlier builds seeded one account whose password was a literal in this
     * file, and it stays a working key to the dashboard on every machine that
     * ever ran them. It may own Applications, so it is taken off those first —
     * clearing an Owner is what the write path already does for
     * {@code ownerId: null} — and both steps share this method's transaction.
     */
    private void retireTheHardCodedAccount() {
        staffRepo.findByEmail(RETIRED_ACCOUNT).ifPresent(retired -> {
            List<Application> owned = applications.findAllByOwnerId(retired.getId());
            owned.forEach(application -> application.setOwner(null));
            applications.saveAll(owned);
            staffRepo.delete(retired);
        });
    }

    record SeededMember(String name, String email) {
    }

}
