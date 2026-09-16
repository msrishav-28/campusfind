# Analytics and metrics

Product metrics, not vanity totals.

## Events (PostHog or Plausible custom)

| event | props |
|---|---|
| map_view | campus |
| gps_prompt | granted \| denied \| timeout |
| report_open | type |
| voice_start | |
| voice_result | chars, failed |
| photo_attached | bytes |
| interpret_ok / interpret_fail | ms |
| item_create | type, has_photo, has_coords, source, ms_from_sheet_open |
| match_impression | count |
| match_tap | |
| claim_start | secret_used |
| claim_accept | |
| share_click | |
| item_expired | |

## Targets (Kengeri v1)

- Median found-post time < 30s
- ≥95% posts have coordinates
- ≥80% have a photo
- 8–15 found posts per weekday after launch week
- 20–60 open pins
- Voice used on ≥50% of found posts once the mic is shipped

v1.1: % tagged by model, match impressions, claims that started from a match card.

Ignore lifetime “items reported” and any public accuracy badge.
