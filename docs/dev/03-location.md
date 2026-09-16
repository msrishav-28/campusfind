# Location

## Stack (in order)

1. `navigator.geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 })`
2. If denied: place picker only. Do not block the sheet.
3. Distance to campus centroid. If `> fence_m` (~700): banner “You look off campus” but still allow picking a Kengeri place.
4. Nearest gazetteer place by haversine.
   - `< 40 m` → snap. `source = gps_snap`. Confirm chip.
   - `40–120 m` → suggest, do not force. `source = gps_raw` until they accept.
   - else → “Unnamed spot on campus”. `source = gps_raw`.
5. User may drag the pin or pick another place. `source = dragged` or `picked`.
6. If place.floors.length > 0, show floor chips. Optional.
7. Optional 40-character note (“2nd floor, water cooler”).
8. Persist **exact** `lat/lng` always. Label with `place_label`.

## Honesty

Pin UI: `Block IV cafeteria · ±14 m`.
Never “accurate to 2 metres indoors.”

## Client algorithm (pseudocode)

```
function resolvePlace(lat, lng, accuracy, places, centroid, fenceM) {
  const off = haversine(lat, lng, centroid) > fenceM
  const ranked = places
    .map(p => ({ p, d: haversine(lat, lng, p.lat, p.lng) }))
    .sort((a, b) => a.d - b.d)
  const nearest = ranked[0]
  if (!nearest) return { place: null, source: 'gps_raw', off }
  if (nearest.d < 40) return { place: nearest.p, source: 'gps_snap', off }
  if (nearest.d < 120) return { place: nearest.p, source: 'gps_raw', suggest: true, off }
  return { place: null, source: 'gps_raw', off }
}
```

## Near me

List/map filter: items with haversine < 150 m from the device, same campus, status open. If GPS denied, fall back to newest.

## Off-campus posts

Allowed if they pick a place. Do not invent a city-wide map.
