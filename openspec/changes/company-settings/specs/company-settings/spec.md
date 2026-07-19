# Company Settings Specification

## Purpose

Company-level configuration: business name, work calendar, operating hours, default language. REST API at `/api/v1/settings`, consumed by SettingsPage form and sidebar.

## Requirements

### Requirement: Settings Schema

Single-row `company_settings` table. Seed migration inserts defaults: name="Bark & Bubbles", workdays=[1,2,3,4,5], times 09:00–17:00, lang=EN.

| Column | Type | Constraint |
|--------|------|------------|
| company_name | VARCHAR(200) | NOT NULL |
| workdays | JSON | NOT NULL, array of integers 1–7 |
| work_start_time | TIME | NOT NULL |
| work_end_time | TIME | NOT NULL |
| default_lang | TINYINT | NOT NULL, 0=English, 1=Spanish |

#### Scenario: Singleton row after migration
- GIVEN migration executed
- WHEN DB is queried
- THEN exactly one settings row exists with default values

### Requirement: Get Settings

`GET /api/v1/settings` MUST return the singleton settings row.

#### Scenario: Returns settings
- GIVEN settings row exists in DB
- WHEN `GET /api/v1/settings` is called
- THEN 200 returns `{ companyName, workdays, workStartTime, workEndTime, defaultLang }`

### Requirement: Update Settings

`PUT /api/v1/settings` — body: all fields required. MUST validate and update the singleton row. Returns 200 on success, 422 on validation failure.

**Validation rules:**

| Field | Rule | 422 Error |
|-------|------|-----------|
| companyName | 1–200 chars | `"companyName must be 1–200 characters"` |
| workdays | Non-empty array, integers 1–7 only | `"workdays must contain at least one day (1–7)"` |
| workStartTime | HH:MM format (e.g. "09:00") | `"workStartTime must be in HH:MM format"` |
| workEndTime | HH:MM, must be after start | `"workStartTime must be before workEndTime"` |
| defaultLang | 0 (English) or 1 (Spanish) | `"defaultLang must be 0 (English) or 1 (Spanish)"` |

#### Scenario: Valid update succeeds
- GIVEN payload with all fields valid
- WHEN `PUT /api/v1/settings` is called
- THEN 200 returns updated settings; DB row reflects changes

#### Scenario: Invalid field returns 422
- GIVEN companyName="" or workdays=[] or invalid time format or defaultLang=2
- WHEN `PUT /api/v1/settings` is called
- THEN 422 with field-specific error from validation table

### Requirement: SettingsPage Form

SettingsPage at `/settings` MUST render four sections: company name (text input), workdays (7 toggle chips Mon–Sun), timetable (two time inputs HH:MM), language (select: EN/ES). Loads current settings on mount via `GET /api/v1/settings`. On submit, calls `PUT /api/v1/settings` and shows success/error feedback.

#### Scenario: Load on mount
- GIVEN settings exist in DB
- WHEN SettingsPage mounts
- THEN form fields pre-populate with current values from API response

#### Scenario: Successful save
- GIVEN user modifies fields with valid values
- WHEN user clicks Save
- THEN `PUT /api/v1/settings` called; success message displayed

#### Scenario: Client-side validation blocks empty name
- GIVEN company name input cleared
- WHEN user clicks Save
- THEN inline validation error shown; no API call made

### Requirement: Sidebar Company Name

Sidebar MUST display company name from settings state. Before settings load, SHALL render nothing — never a hardcoded fallback string.

#### Scenario: Persisted name displayed
- GIVEN settings.companyName loaded as "Bark & Bubbles"
- WHEN sidebar renders
- THEN company name in header matches settings value

#### Scenario: Before settings load
- GIVEN settings not yet fetched from API
- WHEN sidebar renders
- THEN no company name text displayed (no hardcoded fallback)
