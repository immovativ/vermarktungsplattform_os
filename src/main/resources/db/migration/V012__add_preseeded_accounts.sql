INSERT INTO users (email, id, name, password_hash, salt, role, status, created_at, updated_at, last_login)
VALUES ('projekt@dietenbach.de',
        '00000000-0000-0000-0000-000000000000',
        'Projektgruppe Dietenbach / ALW',
        '$e0801$RFpySmVVK3ozYzRpT09YUVpaRHRBTHpReThyTWRVKzk3cE5VOFVWbWU1QTdrUnp3VGpaVUhEL3MvZVpCTnR5Mnpkc1NLZDFTTGhQSkFlVVhTWW9OUVE9PQ==$yMrpOlH2I/QF+hgnhNevLOlqd7zmajUg7xEcNkUMTRtMwiZkHlOnXBSLa1YPYeCPAYQqC2YfpcOzh9TCW9ZFPg==',
        'DZrJeU+z3c4iOOXQZZDtALzQy8rMdU+97pNU8UVme5A7kRzwTjZUHD/s/eZBNty2zdsSKd1SLhPJAeUXSYoNQQ==',
        'PROJECT_GROUP',
        'ACTIVE',
        '2022-04-06 05:46:00',
        '2022-04-06 05:46:00',
        NULL);

INSERT INTO users (email, id, name, password_hash, salt, role, status, created_at, updated_at, last_login)
VALUES ('consulting@baurechtsamt.de',
        '00000000-0000-0000-0000-000000000001',
        'Baurechtsamt',
        '$e0801$d2djejFua2grdlNxbXk5bXVxL2JFdTVtb0dzTzBkRW02SnY4RjFOSnNLK0t3VEZxV1dnM0xWNjgvZ1Z0R3pkUjkydmZKY1BWa21KRUoreGt4Wm1HTXc9PQ==$rBQuFWCEYLpQwfZTbn3SGrLaV6O3AaQZc+vVWQkW3PmZdHepuqPFm1HyBP2k78HcbvqJpGSstNgrXOnIr+wryw==',
        'wgcz1nkh+vSqmy9muq/bEu5moGsO0dEm6Jv8F1NJsK+KwTFqWWg3LV68/gVtGzdR92vfJcPVkmJEJ+xkxZmGMw==',
        'CONSULTING',
        'ACTIVE',
        '2022-04-06 05:46:00',
        '2022-04-06 05:46:00',
        NULL);

INSERT INTO users (email, id, name, password_hash, salt, role, status, created_at, updated_at, last_login)
VALUES ('bewerber@dietenbach.de',
        '00000000-0000-0000-0000-000000000002',
        'Bewerber:in Slot 1',
        '$e0801$MlgvREgwYXlKNEpmOTI3NnpaN3ljWG1aQkdiOElrQTV4MmM2OHJxcDI4ZWtKOVFWT3d3WFd4dHNQTGJUbEl4QjE0eGNMVFByUWdacllVbnlscE5ZZHc9PQ==$UF18cVr2+8dzupIvynm9z6ZWHJALwmZf52oN9NRRvw+5SuMgfltDPvS+XgOXqWq8RduoWBPGHNj67ZvepwRBCw==',
        '2X/DH0ayJ4Jf9276zZ7ycXmZBGb8IkA5x2c68rqp28ekJ9QVOwwXWxtsPLbTlIxB14xcLTPrQgZrYUnylpNYdw==',
        'CANDIDATE',
        'ACTIVE',
        '2022-04-06 05:46:00',
        '2022-04-06 05:46:00',
        NULL);

INSERT INTO user_data (user_id, account_type, company, street, house_number, zip_code, city, salutation, first_name,
                       last_name, phone_number)
VALUES ('00000000-0000-0000-0000-000000000002',
        'COMPANY',
        'Yolo GmbH',
        'Dietenbachstrasse',
        '1',
        '76131',
        'Karlsruhe',
        'HERR',
        'Bernhard',
        'Berwerber',
        '+49 761-664-064-064');
