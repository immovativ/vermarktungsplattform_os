CREATE TABLE password_reset
(
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- only one password reset per email
    CONSTRAINT email_unique UNIQUE (email)
);
