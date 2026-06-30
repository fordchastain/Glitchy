import { applyJitter } from "./applyJitter";
import { applyNoise } from "./applyNoise";
import { applyPixelate } from "./applyPixelate";
import { applyRGBShift } from "./applyRGBShift";
import { applyScanlines } from "./applyScanlines";
import { applySlices } from "./applySlices";

export type ConfigValue = number | boolean;

export interface ConfigField {
  type: "number" | "slider" | "checkbox";
  label: string;
  key: string;
  defaultValue: ConfigValue;
  min?: number;
  max?: number;
  step?: number;
}

export interface EffectDefinition {
  id: string;
  name: string;
  fields: ConfigField[];
  apply: (
    ctx: CanvasRenderingContext2D,
    config: Record<string, ConfigValue>,
  ) => void;
}

export const effects: EffectDefinition[] = [
  {
    id: "pixelate",
    name: "Pixelate",
    fields: [
      {
        type: "slider",
        label: "Block Size",
        key: "blockSize",
        defaultValue: 8,
        min: 1,
        max: 64,
        step: 1,
      },
      {
        type: "checkbox",
        label: "Grayscale blocks",
        key: "grayscale",
        defaultValue: false,
      },
    ],
    apply: (ctx, config) =>
      applyPixelate(
        ctx,
        config.blockSize as number,
        config.grayscale as boolean,
      ),
  },
  {
    id: "rgbShift",
    name: "RGB Shift",
    fields: [
      {
        type: "slider",
        label: "Amount",
        key: "amount",
        defaultValue: 5,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        type: "slider",
        label: "Direction",
        key: "direction",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
      },
      {
        type: "checkbox",
        label: "Shift green channel",
        key: "shiftGreen",
        defaultValue: false,
      },
    ],
    apply: (ctx, config) =>
      applyRGBShift(
        ctx,
        config.amount as number,
        config.shiftGreen as boolean,
        config.direction as number,
      ),
  },
  {
    id: "jitter",
    name: "Jitter",
    fields: [
      {
        type: "slider",
        label: "Amount",
        key: "amount",
        defaultValue: 5,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        type: "slider",
        label: "Speed",
        key: "speed",
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
      },
    ],
    apply: (ctx, config) =>
      applyJitter(ctx, config.amount as number, config.speed as number),
  },
  {
    id: "scanlines",
    name: "Scanlines",
    fields: [
      {
        type: "slider",
        label: "Darkness",
        key: "darkness",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        type: "checkbox",
        label: "Vertical",
        key: "vertical",
        defaultValue: false,
      },
      {
        type: "slider",
        label: "Scale",
        key: "scale",
        defaultValue: 1,
        min: 1,
        max: 20,
        step: 1,
      },
    ],
    apply: (ctx, config) =>
      applyScanlines(
        ctx,
        config.darkness as number,
        config.vertical as boolean,
        config.scale as number,
      ),
  },
  {
    id: "slices",
    name: "Slices",
    fields: [
      {
        type: "slider",
        label: "Count",
        key: "count",
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        type: "slider",
        label: "Offset",
        key: "offset",
        defaultValue: 20,
        min: -100,
        max: 100,
        step: 1,
      },
      {
        type: "slider",
        label: "Vertical speed",
        key: "verticalSpeed",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
      },
    ],
    apply: (ctx, config) =>
      applySlices(
        ctx,
        config.count as number,
        config.offset as number,
        config.verticalSpeed as number,
      ),
  },
  {
    id: "noise",
    name: "Noise",
    fields: [
      {
        type: "slider",
        label: "Amount",
        key: "amount",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        type: "checkbox",
        label: "Color noise",
        key: "color",
        defaultValue: false,
      },
    ],
    apply: (ctx, config) =>
      applyNoise(ctx, config.amount as number, config.color as boolean),
  },
];

export interface EffectState {
  enabled: boolean;
  config: Record<string, ConfigValue>;
}

export function createDefaultEffectStates(): Record<string, EffectState> {
  const states: Record<string, EffectState> = {};
  for (const effect of effects) {
    const config: Record<string, ConfigValue> = {};
    for (const field of effect.fields) {
      config[field.key] = field.defaultValue;
    }
    states[effect.id] = { enabled: false, config };
  }
  return states;
}
