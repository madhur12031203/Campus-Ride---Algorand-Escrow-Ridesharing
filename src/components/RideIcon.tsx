import type { SVGProps } from "react";

export type RideIconName =
  | "arrow"
  | "home"
  | "car"
  | "clock"
  | "wallet"
  | "user"
  | "pin"
  | "route"
  | "shield"
  | "logout";

const paths: Record<RideIconName, string> = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  home: "m3 10 9-7 9 7v10H3zM9 20v-6h6v6",
  car: "m5 9 1.5-4h11L19 9M5 9h14l2 3v5H3v-5l2-3Zm0 8v3m14-3v3M7 13h2m6 0h2",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  wallet:
    "M19 7V5H5a2 2 0 0 0 0 4h15v11H5a2 2 0 0 1-2-2V7m17 5h-5v5h5m-3-2h.01",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  pin: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z",
  route: "M6 6h8a4 4 0 0 1 0 8h-4a2 2 0 0 0 0 4h8M3 6h.01M21 18h.01",
  shield: "m12 22 5-3a7 7 0 0 0 3-6V5l-8-3-8 3v8a7 7 0 0 0 3 6Zm-3-10 2 2 4-4",
  logout: "M10 3H4v18h6m5-13 4 4-4 4m-7-4h11",
};

export default function RideIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: RideIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
