-- POST /api/v1/route-selections counts which way into the form an applicant
-- picks (A5). It keeps one number per fixed route and per Category and nothing
-- else: no row per selection, no time, nothing about the person.

CREATE TABLE route_selection_counts (
    route character varying(32) NOT NULL,
    selection_count bigint NOT NULL,
    CONSTRAINT route_selection_counts_pkey PRIMARY KEY (route),
    CONSTRAINT route_selection_counts_route_check CHECK (route IN ('COMMUNITY', 'SUPPORTING_MEMBER'))
);

INSERT INTO route_selection_counts (route, selection_count) VALUES ('COMMUNITY', 0);
INSERT INTO route_selection_counts (route, selection_count) VALUES ('SUPPORTING_MEMBER', 0);

ALTER TABLE categories ADD COLUMN selection_count bigint DEFAULT 0 NOT NULL;
