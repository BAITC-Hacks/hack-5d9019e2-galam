import type { Domain } from "../lib/simulation/types";

export type IconName =
  | Domain
  | "plus"
  | "check"
  | "arrow"
  | "spark"
  | "chart"
  | "city"
  | "close"
  | "pin"
  | "reset";
const paths: Record<IconName, string> = {
  transport: "M5 16V5h14v11H5Zm0-7h14M8 16v3m8-3v3M8 12h1m6 0h1",
  ecology: "M19 4C7 3 3 8 6 14s12 3 13-10ZM5 20 15 9",
  social: "M3 10 12 4l9 6M5 10v10h14V10M10 20v-7h4v7",
  safety: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
  services: "m14 4 6 6-3 3-6-6 3-3ZM4 20l8-8M4 17l3 3",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
  chart: "M4 20h17M6 16V9m6 7V4m6 12v-5",
  city: "M3 21V10h6v11m0 0V3h7v18m0 0V8h5v13M12 7h1m-1 4h1m-1 4h1M5 14h1m12-2h1m-1 4h1",
  close: "m6 6 12 12M6 18 18 6",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  reset: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
