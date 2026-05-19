export function withUnit(value: string, unit?: string): string {
  return unit ? `${value} [${unit}]` : value;
}

export type UnitDimension = "length" | "density";

export type LengthUnit = "m" | "cm" | "mm";
export type DensityUnit = "g/cm^3";
export type SupportedUnit = LengthUnit | DensityUnit;

type UnitDefinition<TUnit extends SupportedUnit = SupportedUnit> = {
  unit: TUnit;
  label: string;
  dimension: UnitDimension;
  siUnit: TUnit extends LengthUnit ? "m" : TUnit;
  toSI: number;
};

const unitDefinitions = {
  m: {
    unit: "m",
    label: "m",
    dimension: "length",
    siUnit: "m",
    toSI: 1,
  },
  cm: {
    unit: "cm",
    label: "cm",
    dimension: "length",
    siUnit: "m",
    toSI: 0.01,
  },
  mm: {
    unit: "mm",
    label: "mm",
    dimension: "length",
    siUnit: "m",
    toSI: 0.001,
  },
  "g/cm^3": {
    unit: "g/cm^3",
    label: "g/cm^3",
    dimension: "density",
    siUnit: "g/cm^3",
    toSI: 1,
  },
} as const satisfies Record<SupportedUnit, UnitDefinition>;

export type UnitAwareValue<TUnit extends SupportedUnit = SupportedUnit> = {
  value: number;
  unit: TUnit;
};

export type SIValue<TUnit extends SupportedUnit = SupportedUnit> =
  UnitAwareValue<TUnit> & {
    siValue: number;
    siUnit: UnitDefinition<TUnit>["siUnit"];
  };

export const units = {
  millimeter: "mm",
  centimeter: "cm",
  gram: "g",
  density: "g/cm^3",
  linearDensity: "g/cm",
  meter: "m",
  second: "s",
  velocity: "m/s",
  acceleration: "m/s^2",
} as const;

export function isSupportedUnit(unit: string): unit is SupportedUnit {
  return unit in unitDefinitions;
}

export function isLengthUnit(unit: string): unit is LengthUnit {
  return isSupportedUnit(unit) && unitDefinitions[unit].dimension === "length";
}

export function getUnitLabel(unit: SupportedUnit): string {
  return unitDefinitions[unit].label;
}

export function toSI<TUnit extends SupportedUnit>(
  quantity: UnitAwareValue<TUnit>,
): SIValue<TUnit> {
  const definition = unitDefinitions[quantity.unit] as UnitDefinition<TUnit>;

  return {
    ...quantity,
    siValue: quantity.value * definition.toSI,
    siUnit: definition.siUnit,
  };
}

export function convertLength(
  value: number,
  fromUnit: LengthUnit,
  toUnit: LengthUnit,
): number {
  const meters = value * unitDefinitions[fromUnit].toSI;
  return meters / unitDefinitions[toUnit].toSI;
}

export function toMeters(value: number, unit: LengthUnit): number {
  return convertLength(value, unit, "m");
}

export function fromMeters(value: number, unit: LengthUnit): number {
  return convertLength(value, "m", unit);
}

export function convertUnit<TUnit extends SupportedUnit>(
  value: number,
  fromUnit: TUnit,
  toUnit: TUnit,
): number {
  const from = unitDefinitions[fromUnit];
  const to = unitDefinitions[toUnit];

  if (from.dimension !== to.dimension) {
    throw new Error(`Cannot convert ${fromUnit} to ${toUnit}.`);
  }

  return (value * from.toSI) / to.toSI;
}
