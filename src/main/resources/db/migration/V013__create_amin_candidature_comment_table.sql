CREATE TABLE admin_candidature_comments
(
    candidature_id VARCHAR(36)  PRIMARY KEY,

    text        TEXT      NULL,
    text_updated_at  TIMESTAMP NULL,

    CONSTRAINT fk_candidature_comment FOREIGN KEY (candidature_id) REFERENCES candidatures (id) ON DELETE CASCADE
);
