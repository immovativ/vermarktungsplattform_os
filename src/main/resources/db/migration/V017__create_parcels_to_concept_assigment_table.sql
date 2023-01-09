CREATE TABLE parcels_to_concept_assignments
(
    id BIGSERIAL PRIMARY KEY,
    parcel_id VARCHAR(20) not null,
    construction_area_id VARCHAR(20) not null,
    construction_site_id VARCHAR(20) not null,
    concept_assignment_id VARCHAR(36) not null,
    FOREIGN KEY (construction_area_id, construction_site_id, parcel_id) REFERENCES parcels (construction_area_id, construction_site_id, parcel_id),
    FOREIGN KEY (concept_assignment_id) REFERENCES concept_assignments (id)
);
