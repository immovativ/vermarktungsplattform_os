CREATE TABLE concept_assignments
(
    id               VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    state            VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP    NOT NULL   DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL   DEFAULT CURRENT_TIMESTAMP,
    assignment_start TIMESTAMP    NULL,
    assignment_end   TIMESTAMP    NULL,

    building_type    VARCHAR(32) NOT NULL,
    allowed_floors   SMALLINT NULL,
    allowed_building_height_meters FLOAT8 NULL,
    energy_text      VARCHAR(255) NULL,
    preview_image    VARCHAR(36) NULL,

    concept_assignment_type VARCHAR(40) NOT NULL,

    questions        JSONB NULL
);
