# Kengeri gazetteer v1

Walk the campus. Stand at each main door. Replace lat/lng. Do not ship guessed coordinates as truth.

Centroid (Plus Code **VC7Q+75**): `12.86285, 77.43812`
Fence: ~700 m (tune after the walk). Campus is ~78 acres.

Snap: nearest place < 40 m → snap. 40–120 m → suggest. Else “unnamed spot on campus.”
Store **exact** pin coordinates. Label with the place name.

## Places

| id | name | kind | aliases |
|---|---|---|---|
| gate | Main gate | gate | entrance, mysore road gate |
| parking | Main parking | parking | car park, two wheeler |
| block1 | Block I | block | block 1, blk 1, admin |
| block2 | Block II | block | block 2, blk 2 |
| block3 | Block III | block | block 3, blk 3 |
| block4 | Block IV | block | block 4, blk 4 |
| central | Central Block | block | main academic |
| library | Campus Library | indoor | lib, block 4 library |
| cafe1 | Block I Cafeteria | food | canteen 1, mess block 1 |
| cafe4 | Block IV Cafeteria | food | canteen 4 |
| workshop | Engineering Workshop | block | workshop, foe workshop |
| devadan | Devadan Hall | hostel | boys hostel, men's hostel |
| christ-hall | Christ Hall | hostel | girls hostel, women's hostel |
| football | Football grounds | sport | ground, football |
| basketball | Basketball courts | sport | basket court |
| chapel | Campus chapel | other | prayer hall, church |
| open-aud | Open auditorium | outdoor | open air auditorium, lawn stage |

Machine-readable seed: [../data/kengeri/places.json](../data/kengeri/places.json)

About 17 places. Not 200 rooms. Rooms wait for `campus-nav-3d`. `place_id` here should equal building ids there later.
