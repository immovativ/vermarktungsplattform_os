CREATE TABLE texts
(
    name  VARCHAR(255) NOT NULL,
    value TEXT         NOT NULL,

    CONSTRAINT text_name_unique UNIQUE (name)
);
