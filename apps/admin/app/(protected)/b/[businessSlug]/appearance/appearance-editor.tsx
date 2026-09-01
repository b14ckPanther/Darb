"use client";

import { useActionState, useMemo, useState, type CSSProperties } from "react";

import {
  AlertCircleIcon,
  AppearanceIcon,
  CheckmarkCircleIcon,
  PreviewIcon,
  ResetIcon,
  TypographyIcon,
} from "@darb/icons";
import {
  getThemeContrastIssues,
  resolveTheme,
  themeColorKeys,
  themeToCssVariables,
  type DarbThemeLocale,
  type ThemeColorKey,
  type ThemeOverrides,
  type ThemeTokens,
} from "@darb/theme";

import {
  resetBusinessThemeAction,
  saveBusinessAppearanceAction,
} from "../../../../actions/appearance";
import type { ResolvedBusinessAppearance } from "../../../../../lib/appearance";
import { initialFormState } from "../../../../../lib/forms";
import styles from "./appearance.module.css";

interface AppearanceEditorProps {
  appearance: ResolvedBusinessAppearance;
  business: {
    defaultLocale: DarbThemeLocale;
    displayName: string;
    id: string;
    slug: string;
  };
  editable: boolean;
}

const colorLabels: Record<ThemeColorKey, string> = {
  accent: "Accent",
  border: "Borders",
  danger: "Danger",
  elevated: "Elevated surface",
  onPrimary: "On primary",
  page: "Page",
  primary: "Primary",
  success: "Success",
  surface: "Surface",
  textMuted: "Muted text",
  textPrimary: "Primary text",
  textSecondary: "Secondary text",
  warning: "Warning",
};

const previewCopy = {
  ar: {
    eyebrow: "تجربة رقمية هادئة",
    heading: "هوية واضحة، في كل اتجاه.",
    intro: "معاينة حقيقية للنظام البصري مع اتجاه عربي صحيح وتدرج طباعي مدروس.",
    action: "ابدأ من هنا",
    cards: ["قصة واضحة", "تفاصيل مركّزة", "خطوة تالية"],
  },
  he: {
    eyebrow: "חוויה דיגיטלית רגועה",
    heading: "זהות ברורה, בכל כיוון.",
    intro: "תצוגה חיה של המערכת החזותית עם כיווניות עברית ומדרג טיפוגרפי מדויק.",
    action: "מתחילים מכאן",
    cards: ["סיפור ברור", "פרטים ממוקדים", "השלב הבא"],
  },
  en: {
    eyebrow: "A calm digital experience",
    heading: "A clear identity, in every direction.",
    intro:
      "A live view of the visual system with deliberate hierarchy, spacing, and responsive composition.",
    action: "Start here",
    cards: ["Clear story", "Focused details", "Next step"],
  },
} as const;

export function AppearanceEditor({ appearance, business, editable }: AppearanceEditorProps) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(appearance.template.key);
  const [overrides, setOverrides] = useState<ThemeOverrides>(appearance.overrides);
  const [previewLocale, setPreviewLocale] = useState<DarbThemeLocale>(business.defaultLocale);
  const [confirmReset, setConfirmReset] = useState(false);
  const saveAction = saveBusinessAppearanceAction.bind(null, business.id, business.slug);
  const resetAction = resetBusinessThemeAction.bind(null, business.id, business.slug);
  const [saveState, saveFormAction, savePending] = useActionState(saveAction, initialFormState);
  const [resetState, resetFormAction, resetPending] = useActionState(resetAction, initialFormState);
  const template =
    appearance.templates.find((candidate) => candidate.key === selectedTemplateKey) ??
    appearance.template;
  const resolvedTheme = useMemo(
    () => resolveTheme(template.defaultTheme, overrides),
    [overrides, template],
  );
  const contrastIssues = useMemo(() => getThemeContrastIssues(resolvedTheme), [resolvedTheme]);
  const blockingContrast = contrastIssues.some((issue) => issue.level === "error");
  const previewStyle = themeToCssVariables(resolvedTheme, previewLocale) as CSSProperties;
  const copy = previewCopy[previewLocale];
  const direction = previewLocale === "en" ? "ltr" : "rtl";

  function updateColor(key: ThemeColorKey, value: string): void {
    setOverrides((current) => ({
      ...current,
      colors: { ...current.colors, [key]: value.toUpperCase() },
    }));
  }

  function updateGroup<Key extends "layout" | "shape" | "typography">(
    group: Key,
    key: string,
    value: string | number,
  ): void {
    setOverrides((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }));
  }

  function updateRoot<Key extends "density" | "motion" | "shadow">(
    key: Key,
    value: ThemeTokens[Key],
  ): void {
    setOverrides((current) => ({ ...current, [key]: value }));
  }

  function resetNestedValue(
    group: "colors" | "layout" | "shape" | "typography",
    key: string,
  ): void {
    setOverrides((current) => withoutNestedOverride(current, group, key));
  }

  function resetSections(
    sections: Array<
      keyof Pick<
        ThemeOverrides,
        "colors" | "density" | "layout" | "motion" | "shadow" | "shape" | "typography"
      >
    >,
  ): void {
    setOverrides((current) => {
      const next = { ...current };
      for (const section of sections) delete next[section];
      return next;
    });
  }

  return (
    <section className={styles.editor} aria-labelledby={`appearance-${appearance.moduleKey}`}>
      <header className={styles.editorHeader}>
        <div>
          <p className="eyebrow">{appearance.moduleDisplayName} capability</p>
          <h2 id={`appearance-${appearance.moduleKey}`}>Rendering foundation</h2>
          <p>
            Template and theme state are stored now; the customer-facing{" "}
            {appearance.moduleDisplayName.toLowerCase()} engine remains intentionally unbuilt.
          </p>
        </div>
        <span className={styles.contextKey} dir="ltr">
          {appearance.moduleKey}
        </span>
      </header>

      {appearance.fallbackReason ? (
        <p className={styles.fallbackNotice} role="status">
          <AlertCircleIcon size={18} /> The stored template is unavailable. Previewing the safe
          platform default without deleting the retained selection.
        </p>
      ) : null}

      <div className={styles.workspace}>
        <div className={styles.controls}>
          <section className={styles.controlSection} aria-labelledby="template-section-heading">
            <div className={styles.sectionHeading}>
              <AppearanceIcon size={20} />
              <div>
                <span>01</span>
                <h3 id="template-section-heading">Composition</h3>
              </div>
            </div>
            <div className={styles.templateGrid}>
              {appearance.templates.map((candidate) => (
                <label
                  key={candidate.key}
                  className={`${styles.templateCard}${candidate.key === selectedTemplateKey ? ` ${styles.selectedTemplate}` : ""}${!candidate.isAvailable ? ` ${styles.unavailableTemplate}` : ""}`}
                >
                  <input
                    type="radio"
                    name="template-choice"
                    value={candidate.key}
                    checked={candidate.key === selectedTemplateKey}
                    disabled={!editable || !candidate.isAvailable}
                    onChange={() => setSelectedTemplateKey(candidate.key)}
                  />
                  <TemplateSwatch template={candidate} />
                  <span className={styles.templateCopy}>
                    <strong>{candidate.displayName}</strong>
                    <small>{candidate.description}</small>
                  </span>
                  <span className={styles.templateStatus}>
                    {candidate.isAvailable
                      ? candidate.isDefault
                        ? "Platform default"
                        : "Available"
                      : "Unavailable"}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.controlSection} aria-labelledby="color-section-heading">
            <div className={styles.sectionHeadingRow}>
              <div className={styles.sectionHeading}>
                <AppearanceIcon size={20} />
                <div>
                  <span>02</span>
                  <h3 id="color-section-heading">Semantic color</h3>
                </div>
              </div>
              {editable ? (
                <button
                  className={styles.sectionReset}
                  type="button"
                  disabled={!overrides.colors}
                  onClick={() => resetSections(["colors"])}
                >
                  <ResetIcon size={15} /> Reset colors
                </button>
              ) : null}
            </div>
            <div className={styles.colorGrid}>
              {themeColorKeys.map((key) => (
                <ColorControl
                  key={`${key}-${resolvedTheme.colors[key]}`}
                  editable={editable}
                  id={`${appearance.moduleKey}-${key}`}
                  label={colorLabels[key]}
                  overridden={overrides.colors?.[key] !== undefined}
                  value={resolvedTheme.colors[key]}
                  onChange={(value) => updateColor(key, value)}
                  onReset={() => resetNestedValue("colors", key)}
                />
              ))}
            </div>
            {contrastIssues.length > 0 ? (
              <div className={styles.contrastPanel}>
                <h4>Contrast review</h4>
                <ul>
                  {contrastIssues.map((issue) => (
                    <li
                      className={issue.level === "error" ? styles.contrastError : ""}
                      key={`${issue.foreground}-${issue.background}`}
                    >
                      <span>{issue.level === "error" ? "Resolve" : "Review"}</span>
                      {colorLabels[issue.foreground]} on{" "}
                      {colorLabels[issue.background].toLowerCase()}: {issue.actualRatio.toFixed(2)}
                      :1
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={styles.contrastPass}>
                <CheckmarkCircleIcon size={17} /> Critical color pairs meet AA contrast.
              </p>
            )}
          </section>

          <section className={styles.controlSection} aria-labelledby="type-section-heading">
            <div className={styles.sectionHeadingRow}>
              <div className={styles.sectionHeading}>
                <TypographyIcon size={20} />
                <div>
                  <span>03</span>
                  <h3 id="type-section-heading">Type and rhythm</h3>
                </div>
              </div>
              {editable ? (
                <button
                  className={styles.sectionReset}
                  type="button"
                  disabled={!hasTypeAndRhythmOverrides(overrides)}
                  onClick={() =>
                    resetSections(["typography", "shape", "density", "shadow", "motion", "layout"])
                  }
                >
                  <ResetIcon size={15} /> Reset section
                </button>
              ) : null}
            </div>
            <div className={styles.selectGrid}>
              <SelectControl
                id={`${appearance.moduleKey}-heading-weight`}
                label="Heading weight"
                value={String(resolvedTheme.typography.headingWeight)}
                disabled={!editable}
                overridden={overrides.typography?.headingWeight !== undefined}
                options={["600", "700", "800"]}
                onChange={(value) => updateGroup("typography", "headingWeight", Number(value))}
                onReset={() => resetNestedValue("typography", "headingWeight")}
              />
              <SelectControl
                id={`${appearance.moduleKey}-body-weight`}
                label="Body weight"
                value={String(resolvedTheme.typography.bodyWeight)}
                disabled={!editable}
                overridden={overrides.typography?.bodyWeight !== undefined}
                options={["400", "500"]}
                onChange={(value) => updateGroup("typography", "bodyWeight", Number(value))}
                onReset={() => resetNestedValue("typography", "bodyWeight")}
              />
              <SelectControl
                id={`${appearance.moduleKey}-type-scale`}
                label="Type scale"
                value={resolvedTheme.typography.scale}
                disabled={!editable}
                overridden={overrides.typography?.scale !== undefined}
                options={["compact", "balanced", "generous"]}
                onChange={(value) => updateGroup("typography", "scale", value)}
                onReset={() => resetNestedValue("typography", "scale")}
              />
              <SelectControl
                id={`${appearance.moduleKey}-line-height`}
                label="Line height"
                value={resolvedTheme.typography.lineHeight}
                disabled={!editable}
                overridden={overrides.typography?.lineHeight !== undefined}
                options={["snug", "comfortable", "airy"]}
                onChange={(value) => updateGroup("typography", "lineHeight", value)}
                onReset={() => resetNestedValue("typography", "lineHeight")}
              />
              <SelectControl
                id={`${appearance.moduleKey}-corners`}
                label="Corners"
                value={resolvedTheme.shape.radius}
                disabled={!editable}
                overridden={overrides.shape?.radius !== undefined}
                options={["soft", "rounded", "bold"]}
                onChange={(value) => updateGroup("shape", "radius", value)}
                onReset={() => resetNestedValue("shape", "radius")}
              />
              <SelectControl
                id={`${appearance.moduleKey}-density`}
                label="Density"
                value={resolvedTheme.density}
                disabled={!editable}
                overridden={overrides.density !== undefined}
                options={["compact", "comfortable", "spacious"]}
                onChange={(value) => updateRoot("density", value as ThemeTokens["density"])}
                onReset={() => resetSections(["density"])}
              />
              <SelectControl
                id={`${appearance.moduleKey}-depth`}
                label="Depth"
                value={resolvedTheme.shadow}
                disabled={!editable}
                overridden={overrides.shadow !== undefined}
                options={["none", "subtle", "medium", "strong"]}
                onChange={(value) => updateRoot("shadow", value as ThemeTokens["shadow"])}
                onReset={() => resetSections(["shadow"])}
              />
              <SelectControl
                id={`${appearance.moduleKey}-motion`}
                label="Motion"
                value={resolvedTheme.motion}
                disabled={!editable}
                overridden={overrides.motion !== undefined}
                options={["reduced", "subtle", "expressive"]}
                onChange={(value) => updateRoot("motion", value as ThemeTokens["motion"])}
                onReset={() => resetSections(["motion"])}
              />
              <SelectControl
                id={`${appearance.moduleKey}-content-width`}
                label="Content width"
                value={resolvedTheme.layout.contentWidth}
                disabled={!editable}
                overridden={overrides.layout?.contentWidth !== undefined}
                options={["focused", "balanced", "wide"]}
                onChange={(value) => updateGroup("layout", "contentWidth", value)}
                onReset={() => resetNestedValue("layout", "contentWidth")}
              />
              <SelectControl
                id={`${appearance.moduleKey}-hero-treatment`}
                label="Hero treatment"
                value={resolvedTheme.layout.heroTreatment}
                disabled={!editable}
                overridden={overrides.layout?.heroTreatment !== undefined}
                options={["minimal", "split", "immersive"]}
                onChange={(value) => updateGroup("layout", "heroTreatment", value)}
                onReset={() => resetNestedValue("layout", "heroTreatment")}
              />
            </div>
          </section>

          {editable ? (
            <div className={styles.actions}>
              <form action={saveFormAction}>
                <input type="hidden" name="moduleKey" value={appearance.moduleKey} />
                <input type="hidden" name="templateKey" value={template.key} />
                <input type="hidden" name="themeOverrides" value={JSON.stringify(overrides)} />
                <button
                  className="primary-button"
                  type="submit"
                  disabled={savePending || blockingContrast}
                >
                  {savePending ? "Saving appearance…" : "Save appearance"}
                </button>
              </form>
              {!confirmReset ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setConfirmReset(true)}
                >
                  <ResetIcon size={18} /> Reset theme
                </button>
              ) : (
                <div
                  className={styles.resetConfirmation}
                  role="group"
                  aria-label="Reset theme overrides"
                >
                  <p>Reset every override to this template’s defaults?</p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    disabled={resetPending}
                  >
                    Keep changes
                  </button>
                  <form action={resetFormAction}>
                    <input type="hidden" name="moduleKey" value={appearance.moduleKey} />
                    <button
                      className="danger-button"
                      type="submit"
                      disabled={resetPending}
                      onClick={() => {
                        setOverrides({});
                      }}
                    >
                      {resetPending ? "Resetting…" : "Confirm reset"}
                    </button>
                  </form>
                </div>
              )}
              <ActionFeedback state={saveState} />
              <ActionFeedback state={resetState} />
            </div>
          ) : null}
        </div>

        <aside className={styles.previewColumn} aria-label="Live appearance preview">
          <div className={styles.previewToolbar}>
            <span>
              <PreviewIcon size={18} /> Live preview
            </span>
            <label>
              <span className="sr-only">Preview language</span>
              <select
                aria-label="Preview language"
                value={previewLocale}
                onChange={(event) => setPreviewLocale(event.target.value as DarbThemeLocale)}
              >
                <option value="ar">العربية</option>
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <div
            className={`${styles.preview} ${template.key === "foundation-editorial" ? styles.previewEditorial : styles.previewCanvas}`}
            dir={direction}
            lang={previewLocale}
            style={previewStyle}
          >
            <div className={styles.previewNav}>
              <strong dir="auto">{business.displayName}</strong>
              <span aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className={styles.previewHero}>
              <div>
                <p>{copy.eyebrow}</p>
                <h3>{copy.heading}</h3>
                <span>{copy.intro}</span>
                <span className={styles.previewAction}>{copy.action}</span>
              </div>
              <div className={styles.previewArt} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles.previewCards}>
              {copy.cards.map((card, index) => (
                <div key={card}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <strong>{card}</strong>
                  <i aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
          <p className={styles.previewBoundary}>
            Rendered from the same resolved token contract future customer-facing surfaces will
            consume.
          </p>
        </aside>
      </div>
    </section>
  );
}

function TemplateSwatch({ template }: { template: ResolvedBusinessAppearance["template"] }) {
  const style = themeToCssVariables(template.defaultTheme, "en") as CSSProperties;
  return (
    <span className={styles.templateSwatch} style={style} aria-hidden="true">
      <i />
      <i />
      <i />
      <b />
    </span>
  );
}

function SelectControl({
  disabled,
  id,
  label,
  onChange,
  onReset,
  options,
  overridden,
  value,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onReset: () => void;
  options: readonly string[];
  overridden: boolean;
  value: string;
}) {
  return (
    <div className={styles.selectControl}>
      <span className={styles.fieldLabelRow}>
        <label htmlFor={id}>{label}</label>
        {!disabled && overridden ? (
          <button type="button" onClick={onReset} aria-label={`Reset ${label.toLowerCase()}`}>
            <ResetIcon size={13} />
          </button>
        ) : null}
      </span>
      <select
        id={id}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {humanize(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorControl({
  editable,
  id,
  label,
  onChange,
  onReset,
  overridden,
  value,
}: {
  editable: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onReset: () => void;
  overridden: boolean;
  value: string;
}) {
  const [draft, setDraft] = useState(value);
  const valid = /^#[0-9A-Fa-f]{6}$/.test(draft);
  const inputId = `appearance-color-${id}`;

  return (
    <div className={styles.colorControl}>
      <label htmlFor={inputId}>{label}</label>
      <span className={styles.colorInputWrap}>
        <input
          aria-label={`${label} swatch`}
          type="color"
          value={valid ? draft : value}
          disabled={!editable}
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            setDraft(next);
            onChange(next);
          }}
        />
        <input
          id={inputId}
          className={styles.hexInput}
          aria-label={`${label} color`}
          aria-invalid={!valid}
          aria-describedby={!valid ? `${inputId}-error` : undefined}
          autoComplete="off"
          disabled={!editable}
          maxLength={7}
          pattern="#[0-9A-Fa-f]{6}"
          spellCheck={false}
          type="text"
          value={draft}
          onBlur={() => {
            if (!valid) setDraft(value);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (/^#[0-9A-Fa-f]{6}$/.test(next)) onChange(next);
          }}
        />
        {editable && overridden ? (
          <button type="button" onClick={onReset} aria-label={`Reset ${label.toLowerCase()} color`}>
            <ResetIcon size={13} />
          </button>
        ) : null}
      </span>
      {!valid ? (
        <small id={`${inputId}-error`} role="status">
          Use #RRGGBB.
        </small>
      ) : null}
    </div>
  );
}

function ActionFeedback({ state }: { state: typeof initialFormState }) {
  if (!state.message) return null;
  return (
    <p
      className={state.status === "success" ? styles.success : styles.error}
      role={state.status === "success" ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

function humanize(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function withoutNestedOverride(
  overrides: ThemeOverrides,
  group: "colors" | "layout" | "shape" | "typography",
  key: string,
): ThemeOverrides {
  const values = overrides[group];
  if (!values || !(key in values)) return overrides;
  const nextValues = Object.fromEntries(Object.entries(values).filter(([name]) => name !== key));
  const next = { ...overrides };
  if (Object.keys(nextValues).length === 0) delete next[group];
  else Object.assign(next, { [group]: nextValues });
  return next;
}

function hasTypeAndRhythmOverrides(overrides: ThemeOverrides): boolean {
  return Boolean(
    overrides.typography ||
    overrides.shape ||
    overrides.density ||
    overrides.shadow ||
    overrides.motion ||
    overrides.layout,
  );
}
