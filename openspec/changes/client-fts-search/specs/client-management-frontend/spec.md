# Delta for Client Management Frontend

## MODIFIED Requirements

### Requirement: Client Search

The search box on the list page MUST trigger a search request after a 300ms debounce and also on explicit button click. Queries shorter than 3 characters SHALL return empty results without making an API call. Results SHALL replace the table content. Zero results SHALL show an empty state.

(Previously: Search had no minimum character gate — any keystroke triggered a search.)

#### Scenario: Auto-search finds results

- GIVEN the user types a search query of 3 or more characters in the list page search box
- WHEN 300ms elapses after the last keystroke
- THEN the table updates with matching results from `/api/v1/clients/search?q=...`

#### Scenario: Short query returns empty without API call

- GIVEN the user types a search query shorter than 3 characters
- WHEN 300ms elapses after the last keystroke
- THEN the results clear to an empty state AND no API call is made

#### Scenario: Explicit search button click

- GIVEN the user has typed a query of 3 or more characters
- WHEN the user clicks the search button
- THEN results update immediately regardless of debounce timer

#### Scenario: Explicit search button click with short query

- GIVEN the user has typed a query shorter than 3 characters
- WHEN the user clicks the search button
- THEN no API call is made AND results remain in their current state
