-- ddl-auto=update created each enum check constraint once and never widened it
-- when a constant was added later (ACCEPTED, for one). A database baselined at
-- V1 may still carry such an outdated list, so every enum check is rebuilt here
-- from the current enums. On a database V1 created, this changes nothing.

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN (
    'NEW', 'IN_REVIEW', 'INTRO_BOOKED', 'ACCEPTED', 'ACTIVE', 'WAITLISTED', 'DECLINED'));

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_weekly_time_check;
ALTER TABLE applications ADD CONSTRAINT applications_weekly_time_check CHECK (weekly_time IN (
    'HOURS_1_2', 'HOURS_3_5', 'HOURS_5_PLUS', 'IRREGULAR'));

ALTER TABLE state_changes DROP CONSTRAINT IF EXISTS state_changes_field_check;
ALTER TABLE state_changes ADD CONSTRAINT state_changes_field_check CHECK (field IN (
    'STATUS', 'OWNER', 'DISCARDED'));

ALTER TABLE onboarding_step_completions DROP CONSTRAINT IF EXISTS onboarding_step_completions_step_check;
ALTER TABLE onboarding_step_completions ADD CONSTRAINT onboarding_step_completions_step_check CHECK (step IN (
    'RULES', 'COMMUNITY_GROUP', 'DIGITAL_DEMOCRACY_LAB', 'CONTACT'));
