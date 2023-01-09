CREATE TABLE users
(
    id            VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    salt          VARCHAR(255),
    role          VARCHAR(255) NOT NULL,
    status        VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL   DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL   DEFAULT CURRENT_TIMESTAMP,
    last_login    TIMESTAMP    NULL       DEFAULT NULL,

    CONSTRAINT user_email_unique UNIQUE (email)
);
