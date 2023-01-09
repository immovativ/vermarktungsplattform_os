CREATE TABLE concept_assignment_attachments
(
    attachment_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id    VARCHAR(36) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    content_type  VARCHAR(255) NOT NULL,

    CONSTRAINT fk_concept_assignment_attachment FOREIGN KEY(assignment_id) REFERENCES concept_assignments(id)
);
