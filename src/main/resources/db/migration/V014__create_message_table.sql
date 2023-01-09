CREATE TABLE candidature_messages
(
    id VARCHAR(36)  PRIMARY KEY,
    candidature_id VARCHAR(36),
    direction VARCHAR(32),
    contents TEXT NOT NULL,
    seen_at  TIMESTAMP NULL,
    created  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attachment JSONB NULL,

    CONSTRAINT fk_candidature_message FOREIGN KEY (candidature_id) REFERENCES candidatures (id) ON DELETE CASCADE
);
