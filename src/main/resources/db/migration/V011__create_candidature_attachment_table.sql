CREATE TABLE candidature_attachments
(
    attachment_id  VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidature_id VARCHAR(36)  NOT NULL,
    name           VARCHAR(255) NOT NULL,
    content_type   VARCHAR(255) NOT NULL,

    CONSTRAINT fk_candidature_attachment FOREIGN KEY (candidature_id) REFERENCES candidatures (id) ON DELETE CASCADE
);
