"use client";

import { districtName, format, translate, type Locale } from "../i18n";
import { officialDataset as data } from "../data/dataset";
import type {
  Decision,
  DistrictId,
  ScoreResult,
} from "../lib/simulation/types";

const zones = [
  {
    id: "esil",
    x: 300,
    y: 148,
    color: "#c6d4c4",
    buildings: [
      [-45, -5, 56, "#f2e8c9"],
      [3, -24, 89, "#89b2b2"],
      [46, 0, 51, "#e7ddc4"],
      [-8, 22, 32, "#e9b57b"],
    ],
  },
  {
    id: "almaty",
    x: 147,
    y: 274,
    color: "#cdd0b4",
    buildings: [
      [-38, -6, 37, "#d49a79"],
      [2, -26, 50, "#e2c89a"],
      [43, -4, 37, "#d49a79"],
      [0, 24, 28, "#ebdab7"],
    ],
  },
  {
    id: "saryarka",
    x: 341,
    y: 375,
    color: "#d5c8a9",
    buildings: [
      [-36, -6, 24, "#d3a184"],
      [10, -23, 39, "#c9b995"],
      [44, 4, 25, "#e7c8aa"],
      [-7, 25, 25, "#d3a184"],
    ],
  },
  {
    id: "baikonur",
    x: 152,
    y: 493,
    color: "#bfd0b0",
    buildings: [
      [-33, -11, 35, "#d9bd95"],
      [13, -23, 45, "#d8e1d5"],
      [42, 7, 25, "#dbb180"],
      [-8, 23, 29, "#d8e1d5"],
    ],
  },
  {
    id: "nura",
    x: 335,
    y: 592,
    color: "#d5d7b7",
    buildings: [
      [-38, -4, 30, "#e6d8be"],
      [7, -25, 41, "#e6d8be"],
      [44, 2, 23, "#d4ae87"],
    ],
  },
] as const;

function Building({
  x,
  y,
  height,
  color,
}: {
  x: number;
  y: number;
  height: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M-17 -${height} 0 -${height + 9} 20 -${height} 2 -${height - 9}Z`}
        fill="#faf3dd"
        stroke="#6b8070"
        strokeWidth="1"
      />
      <path
        d={`M-17 -${height} 2 -${height - 9} 2 10 -17 0Z`}
        fill={color}
        stroke="#6b8070"
        strokeWidth="1"
      />
      <path
        d={`M2 -${height - 9} 20 -${height} 20 0 2 10Z`}
        fill={color}
        stroke="#6b8070"
        strokeWidth="1"
      />
      <path
        d={`M2 -${height - 9} 20 -${height} 20 0 2 10Z`}
        fill="#173d36"
        opacity=".15"
      />
      {Array.from({ length: Math.floor(height / 14) }, (_, i) => (
        <g key={i} fill="#527e7c">
          <path d={`M-12 ${-height + 10 + i * 13}v5l5 2v-5Z`} />
          <path d={`M7 ${-height + 7 + i * 13}v5l5-2v-5Z`} />
        </g>
      ))}
    </g>
  );
}
function Tree({
  x,
  y,
  pale = false,
}: {
  x: number;
  y: number;
  pale?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0v-15" stroke="#79764f" strokeWidth="4" />
      <path
        d="m0-36 13 15-4 12H-8l-7-12Z"
        fill={pale ? "#9faa77" : "#6d9470"}
      />
      <path d="m0-36 13 15-4 12H0Z" fill="#406e56" opacity=".5" />
    </g>
  );
}

export function CityMap({
  selected,
  onSelect,
  plan,
  scores,
  locale,
}: {
  selected: DistrictId;
  onSelect: (id: DistrictId) => void;
  plan: readonly Decision[];
  scores: ScoreResult["districtScores"];
  locale: Locale;
}) {
  return (
    <svg
      className="city-map"
      viewBox="0 0 520 690"
      role="group"
      aria-label={translate(locale, "districts")}
    >
      <defs>
        <pattern
          id="paper-grid"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M22 0H0v22"
            fill="none"
            stroke="#b6c6b6"
            strokeWidth=".5"
            opacity=".32"
          />
        </pattern>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#9fc4c1" />
          <stop offset="1" stopColor="#bcdbd0" />
        </linearGradient>
      </defs>
      <rect width="520" height="690" fill="url(#paper-grid)" />
      <path
        d="M36-20C-25 100 187 102 93 196S43 318 198 331 88 518 75 585s9 93 60 124"
        fill="none"
        stroke="#c7dfd0"
        strokeWidth="62"
      />
      <path
        d="M36-20C-25 100 187 102 93 196S43 318 198 331 88 518 75 585s9 93 60 124"
        fill="none"
        stroke="url(#river)"
        strokeWidth="43"
      />
      <path
        d="m120 66 66 48M44 346l65 24M48 588l55 13"
        stroke="#f2eedb"
        strokeWidth="16"
      />
      <path
        d="m120 66 66 48M44 346l65 24M48 588l55 13"
        stroke="#a5b1a0"
        strokeWidth="2"
      />
      <text
        x="26"
        y="439"
        transform="rotate(-82 26 439)"
        className="river-label"
      >
        {translate(locale, "map.river")}
      </text>
      <g transform="translate(446 30)" fill="#365d4e">
        <path d="m0 0 7 22-7-5-7 5Z" />
        <text x="0" y="38" textAnchor="middle" fontSize="10">
          N
        </text>
      </g>
      <path
        d="m300 157-153 120 194 98-189 118 183 99"
        fill="none"
        stroke="#eddfba"
        strokeWidth="23"
      />
      <path
        d="m300 157-153 120 194 98-189 118 183 99"
        fill="none"
        stroke="#a8b79f"
        strokeWidth="15"
      />
      <path
        d="m300 157-153 120 194 98-189 118 183 99"
        fill="none"
        stroke="#faf4de"
        strokeWidth="1.5"
        strokeDasharray="6 7"
      />
      {zones.map((zone) => {
        const active = selected === zone.id;
        const markers = plan.filter(
          (d) =>
            d.districtId === zone.id ||
            data.actions.find((a) => a.id === d.actionId)?.scope === "city",
        );
        return (
          <g
            key={zone.id}
            className={`map-zone ${active ? "active" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={districtName(locale, zone.id)}
            aria-pressed={active}
            onClick={() => onSelect(zone.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(zone.id);
              }
            }}
          >
            <title>{`${districtName(locale, zone.id)} · ${format(scores[zone.id])}`}</title>
            <g transform={`translate(${zone.x} ${zone.y})`}>
              <path
                d="M-111 4 0-53 111 4 0 65Z"
                fill="#476b52"
                opacity=".13"
                transform="translate(4 13)"
              />
              <path d="M-105 0 0 54 105 0v11L0 65-105 11Z" fill="#9aab87" />
              <path
                className="district-ground"
                d="M-105 0 0-54 105 0 0 54Z"
                fill={zone.color}
                stroke={active ? "#d57442" : "#91a384"}
                strokeWidth={active ? 3 : 1}
              />
              <path
                d="m-91 0 91 45 91-45M-72-8 0 30 74-8M-12-45-12 44M26-37v68"
                fill="none"
                stroke="#e9e3ca"
                strokeWidth="8"
              />
              {zone.buildings.map(([x, y, height, color], index) => (
                <Building
                  key={index}
                  x={x}
                  y={y}
                  height={height}
                  color={color}
                />
              ))}
              <Tree x={-72} y={6} pale={zone.id === "saryarka"} />
              <Tree x={65} y={20} pale={zone.id === "saryarka"} />
              {zone.id === "esil" && (
                <g transform="translate(8 -78)">
                  <path
                    d="M0 0v-39m-7 39 7-28 7 28"
                    stroke="#dac47c"
                    strokeWidth="4"
                  />
                  <circle
                    cy="-44"
                    r="10"
                    fill="#e8c46b"
                    stroke="#b39a51"
                    strokeWidth="2"
                  />
                </g>
              )}
              {zone.id === "nura" && (
                <g stroke="#b1a17e" strokeDasharray="3 3" fill="none">
                  <path d="m-12 15 20-10 21 11-20 10Z" />
                  <path d="m-57 25 16-8 16 8-16 8Z" />
                </g>
              )}
              {markers.length > 0 && (
                <g transform="translate(-48 34)" className="map-markers">
                  {markers.map((d, index) => (
                    <g
                      key={d.actionId}
                      transform={`translate(${index * 23} 0)`}
                    >
                      <rect
                        x="-2"
                        y="-6"
                        width="24"
                        height="19"
                        rx="3"
                        fill="#28594b"
                        stroke="#f3efd9"
                        strokeWidth="2"
                      />
                      <text
                        x="10"
                        y="7"
                        fill="#fff7da"
                        fontSize="8"
                        textAnchor="middle"
                      >
                        {d.actionId}
                      </text>
                    </g>
                  ))}
                </g>
              )}
              {markers.some(
                (d) => d.actionId === "M4" || d.actionId === "M6",
              ) && <Tree x={-50} y={29} />}
              {markers.some((d) => d.actionId === "M7") && (
                <g transform="translate(-12 -20)">
                  <rect
                    x="-10"
                    y="-21"
                    width="27"
                    height="19"
                    fill="#edb168"
                    stroke="#60715a"
                  />
                  <path d="m-12-21 15-10 17 10Z" fill="#be7759" />
                  <path d="M1-2v-10h7v10" fill="#faf2d7" />
                </g>
              )}
              {markers.some((d) => d.actionId === "M8") && (
                <g
                  transform="translate(37 -35)"
                  stroke="#fcf7e9"
                  strokeWidth="4"
                >
                  <rect
                    x="-9"
                    y="-11"
                    width="21"
                    height="21"
                    fill="#6b9a80"
                    stroke="none"
                  />
                  <path d="M1-7V6M-5 0H7" />
                </g>
              )}
              {markers.some(
                (d) => d.actionId === "M1" || d.actionId === "M3",
              ) && (
                <path
                  d="m-90 1 88 46 86-45"
                  fill="none"
                  stroke="#d3904b"
                  strokeWidth="4"
                  strokeDasharray={
                    markers.some((d) => d.actionId === "M3") ? "3 3" : undefined
                  }
                />
              )}
              {markers.some((d) => d.actionId === "M10") && (
                <g>
                  <path
                    d="M-62-7v-21h7"
                    fill="none"
                    stroke="#557164"
                    strokeWidth="2"
                  />
                  <circle cx="-55" cy="-27" r="4" fill="#faeab0" />
                </g>
              )}
              <g transform="translate(0 76)">
                <rect
                  x="-69"
                  y="-10"
                  width="138"
                  height="27"
                  rx="5"
                  fill={active ? "#294f43" : "#faf6e8"}
                  stroke={active ? "#294f43" : "#ccd1bb"}
                />
                <text
                  x="-55"
                  y="8"
                  fontSize="12"
                  fill={active ? "#fff7e4" : "#314c41"}
                  fontWeight="700"
                >
                  {districtName(locale, zone.id)}
                </text>
                <text
                  x="56"
                  y="8"
                  textAnchor="end"
                  fontSize="12"
                  fill={active ? "#eccc91" : "#67765e"}
                >
                  {format(scores[zone.id], 1)}
                </text>
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
