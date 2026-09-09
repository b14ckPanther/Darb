insert into core.templates (
  key,
  module_key,
  display_name,
  description,
  is_default,
  sort_order,
  default_theme
)
values
  (
    'restaurant-editorial',
    'restaurant',
    'Editorial',
    'A photography-led menu composition with generous type, asymmetry, and a refined magazine rhythm.',
    false,
    20,
    '{
      "colors": {
        "page": "#F3EEE6", "surface": "#FBF8F2", "elevated": "#FFFFFF",
        "primary": "#28201C", "onPrimary": "#FFFFFF", "accent": "#A74F2D",
        "textPrimary": "#211B18", "textSecondary": "#5C5049", "textMuted": "#786D66",
        "border": "#D8CDC2", "success": "#276B4D", "warning": "#865817", "danger": "#A33D3D"
      },
      "typography": {
        "headingWeight": 800, "bodyWeight": 400, "scale": "generous",
        "tracking": "tight", "lineHeight": "airy"
      },
      "shape": { "radius": "soft", "border": "hairline" },
      "density": "spacious", "shadow": "none", "motion": "subtle",
      "layout": {
        "contentWidth": "wide", "sectionSpacing": "spacious",
        "heroTreatment": "immersive", "cardImageRatio": "portrait"
      }
    }'::jsonb
  ),
  (
    'restaurant-counter',
    'restaurant',
    'Counter',
    'A compact, energetic menu composition built for quick scanning, busy counters, and mobile-first discovery.',
    false,
    30,
    '{
      "colors": {
        "page": "#F2F0E8", "surface": "#FFFFFF", "elevated": "#FFFFFF",
        "primary": "#123F35", "onPrimary": "#FFFFFF", "accent": "#D85F35",
        "textPrimary": "#17251F", "textSecondary": "#45574F", "textMuted": "#68766F",
        "border": "#CED6D0", "success": "#1F704E", "warning": "#84540F", "danger": "#A33D3D"
      },
      "typography": {
        "headingWeight": 800, "bodyWeight": 500, "scale": "balanced",
        "tracking": "tight", "lineHeight": "snug"
      },
      "shape": { "radius": "bold", "border": "defined" },
      "density": "compact", "shadow": "medium", "motion": "expressive",
      "layout": {
        "contentWidth": "balanced", "sectionSpacing": "compact",
        "heroTreatment": "split", "cardImageRatio": "square"
      }
    }'::jsonb
  )
on conflict (key) do nothing;

comment on column core.templates.key is
  'Stable platform composition identifier; Restaurant currently supports Signature, Editorial, and Counter without changing its publication graph.';
