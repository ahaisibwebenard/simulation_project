# Simulation model

## Purpose and time window

The model explores the relationship between tourist interest, overnight demand, bed capacity and visitor spending. It covers 30 simulated days beginning on a hypothetical Monday. It starts with no overnight guests. A run with the same inputs gives the same outputs.

## Inputs and baseline

| Input | Baseline | Allowed range |
| --- | --- | --- |
| Base visitor interest | 100 people/day | 0–500 whole people/day |
| Season | Normal, multiplier 1.00 | Low 0.65; normal 1.00; peak 1.50 |
| Share seeking an overnight stay | 60% | 0–100 whole percent |
| Stay length | 2 nights | 1–7 whole nights |
| Available beds | 160 | 0–1,000 whole beds |
| Spending per person-day | UGX 120,000 | UGX 0–500,000, whole currency units |

These values are assumptions, not observed Lake Bunyonyi tourism data.

## Daily arrivals

For day d:

`interested[d] = round(baseInterest × seasonMultiplier × weekdayFactor[d] × variation[d])`

The weekday factor is 0.92 from Monday to Friday and 1.20 on Saturday and Sunday. Variation lies between 0.85 and 1.15. A seeded linear congruential generator, starting at seed 42, supplies the same daily variation for every scenario. It is an illustrative source of variation, not a fitted statistical arrival distribution.

`overnightRequests[d] = round(interested[d] × overnightShare / 100)`

`dayVisitors[d] = interested[d] − overnightRequests[d]`

## Beds and departures

Each overnight guest uses one bed for the selected number of nights. Existing guests depart before new arrivals seek a bed.

`occupiedBeforeArrivals[d] = occupiedAtEndOfDay[d−1] − departures[d]`

`admitted[d] = min(overnightRequests[d], availableBeds − occupiedBeforeArrivals[d])`

`turnedAway[d] = overnightRequests[d] − admitted[d]`

`occupiedAtEndOfDay[d] = occupiedBeforeArrivals[d] + admitted[d]`

Guests admitted on day d are scheduled to leave on day d + stayLength. Requests beyond available beds leave immediately. The model has no waiting list, advance reservations, alternative lodging or conversion of rejected overnight requests into day visits. Day visitors have no capacity limit.

## Visitor totals and spending

`served[d] = dayVisitors[d] + admitted[d]`

`personDays[d] = dayVisitors[d] + occupiedAtEndOfDay[d]`

`spending[d] = personDays[d] × spendingPerPersonDay`

Visitors served counts new admitted visitors, rather than everyone present that day. Person-days include guests admitted on earlier days who still occupy a bed. Repeat activity by an overnight guest therefore contributes on each simulated day of their stay.

Spending is one combined daily amount for accommodation, food, transport and activities. It is gross visitor spending, not profit, tax revenue or a measured local economic impact. Nights and spending beyond day 30 are excluded, even when guests remain in beds at the end of the window.

Average bed occupancy is occupied bed-nights divided by available beds × 30. It includes the empty opening period. With zero beds, the model stores occupancy as zero and the interface displays a dash with an explanation that there is no bed capacity.

## Activities

Each person-day is assigned one main activity:

| Activity | Assumed share |
| --- | --- |
| Boat and island circuit | 40% |
| Shoreline and local services | 35% |
| Viewpoint walks | 25% |

The first two daily counts are rounded. Viewpoints receive the remainder so activity counts always add up to person-days. Small daily totals can therefore differ from the exact shares. The lake drawing and moving dot illustrate routes; neither is a geographic map or an individual itinerary simulation. Travel times are not modelled.

## Reference results

The fixed baseline gives:

| Output | Value |
| --- | --- |
| Interested visitors | 2,994 |
| New visitors served | 2,994 |
| Overnight admissions | 1,796 |
| Overnight requests turned away | 0 |
| Person-days | 4,742 |
| Average bed occupancy | 73.7916667% (displayed as 73.8%) |
| Visitor spending | UGX 569,040,000 (displayed as 569.0m) |

Only changing the season to peak gives 4,157 visitors served and 335 overnight requests turned away. These values can help check a future model edit.

## Limits

The model has no measured tourism data, real calendar, holidays, weather inputs, service queues, travel delays, price response, operating costs or environmental capacity estimates. Interpret scenarios as demonstrations of assumed relationships. Calibrated forecasting would require separately collected and validated local data.
