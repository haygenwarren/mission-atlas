"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  decadesOf,
  filterMissions,
  filterQuery,
  headline,
  missionsByAgency,
  missionsByGroup,
  missionsByPlace,
  readFilters,
  type Filters,
  type Group,
  type MissionFacts,
} from "@/lib/data";
import DecadeHeatmap from "./decade-heatmap";
import FilterBar from "./filter-bar";
import LaunchMass from "./launch-mass";
import MissionsPerYear from "./missions-per-year";
import { Card, Switch } from "./parts";
import StatusBars from "./status-bars";

// The data page's dashboard: the filters along the top and the cards below,
// all worked out in the browser from every mission's facts. The filters
// live in the address, so a filtered view can be shared as a link.
//
// Each chart leaves its own filter out and picks out what is chosen
// instead, so the other choices stay in view to click: the agencies chart
// still shows every agency the other filters allow.
export default function Dashboard({ missions }: { missions: MissionFacts[] }) {
  const params = useSearchParams();
  const filters = readFilters(new URLSearchParams(params.toString()));
  const [places, setPlaces] = useState(false);

  function setFilters(next: Filters) {
    const query = filterQuery(next);

    // Kept in the address without reloading the page.
    window.history.replaceState(null, "", query ? `/data?${query}` : "/data");
  }

  const toggled = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((one) => one !== item) : [...list, item];

  const years = missions.map(({ launchYear }) => launchYear);
  const first = Math.min(...years);
  const last = Math.max(...years);
  const decades = decadesOf(missions);

  const shown = filterMissions(missions, filters);
  const numbers = headline(shown);
  const forWhere = filterMissions(missions, filters, ["where"]);

  return (
    <>
      <FilterBar
        missions={missions}
        filters={filters}
        shown={shown.length}
        onChange={setFilters}
      />

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section
          aria-label="In numbers"
          className="grid grid-cols-3 gap-3 sm:gap-4"
        >
          {[
            { label: "Missions", value: numbers.missions },
            { label: "Active now", value: numbers.active },
            { label: "Agencies", value: numbers.agencies },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 sm:p-5"
            >
              <p className="label-caps text-muted">{label}</p>
              <p className="font-display mt-2 text-3xl tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </section>

        <MissionsPerYear
          missions={filterMissions(missions, filters, ["years"])}
          first={first}
          last={last}
          years={filters.years}
          onPick={(year) =>
            setFilters({
              ...filters,
              years:
                filters.years?.[0] === year && filters.years?.[1] === year
                  ? null
                  : [year, year],
            })
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            label="Destinations"
            note={
              places ? (
                <p>
                  A mission counts for each place it went: Cassini–Huygens
                  for Jupiter, Saturn and Titan.
                </p>
              ) : (
                <p>
                  A mission counts once, in one group: Cassini–Huygens under
                  Jupiter and beyond. Space telescopes also takes in the other
                  missions that stayed in orbit around Earth or the Sun.
                </p>
              )
            }
            controls={
              <Switch
                label="Show"
                options={[
                  { value: "groups", label: "Groups" },
                  { value: "places", label: "Places" },
                ]}
                value={places ? "places" : "groups"}
                onChange={(value) => setPlaces(value === "places")}
              />
            }
          >
            {places ? (
              <StatusBars
                rows={missionsByPlace(forWhere)}
                picked={filters.places}
                onToggle={(slug) =>
                  setFilters({
                    ...filters,
                    places: toggled(filters.places, slug),
                  })
                }
                fold="places"
              />
            ) : (
              <StatusBars
                rows={missionsByGroup(forWhere)}
                picked={filters.where}
                onToggle={(key) =>
                  setFilters({
                    ...filters,
                    where: toggled(filters.where, key as Group),
                  })
                }
              />
            )}
          </Card>

          <Card
            label="Agencies"
            note={
              <p>
                A mission run by several agencies counts for each:
                Cassini–Huygens for NASA, ESA and ASI.
              </p>
            }
          >
            <StatusBars
              rows={missionsByAgency(
                filterMissions(missions, filters, ["agency"]),
              )}
              picked={filters.agencies}
              onToggle={(key) =>
                setFilters({
                  ...filters,
                  agencies: toggled(filters.agencies, key),
                })
              }
            />
          </Card>
        </div>

        <Card
          label="Destinations by decade"
          note={
            <p>
              Each square counts the missions launched in that decade, in
              the same groups as Destinations. Darker squares had more.
            </p>
          }
        >
          <DecadeHeatmap
            missions={filterMissions(missions, filters, ["where", "years"])}
            decades={decades}
            filters={filters}
            onPick={(group, decade) => {
              const picked =
                filters.where.length === 1 &&
                filters.where[0] === group &&
                filters.places.length === 0 &&
                filters.years?.[0] === decade &&
                filters.years?.[1] === decade + 9;

              setFilters(
                picked
                  ? { ...filters, where: [], years: null }
                  : {
                      ...filters,
                      where: [group],
                      places: [],
                      years: [decade, decade + 9],
                    },
              );
            }}
          />
        </Card>

        <LaunchMass
          missions={shown}
          first={decades[0]}
          last={decades[decades.length - 1] + 10}
          unweighed={shown.filter(({ massKg }) => massKg === null).length}
        />
      </div>
    </>
  );
}
