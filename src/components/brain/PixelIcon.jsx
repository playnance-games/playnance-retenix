const ICONS = {
  players: "M21 7h14v5h5v14h-5v5H21v-5h-5V12h5zM8 37h18v5h5v9H5v-9h3zM36 36h12v5h5v10H32v-9h4zM9 31h10v5H9zM38 31h9v5h-9z",
  clock: "M24 4h8v10h8v8h10v8H40v8h-8v10h-8V38h-8v-8H6v-8h10v-8h8zM27 20h3v16h-3z",
  zap: "M31 4 13 30h12l-3 22 21-30H30zM8 11h8v5H8zm32-6h8v5h-8zM5 39h8v5H5z",
  grid: "M6 8h18v18H6zM32 8h18v18H32zM6 34h18v18H6zM32 34h18v18H32zM11 13h8v8h-8zm26 0h8v8h-8zm-26 26h8v8h-8zm26 0h8v8h-8z",
  triangle: "M25 5h7v8h7v7h7v8h6v8h-6v8h-7v7H17v-7h-7v-8H4v-8h6v-8h7v-7h8zm0 16v15h7V21zm0 20v6h7v-6z",
  shield: "M28 4 8 12v15c0 12 8 20 20 25 12-5 20-13 20-25V12zm0 8 12 5v10c0 8-4 14-12 18-8-4-12-10-12-18V17zm-3 7h6v12h-6zm0 16h6v6h-6z",
};

export default function PixelIcon({ name, className = "" }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 56 56" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges" className={className}>
      <path d={d} />
    </svg>
  );
}