CREATE TABLE candidatures
(
    id                    VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    concept_assignment_id VARCHAR(36)             NOT NULL,
    user_id               VARCHAR(36)             NOT NULL,

    description           TEXT                    NOT NULL,
    state                 VARCHAR(255)            NOT NULL,

    answers               JSONB,

    created_at            TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,

    admin_rating          SMALLINT                NULL DEFAULT NULL,

    UNIQUE (concept_assignment_id, user_id),

    CONSTRAINT fk_candidature_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_concept_assignment_id FOREIGN KEY (concept_assignment_id) REFERENCES concept_assignments (id) ON DELETE CASCADE
);
