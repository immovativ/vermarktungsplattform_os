CREATE TABLE notifications
(
    id         VARCHAR(36) PRIMARY KEY,
    recipient  VARCHAR(255),
    subject    VARCHAR(255),
    html_text  TEXT,
    plain_text TEXT
);
