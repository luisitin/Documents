-- SYNTHETIC jzebedee/uscis SQLite fixture (SAMPLE, not a release download).
-- GitHub release assets were not reachable from the build sessions (07 WP5 "A synthetic jzebedee
-- SQLite fixture is built in the test"). The schema follows the jzebedee README v0.5
-- (docs/research/13-live-data-endpoints-and-probe-plan.md §1.2). The VALUES are the real
-- service_request_date figures of the 2026-10-15 release diff (docs/research/04-uscis-data-sources.md
-- §2.4, VERIFIED-CODE; key facts §6); range values are illustrative test inputs only (the research has
-- no 80 % figure from this source for that publication) and must never be published.
CREATE TABLE forms (name TEXT, description_en TEXT, description_es TEXT);
CREATE TABLE offices (code TEXT, description TEXT);
CREATE TABLE form_types (form_name TEXT, form_key TEXT, form_type TEXT, description_en TEXT, description_es TEXT, offices TEXT);
CREATE TABLE processing_time (form_name TEXT, office_code TEXT, form_note_en TEXT, form_note_es TEXT, form_subtype TEXT, publication_date TEXT,
  range_upper REAL, range_upper_unit TEXT, range_lower REAL, range_lower_unit TEXT, service_request_date TEXT,
  subtype_info_en TEXT, subtype_info_es TEXT, subtype_note_en TEXT, subtype_note_es TEXT);
INSERT INTO offices VALUES ('MIA','Miami FL'),('HIA','Hialeah FL'),('KND','Kendall FL'),('TAM','Tampa FL'),('HOU','Houston TX'),('NBC','National Benefits Center');
INSERT INTO form_types (form_name, form_key, form_type) VALUES
  ('I-485','131A','I-485 Employment'),('I-485','131A-FAM','I-485 Family'),('I-485','131A-HRIFA','I-485 All Other'),
  ('I-485','131B','I-485 Asylee'),('I-485','131C','I-485 Refugee'),('I-485','131T','I-485 Tvisa'),('I-485','131U','I-485 Uvisa'),
  ('I-765','147-C9','I-765 (c)(9)'),('I-765','147-C11','I-765 (c)(11)');
INSERT INTO processing_time (form_name, office_code, form_subtype, publication_date, range_upper, range_upper_unit, range_lower, range_lower_unit, service_request_date) VALUES
  ('I-485','MIA','131A-FAM','October 15, 2026',30,'Months',NULL,NULL,'Jun 17 2023'),
  ('I-485','HIA','131A-FAM','October 15, 2026',20,'Months',NULL,NULL,'Jul 05 2024'),
  ('I-485','KND','131A-FAM','October 15, 2026',22,'Months',NULL,NULL,'May 28 2024'),
  ('I-485','TAM','131A-FAM','October 15, 2026',18,'Months',NULL,NULL,'Aug 07 2024'),
  ('I-485','HOU','131A-FAM','October 15, 2026',26,'Months',NULL,NULL,'Oct 29 2023'),
  -- an older publication of the same office: readProcessingTimes keeps the newest only
  ('I-485','MIA','131A-FAM','October 18, 2024',49,'Months',26,'Months','Oct 07 2020'),
  ('I-765','NBC','147-C9','October 15, 2026',26,'Weeks',NULL,NULL,'Jun 13 2025'),
  ('I-765','NBC','147-C11','October 15, 2026',18,'Months',NULL,NULL,'Apr 26 2025'),
  -- not tracked (subtype outside the pipeline's set)
  ('I-485','MIA','131A','October 15, 2026',12,'Months',NULL,NULL,'Mar 27 2025');
