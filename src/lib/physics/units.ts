export function withUnit(value: string, unit?: string): string {
  return unit ? `${value} [${unit}]` : value;
}

export const units = {
  centimeter: "cm",
  gram: "g",
  density: "g/cm^3",
  linearDensity: "g/cm",
  meter: "m",
  second: "s",
  velocity: "m/s",
  acceleration: "m/s^2",
} as const;
