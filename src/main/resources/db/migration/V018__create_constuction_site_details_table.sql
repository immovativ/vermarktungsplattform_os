CREATE TABLE construction_site_details
(
    construction_area_id VARCHAR(20) not null,
    construction_site_id VARCHAR(20) not null,
    form text not null,
    zoning_classification text not null,
    level_of_built_development text not null,
    market_segments text not null,
    energy_supply text not null,
    mobility text not null,
    clearance text not null,
    area_building_block text not null,
    plot_area_to_be_built_on text not null,
    land_price_per_sqm text not null,
    FOREIGN KEY (construction_area_id, construction_site_id) REFERENCES construction_sites (construction_area_id, construction_site_id),
    PRIMARY KEY (construction_area_id, construction_site_id)
);
