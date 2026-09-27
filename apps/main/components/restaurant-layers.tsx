"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import type { MainSiteCopy, RestaurantLayerKey } from "../lib/copy";

/**
 * Schematic line drawings for each Restaurant layer. They describe structure only; no business
 * names, dishes, or prices are depicted.
 */
const schematics: Readonly<Record<RestaurantLayerKey, ReactNode>> = {
  menus: (
    <>
      <rect x="18" y="16" width="58" height="16" rx="2" />
      <rect x="84" y="16" width="58" height="16" rx="2" className="is-muted" />
      <path d="M18 50h204M18 78h204M18 106h204" />
      <path d="M18 64h120M18 92h96M18 120h140" className="is-muted" />
    </>
  ),
  items: (
    <>
      {[26, 64, 102].map((y) => (
        <g key={y}>
          <rect x="18" y={y - 12} width="24" height="24" rx="2" />
          <path d={`M54 ${y - 4}h96M54 ${y + 6}h64`} className="is-muted" />
          <path d={`M178 ${y - 9}h30l8 9-8 9h-30z`} />
        </g>
      ))}
    </>
  ),
  availability: (
    <>
      {[50, 120, 190].map((x, index) => (
        <g key={x}>
          <path d={`M${x} 104c-18-22-26-36-26-48a26 26 0 0 1 52 0c0 12-8 26-26 48z`} />
          <circle cx={x} cy="56" r="8" className={index === 1 ? "is-muted" : undefined} />
        </g>
      ))}
      <path d="M100 124l40-16" className="is-accent" />
      <path d="M100 108l40 16" className="is-accent" />
    </>
  ),
  hours: (
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
        const x = 26 + day * 30;
        const split = day === 4;
        return split ? (
          <g key={day}>
            <path d={`M${x} 30v28`} />
            <path d={`M${x} 76v48`} />
          </g>
        ) : (
          <path key={day} d={`M${x} ${day === 6 ? 52 : 30}v${day === 6 ? 72 : 94}`} />
        );
      })}
      <path d="M12 134h216" className="is-muted" />
    </>
  ),
  languages: (
    <>
      <text x="44" y="96" lang="ar" className="schematic-glyph schematic-glyph--ar">
        ع
      </text>
      <text x="108" y="96" lang="he" className="schematic-glyph schematic-glyph--he">
        א
      </text>
      <text x="170" y="96" lang="en" className="schematic-glyph schematic-glyph--en">
        A
      </text>
      <path d="M26 118h188" className="is-muted" />
    </>
  ),
  presence: (
    <>
      <circle cx="40" cy="36" r="16" />
      <rect x="70" y="24" width="152" height="68" rx="2" />
      <path d="M70 92l44-34 30 22 22-16 56 28" className="is-muted" />
      <rect x="18" y="108" width="204" height="18" rx="2" className="is-muted" />
      <path d="M28 117h80" />
    </>
  ),
};

export function RestaurantLayers({ copy }: { copy: MainSiteCopy["restaurant"] }) {
  const [active, setActive] = useState<RestaurantLayerKey>(copy.layers[0]?.key ?? "menus");
  const activeIndex = copy.layers.findIndex((layer) => layer.key === active);

  return (
    <div className="layers" data-active={active}>
      <div className="layers__stage" aria-hidden="true">
        <div className="layers__stack">
          {copy.layers.map((layer, index) => (
            <div
              key={layer.key}
              className="layers__plane"
              data-layer={layer.key}
              data-active={layer.key === active ? "true" : undefined}
              data-above={index > activeIndex ? "true" : undefined}
              style={{ "--layer-index": index } as CSSProperties}
            >
              <svg viewBox="0 0 240 150" focusable="false">
                {schematics[layer.key]}
              </svg>
            </div>
          ))}
        </div>
      </div>

      <ol className="layers__list" aria-label={copy.layersLabel}>
        {copy.layers.map((layer) => {
          const selected = layer.key === active;
          return (
            <li key={layer.key} data-active={selected ? "true" : undefined}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(layer.key)}
                onFocus={() => setActive(layer.key)}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setActive(layer.key);
                }}
              >
                <span className="layers__title">{layer.title}</span>
                <span className="layers__description">{layer.description}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
