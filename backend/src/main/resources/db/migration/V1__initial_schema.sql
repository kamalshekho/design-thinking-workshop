-- The schema as Hibernate created it with ddl-auto before Flyway took over.
-- A database that already holds these tables is baselined at this version
-- (spring.flyway.baseline-on-migrate), so this script only runs on an empty one.

CREATE TABLE categories (
    id uuid NOT NULL,
    name character varying(60) NOT NULL,
    description character varying(140),
    display_order integer NOT NULL,
    active boolean NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE staff_members (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT staff_members_pkey PRIMARY KEY (id),
    CONSTRAINT staff_members_email_key UNIQUE (email)
);

CREATE TABLE applications (
    id uuid NOT NULL,
    submission_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(254) NOT NULL,
    weekly_time character varying(32) NOT NULL,
    about character varying(2000),
    consent_text_version character varying(32) NOT NULL,
    consent_at timestamp(6) with time zone NOT NULL,
    submitted_at timestamp(6) with time zone NOT NULL,
    status character varying(32) NOT NULL,
    owner_id uuid,
    internal_notes character varying(4000),
    discarded_at timestamp(6) with time zone,
    onboarding_token character varying(128),
    CONSTRAINT applications_pkey PRIMARY KEY (id),
    CONSTRAINT uk_applications_submission_id UNIQUE (submission_id),
    CONSTRAINT applications_onboarding_token_key UNIQUE (onboarding_token),
    CONSTRAINT fk_applications_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_applications_owner FOREIGN KEY (owner_id) REFERENCES staff_members (id),
    CONSTRAINT applications_status_check CHECK (status IN (
        'NEW', 'IN_REVIEW', 'INTRO_BOOKED', 'ACCEPTED', 'ACTIVE', 'WAITLISTED', 'DECLINED')),
    CONSTRAINT applications_weekly_time_check CHECK (weekly_time IN (
        'HOURS_1_2', 'HOURS_3_5', 'HOURS_5_PLUS', 'IRREGULAR'))
);

CREATE TABLE state_changes (
    id uuid NOT NULL,
    application_id uuid NOT NULL,
    changed_at timestamp(6) with time zone NOT NULL,
    field character varying(32) NOT NULL,
    to_value text,
    CONSTRAINT state_changes_pkey PRIMARY KEY (id),
    CONSTRAINT fk_state_changes_application FOREIGN KEY (application_id) REFERENCES applications (id),
    CONSTRAINT state_changes_field_check CHECK (field IN ('STATUS', 'OWNER', 'DISCARDED'))
);

CREATE TABLE onboarding_step_completions (
    id uuid NOT NULL,
    application_id uuid NOT NULL,
    step character varying(64) NOT NULL,
    completed_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT onboarding_step_completions_pkey PRIMARY KEY (id),
    CONSTRAINT uk_onboarding_steps_application_step UNIQUE (application_id, step),
    CONSTRAINT fk_onboarding_steps_application FOREIGN KEY (application_id) REFERENCES applications (id),
    CONSTRAINT onboarding_step_completions_step_check CHECK (step IN (
        'RULES', 'COMMUNITY_GROUP', 'DIGITAL_DEMOCRACY_LAB', 'CONTACT'))
);
