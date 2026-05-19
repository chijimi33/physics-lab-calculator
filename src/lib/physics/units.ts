export function formatWithUnit(value: string | number, unit?: string): string {
  return unit ? `${value} [${unit}]` : String(value);
}

export function withUnit(value: string, unit?: string): string {
  return formatWithUnit(value, unit);
}

const unitDefinitions = {
  mm: {
    label: "mm",
    dimension: "length",
    siUnit: "m",
    toSI: 0.001,
  },
  cm: {
    label: "cm",
    dimension: "length",
    siUnit: "m",
    toSI: 0.01,
  },
  m: {
    label: "m",
    dimension: "length",
    siUnit: "m",
    toSI: 1,
  },
  mg: {
    label: "mg",
    dimension: "mass",
    siUnit: "kg",
    toSI: 0.000001,
  },
  g: {
    label: "g",
    dimension: "mass",
    siUnit: "kg",
    toSI: 0.001,
  },
  kg: {
    label: "kg",
    dimension: "mass",
    siUnit: "kg",
    toSI: 1,
  },
  ms: {
    label: "ms",
    dimension: "time",
    siUnit: "s",
    toSI: 0.001,
  },
  s: {
    label: "s",
    dimension: "time",
    siUnit: "s",
    toSI: 1,
  },
  "g/cm^3": {
    label: "g/cm^3",
    dimension: "density",
    siUnit: "kg/m^3",
    toSI: 1000,
  },
  "kg/m^3": {
    label: "kg/m^3",
    dimension: "density",
    siUnit: "kg/m^3",
    toSI: 1,
  },
  "cm/s": {
    label: "cm/s",
    dimension: "velocity",
    siUnit: "m/s",
    toSI: 0.01,
  },
  "m/s": {
    label: "m/s",
    dimension: "velocity",
    siUnit: "m/s",
    toSI: 1,
  },
  "cm/s^2": {
    label: "cm/s^2",
    dimension: "acceleration",
    siUnit: "m/s^2",
    toSI: 0.01,
  },
  "m/s^2": {
    label: "m/s^2",
    dimension: "acceleration",
    siUnit: "m/s^2",
    toSI: 1,
  },
  deg: {
    label: "deg",
    dimension: "angle",
    siUnit: "rad",
    toSI: Math.PI / 180,
  },
  rad: {
    label: "rad",
    dimension: "angle",
    siUnit: "rad",
    toSI: 1,
  },
} as const;

export type Unit = keyof typeof unitDefinitions;
export type UnitDimension = (typeof unitDefinitions)[Unit]["dimension"];
export type UnitForDimension<TDimension extends UnitDimension> = {
  [TUnit in Unit]: (typeof unitDefinitions)[TUnit]["dimension"] extends TDimension
    ? TUnit
    : never;
}[Unit];
export type SIUnitFor<TUnit extends Unit> =
  (typeof unitDefinitions)[TUnit]["siUnit"];
export type CompatibleUnit<TUnit extends Unit> = UnitForDimension<
  (typeof unitDefinitions)[TUnit]["dimension"]
>;

export type LengthUnit = UnitForDimension<"length">;
export type MassUnit = UnitForDimension<"mass">;
export type TimeUnit = UnitForDimension<"time">;
export type DensityUnit = UnitForDimension<"density">;
export type VelocityUnit = UnitForDimension<"velocity">;
export type AccelerationUnit = UnitForDimension<"acceleration">;
export type AngleUnit = UnitForDimension<"angle">;
export type SupportedUnit = Unit;

export type UnitValue<TUnit extends Unit = Unit> = {
  value: number;
  unit: TUnit;
};

export type UnitAwareValue<TUnit extends Unit = Unit> = UnitValue<TUnit>;

export type SIValue<TUnit extends Unit = Unit> = UnitValue<TUnit> & {
  siValue: number;
  siUnit: SIUnitFor<TUnit>;
};

export const units = {
  millimeter: "mm",
  centimeter: "cm",
  meter: "m",
  milligram: "mg",
  gram: "g",
  kilogram: "kg",
  millisecond: "ms",
  second: "s",
  density: "g/cm^3",
  densitySI: "kg/m^3",
  linearDensity: "g/cm",
  velocity: "m/s",
  velocityCentimeterPerSecond: "cm/s",
  acceleration: "m/s^2",
  accelerationCentimeterPerSecondSquared: "cm/s^2",
  degree: "deg",
  radian: "rad",
} as const;

function hasUnitDefinition(unit: string): unit is Unit {
  return Object.prototype.hasOwnProperty.call(unitDefinitions, unit);
}

function definitionFor<TUnit extends Unit>(unit: TUnit) {
  return unitDefinitions[unit];
}

export function isSupportedUnit(unit: string): unit is Unit {
  return hasUnitDefinition(unit);
}

export function getUnitDimension(unit: Unit): UnitDimension {
  return definitionFor(unit).dimension;
}

export function isLengthUnit(unit: string): unit is LengthUnit {
  return hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "length";
}

export function isMassUnit(unit: string): unit is MassUnit {
  return hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "mass";
}

export function isTimeUnit(unit: string): unit is TimeUnit {
  return hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "time";
}

export function isDensityUnit(unit: string): unit is DensityUnit {
  return hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "density";
}

export function isVelocityUnit(unit: string): unit is VelocityUnit {
  return hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "velocity";
}

export function isAccelerationUnit(unit: string): unit is AccelerationUnit {
  return (
    hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "acceleration"
  );
}

export function isAngleUnit(unit: string): unit is AngleUnit {
  return hasUnitDefinition(unit) && unitDefinitions[unit].dimension === "angle";
}

export function getUnitLabel(unit: Unit): string {
  return definitionFor(unit).label;
}

export function toSI<TUnit extends Unit>(quantity: UnitValue<TUnit>): SIValue<TUnit> {
  const definition = definitionFor(quantity.unit);

  return {
    ...quantity,
    siValue: quantity.value * definition.toSI,
    siUnit: definition.siUnit as SIUnitFor<TUnit>,
  };
}

export function convertUnit<TFromUnit extends Unit>(
  value: number,
  fromUnit: TFromUnit,
  toUnit: CompatibleUnit<TFromUnit>,
): number {
  const from = definitionFor(fromUnit);
  const to = definitionFor(toUnit);

  if (from.dimension !== to.dimension) {
    throw new Error(`Cannot convert ${fromUnit} to ${toUnit}.`);
  }

  return (value * from.toSI) / to.toSI;
}

export function convertLength(
  value: number,
  fromUnit: LengthUnit,
  toUnit: LengthUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function convertMass(
  value: number,
  fromUnit: MassUnit,
  toUnit: MassUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function convertTime(
  value: number,
  fromUnit: TimeUnit,
  toUnit: TimeUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function convertDensity(
  value: number,
  fromUnit: DensityUnit,
  toUnit: DensityUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function convertVelocity(
  value: number,
  fromUnit: VelocityUnit,
  toUnit: VelocityUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function convertAcceleration(
  value: number,
  fromUnit: AccelerationUnit,
  toUnit: AccelerationUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function convertAngle(
  value: number,
  fromUnit: AngleUnit,
  toUnit: AngleUnit,
): number {
  return convertUnit(value, fromUnit, toUnit);
}

export function toMeters(value: number, unit: LengthUnit): number {
  return convertLength(value, unit, "m");
}

export function fromMeters(value: number, unit: LengthUnit): number {
  return convertLength(value, "m", unit);
}

export function degToRad(degrees: number): number {
  return convertAngle(degrees, "deg", "rad");
}

export function radToDeg(radians: number): number {
  return convertAngle(radians, "rad", "deg");
}
