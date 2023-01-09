CREATE TABLE user_data
(
    user_id      VARCHAR(36) PRIMARY KEY NOT NULL,
    account_type VARCHAR(255)            NOT NULL,
    company      VARCHAR(255)            NULL,
    street       VARCHAR(255)            NOT NULL,
    house_number VARCHAR(255)            NOT NULL,
    zip_code     VARCHAR(5)              NOT NULL,
    city         VARCHAR(255)            NOT NULL,

    salutation   VARCHAR(255)            NOT NULL,
    first_name   VARCHAR(255)            NOT NULL,
    last_name    VARCHAR(255)            NOT NULL,
    phone_number VARCHAR(255)            NOT NULL,

    created_at   TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
