CREATE TABLE construction_sites
(
    construction_area_id VARCHAR(20),
    construction_site_id VARCHAR(20),
    comment text,
    fid varchar(20),
    "text" text,
    shape jsonb not null,
    PRIMARY KEY (construction_area_id, construction_site_id)
);
