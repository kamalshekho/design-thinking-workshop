package de.ichbinhier.volunteerformservice.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeField;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

/**
 * The demo week and the State changes that lead to it. What is worth testing is
 * not the thirteen texts but the contract `dashboard/API.md` puts on any seed:
 * the state an Application is in has to be reconstructible from its rows, and
 * the trailing week has to hold enough movement for Übersicht's three cards.
 *
 * <p>The seeder is a {@code demo} bean, so it is built by hand here — the suite
 * runs under {@code test}. The class is transactional because the backdating of
 * {@code submittedAt} is a native statement and needs one.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DemoSeederTests {

    private static final int TRAILING_WEEK_DAYS = 7;

    @Autowired private ApplicationRepository applications;

    @Autowired private StateChangeRepository stateChanges;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @PersistenceContext private EntityManager entityManager;

    private Instant startedAt;

    @BeforeEach
    void reset() {
        stateChanges.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        List<String> categoryNames = List.of("Social Media", "Redaktion / Öffentlichkeitsarbeit",
                "Rechtliche Unterstützung", "Etwas anderes");
        IntStream.range(0, categoryNames.size()).forEach(index -> categories.save(Category.builder()
                .name(categoryNames.get(index))
                .description("")
                .displayOrder(index + 1)
                .active(true)
                .build()));

        IntStream.rangeClosed(1, 5).forEach(position -> staffMembers.save(Staff.builder()
                .name("Staff Member " + position)
                .email("staff-" + position + "@ichbinhier.online")
                .passwordHash("hash")
                .build()));
    }

    @Test
    void seedsEveryStatusBothOwnershipStatesAndAFewDiscarded() {
        List<Application> seeded = seed();

        assertThat(seeded).hasSize(DemoSeeder.SEEDS.size());
        assertThat(seeded).extracting(Application::getStatus)
                .containsAll(List.of(ApplicationStatus.values()));
        assertThat(seeded).anyMatch(application -> application.getOwner() != null);
        assertThat(seeded).anyMatch(application -> application.getOwner() == null);
        assertThat(seeded).filteredOn(application -> application.getDiscardedAt() != null)
                .hasSizeGreaterThanOrEqualTo(2);
    }

    /** Every Category is used, so Anfragen's Category filter has something to do. */
    @Test
    void spreadsTheWeekAcrossAllFourCategories() {
        List<Application> seeded = seed();

        assertThat(seeded).extracting(application -> application.getCategory().getName())
                .containsAll(categories.findByOrderByDisplayOrderAsc().stream()
                        .map(Category::getName)
                        .toList());
    }

    /**
     * The rule the whole seed exists for (`dashboard/API.md`, "Which makes
     * seeding part of this contract"): replaying an Application's rows in order
     * has to arrive at exactly the state it is in — no row means NEW, unowned
     * and in the working list.
     */
    @Test
    void everyStateIsReconstructibleFromTheChangesThatLeadToIt() {
        for (Application application : seed()) {
            ApplicationStatus status = ApplicationStatus.NEW;
            String ownerId = null;
            Instant discardedAt = null;

            for (StateChange change : changesOf(application)) {
                switch (change.getField()) {
                    case STATUS -> status = ApplicationStatus.valueOf(change.getToValue());
                    case OWNER -> ownerId = change.getToValue();
                    case DISCARDED -> discardedAt =
                            Boolean.parseBoolean(change.getToValue()) ? change.getChangedAt() : null;
                }
            }

            assertThat(application.getStatus()).as("status of %s", application.getName())
                    .isEqualTo(status);
            assertThat(application.getOwner() == null
                            ? null
                            : application.getOwner().getId().toString())
                    .as("owner of %s", application.getName())
                    .isEqualTo(ownerId);
            assertThat(application.getDiscardedAt()).as("discarded state of %s",
                            application.getName())
                    .isEqualTo(discardedAt);
        }
    }

    /** A change to an Application that had not arrived yet is not a history. */
    @Test
    void noChangePredatesItsApplicationOrLiesInTheFuture() {
        for (Application application : seed()) {
            assertThat(changesOf(application))
                    .allSatisfy(change -> assertThat(change.getChangedAt())
                            .as("%s: %s", application.getName(), change.getField())
                            .isBetween(application.getSubmittedAt(), startedAt));
        }
    }

    /**
     * {@code submittedAt} carries {@code @CreationTimestamp} and a column that is
     * not updatable, so this is the assertion that the native backdate actually
     * lands: without it every Application arrived at start-up and the week is one
     * spike.
     */
    @Test
    void backdatesTheApplicationsAcrossTwoWeeksRatherThanStartUp() {
        List<Instant> arrivals = seed().stream().map(Application::getSubmittedAt).toList();

        assertThat(arrivals).allSatisfy(at -> assertThat(at).isBefore(startedAt));
        assertThat(arrivals).filteredOn(at -> daysBefore(at) >= TRAILING_WEEK_DAYS)
                .as("older than seven days, for Übersicht's third card (A19)")
                .isNotEmpty();
        assertThat(arrivals).filteredOn(at -> daysBefore(at) < TRAILING_WEEK_DAYS)
                .as("inside the trailing week")
                .isNotEmpty();
    }

    /**
     * Each of Übersicht's three cards reads one of the three fields, and a card
     * whose field never changes inside the trailing seven days shows a flat line
     * however honest the replay is.
     */
    @Test
    void movesAllThreeFieldsInsideTheTrailingWeek() {
        seed();
        Instant weekAgo = startedAt.minus(TRAILING_WEEK_DAYS, ChronoUnit.DAYS);
        List<StateChange> recent =
                stateChanges.findByChangedAtGreaterThanEqualOrderByChangedAtAsc(weekAgo);

        assertThat(recent).extracting(StateChange::getField)
                .containsAll(List.of(StateChangeField.values()));
    }

    /** The one move that has to be a row with no value: an Owner handed back. */
    @Test
    void clearsAnOwnerAtLeastOnce() {
        seed();

        assertThat(stateChanges.findAll())
                .filteredOn(change -> change.getField() == StateChangeField.OWNER)
                .anyMatch(change -> change.getToValue() == null);
    }

    /** An Application crossing the seven-day line during the week is what makes that card rise. */
    @Test
    void letsSomeApplicationsCrossTheSevenDayLineDuringTheWeek() {
        assertThat(seed())
                .filteredOn(application -> {
                    long days = daysBefore(application.getSubmittedAt());
                    return days >= TRAILING_WEEK_DAYS && days < 2 * TRAILING_WEEK_DAYS;
                })
                .isNotEmpty();
    }

    /**
     * All-or-nothing: a restart mid-demo must not duplicate the week, and must
     * not bring back a set somebody cleared on purpose.
     */
    @Test
    void leavesADatabaseThatAlreadyHasApplicationsAlone() {
        seed();
        long afterTheFirstRun = applications.count();
        long changesAfterTheFirstRun = stateChanges.count();

        seed();

        assertThat(applications.count()).isEqualTo(afterTheFirstRun);
        assertThat(stateChanges.count()).isEqualTo(changesAfterTheFirstRun);
    }

    /**
     * Runs the seeder and re-reads: the backdate is a native statement, so the
     * entities left in the persistence context still carry the start-up
     * timestamp the insert minted.
     */
    private List<Application> seed() {
        startedAt = Instant.now();
        new DemoSeeder(applications, stateChanges, categories, staffMembers, entityManager)
                .run(null);
        entityManager.flush();
        entityManager.clear();
        return applications.findAll();
    }

    private List<StateChange> changesOf(Application application) {
        return stateChanges.findAll().stream()
                .filter(change -> change.getApplication().getId().equals(application.getId()))
                .sorted(Comparator.comparing(StateChange::getChangedAt))
                .toList();
    }

    private long daysBefore(Instant at) {
        return Duration.between(at, startedAt).toDays();
    }

}
