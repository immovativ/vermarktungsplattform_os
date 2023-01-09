CREATE TABLE parcels
(
    parcel_id VARCHAR(20) not null,
    construction_area_id VARCHAR(20) not null,
    construction_site_id VARCHAR(20) not null,
    fid VARCHAR(20) not null,
    area varchar(10),
    parcel_type varchar(100) not null,
    shape jsonb not null,
    FOREIGN KEY (construction_area_id, construction_site_id) REFERENCES construction_sites (construction_area_id, construction_site_id),
    PRIMARY KEY (construction_area_id, construction_site_id, parcel_id)
);
