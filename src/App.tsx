import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import {
  effects,
  createDefaultEffectStates,
  type ConfigValue,
  type EffectState,
} from "./effects";

function UploadControl({
  onImageLoaded,
}: {
  onImageLoaded: (img: HTMLImageElement) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => onImageLoaded(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        className="upload-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload Image
      </button>
    </>
  );
}

function ConfigControl({
  field,
  value,
  onChange,
}: {
  field: {
    type: "number" | "slider" | "checkbox";
    label: string;
    key: string;
    min?: number;
    max?: number;
    step?: number;
  };
  value: ConfigValue;
  onChange: (val: ConfigValue) => void;
}) {
  const [localValue, setLocalValue] = useState<ConfigValue>(value);
  const localValueRef = useRef<ConfigValue>(value);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerUp = () => {
      setIsDragging(false);
      onChange(localValueRef.current);
    };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isDragging, onChange]);

  if (field.type === "checkbox") {
    return (
      <label className="config-row checkbox-row">
        <input
          type="checkbox"
          checked={localValue as boolean}
          onChange={(e) => {
            const checked = e.target.checked;
            setLocalValue(checked);
            onChange(checked);
          }}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "slider") {
    return (
      <div className="config-field">
        <label className="config-label">
          {field.label}:{" "}
          <span className="config-value">{String(localValue)}</span>
        </label>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={localValue as number}
          onPointerDown={() => setIsDragging(true)}
          onChange={(e) => setLocalValue(Number(e.target.value))}
        />
      </div>
    );
  }

  return (
    <div className="config-field">
      <label className="config-label">{field.label}</label>
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={localValue as number}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        onBlur={() => onChange(localValue)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(localValue);
          }
        }}
      />
    </div>
  );
}

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [effectsState, setEffectsState] = useState<Record<string, EffectState>>(
    createDefaultEffectStates,
  );

  const toggleEffect = useCallback((id: string) => {
    setEffectsState((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }, []);

  const updateConfig = useCallback(
    (id: string, key: string, value: ConfigValue) => {
      setEffectsState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          config: { ...prev[id].config, [key]: value },
        },
      }));
    },
    [],
  );

  // Redraw canvas when image or effects change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    for (const effect of effects) {
      const state = effectsState[effect.id];
      if (state?.enabled) {
        effect.apply(ctx, state.config);
      }
    }
  }, [image, effectsState]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `glitchy-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Glitchy</h1>
        <div className="toolbar">
          <button
            onClick={handleExport}
            disabled={!image}
            className="export-btn"
          >
            Export PNG
          </button>
        </div>
      </header>

      <div className="main">
        <aside className="sidebar">
          <h2>Upload</h2>
          <UploadControl onImageLoaded={setImage} />

          <h2>Effects</h2>
          <div className="effects-list">
            {effects.map((effect) => {
              const state = effectsState[effect.id];
              return (
                <div key={effect.id} className="effect-item">
                  <label className="effect-header">
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={() => toggleEffect(effect.id)}
                      disabled={!image}
                    />
                    <span>{effect.name}</span>
                  </label>
                  {state.enabled && (
                    <div className="effect-config">
                      {effect.fields.map((field) => (
                        <ConfigControl
                          key={field.key}
                          field={field}
                          value={state.config[field.key]}
                          onChange={(val) =>
                            updateConfig(effect.id, field.key, val)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="tip">
            <strong>Tip:</strong> Enable effects and adjust their settings. The
            preview updates once you finish adjusting a value (release a slider,
            leave a number field, or press Enter). Effects are applied in order
            from top to bottom.
          </p>
        </aside>

        <main className="canvas-container">
          <canvas ref={canvasRef} className="canvas" />
          {!image && (
            <p className="empty-state">Upload an image to get started</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
