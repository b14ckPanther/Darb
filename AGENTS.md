# Darb engineering constitution

This file contains permanent repository-wide instructions. Treat these rules as non-negotiable
unless an intentional, reviewed change updates this constitution. More local `AGENTS.md` files may
add constraints, but they must not weaken this document.

## Product and scope

Darb (`درب`) is a multi-tenant, multi-product business platform for the Israeli market. The root
domain is `darb.co.il`, and internal packages use the `@darb/*` namespace.

Preserve clear boundaries between platform infrastructure, applications, and future product
engines. Inspect the repository and Git state before modifying files, preserve unrelated work, and
do not implement a future phase merely because its directory or concept is documented.

## UI and UX

UI quality is one of Darb's highest priorities. Implementation convenience does not take priority
over the quality of the user experience.

Darb interfaces must feel:

- premium;
- modern;
- distinctive;
- smooth;
- highly polished;
- commercially credible.

Never rush into generic component-library aesthetics, generic SaaS dashboards, or a collection of
unstyled defaults. Start from the actual user, surface, and workflow. Preserve strong visual
hierarchy, intentional spacing, coherent interaction states, and a recognizable Darb character.

UX must be intuitive, responsive, accessible, touch-friendly, keyboard-friendly, and fast. Design
and verify mobile, tablet, laptop, and large-desktop behavior. Use semantic HTML, visible focus,
appropriate labels, sufficient contrast, predictable navigation, and adequately sized touch
targets. Accessibility is part of the definition of done, not a later pass.

## Typography

Typography is a first-class design concern. Use these families unless a reviewed brand decision
changes them:

- Arabic: Cairo;
- Hebrew: Heebo;
- English: Ubuntu.

Do not casually substitute random fonts. Every interface must consider hierarchy, weight, spacing,
readability, line height, responsive sizing, font loading, and mixed RTL/LTR behavior. Apply the
correct language and direction metadata to documents and isolated text runs.

## Icons and SVG

Emojis are prohibited in Darb product interfaces, including as fallbacks for missing icons.

Use professional, coherent iconography through `@darb/icons`:

1. Hugeicons is preferred.
2. Lucide is acceptable when it is the better fit.
3. Custom SVG icons and illustrations are explicitly allowed and encouraged when they create a
   more distinctive, premium result.

Do not mix unrelated icon families carelessly. Icons must have consistent sizing, stroke treatment,
alignment, semantics, and accessible labeling. Decorative icons must be hidden from assistive
technology.

## Motion

Animation must be purposeful, smooth, performant, and subtle when appropriate. Use motion to
explain change, reinforce hierarchy, or improve orientation—not for animation's sake. Prefer
compositor-friendly properties, avoid interaction delays, and respect `prefers-reduced-motion`.

## Performance

Performance is part of UX. Public experiences must account for:

- optimized and compressed images;
- responsive image sizing and modern formats where appropriate;
- lazy loading where appropriate;
- prevention of layout shift;
- minimal client-side JavaScript;
- efficient font loading;
- fast initial rendering;
- thoughtful skeleton and loading states.

Never upload or render huge source images directly when optimized delivery is appropriate. Prefer
server components by default in Next.js and introduce client boundaries only when interaction
requires them. Measure consequential performance decisions instead of relying on intuition.

## Data

ABSOLUTELY NO hardcoded business-specific data.

Do not hardcode businesses, restaurants, menu content, services, products, prices, locations,
schedules, themes, enabled modules, or tenant branding. Do not disguise business fixtures as UI
defaults. Business data will come from Supabase through authorized, tenant-aware paths when those
systems are deliberately implemented.

Platform constants are allowed only when they genuinely belong to Darb itself, such as supported
locales, the initial market, platform domains, and product-wide engineering defaults.

## Architecture

Darb is a multi-tenant, multi-product platform, not one giant Next.js application.

- Keep deployable surfaces in focused applications.
- Put only genuinely shared platform concerns in `packages/*`.
- Keep engine-specific domain logic inside its engine boundary.
- Do not move code into a shared package based only on hypothetical future reuse.
- Do not introduce premature microservices. The accepted starting point is a modular monorepo and
  one Supabase project.
- Add a new engine application only through a deliberate architecture decision.
- Keep client, server, and privileged-server code boundaries explicit.
- Avoid circular workspace dependencies and undocumented cross-engine imports.

`@darb/ui` is for the Darb platform/admin system foundation. A future customer-facing
storefront/template/theme system is a separate concern; do not force both into one component model.

## Internationalization

Arabic, Hebrew, and English are supported from the architecture's beginning. Arabic and Hebrew are
RTL; English is LTR. Direction must affect layout primitives, navigation, icons, alignment, and
mixed-language content—not only text alignment.

Use locale-aware formatting for dates, times, numbers, and ILS currency. The platform timezone is
`Asia/Jerusalem`. Do not embed business translations in shared configuration, and do not choose a
permanent URL or fallback-locale strategy without an explicit product decision.

## Security and tenancy

Treat tenant isolation as a security boundary. The future Supabase design is RLS-first and
least-privilege. Authorization must be enforced server-side and in database policies; hidden UI is
not authorization. Never commit credentials, expose privileged Supabase keys to a browser, or log
secrets. Validate untrusted input at every external boundary.

Do not create database tables, policies, migrations, roles, billing paths, or audit systems until
the relevant phase explicitly approves their model. When they are introduced, include negative
tenant-isolation tests and document security-sensitive decisions.

## Code quality and testing

- Use pnpm and the committed workspace lockfile; do not add npm or Yarn lockfiles.
- Keep TypeScript strict. Fix type errors instead of applying broad suppressions.
- Keep ESLint and Prettier clean; broad rule disables require a documented, narrow reason.
- Add tests at the lowest useful level. Use Vitest for unit-level behavior and Playwright for
  user-visible cross-application flows.
- Keep Turborepo tasks and root commands working for `dev`, `build`, `lint`, `typecheck`, and `test`.
- Before changing a Next.js application, read the relevant version-matched guide in
  `node_modules/next/dist/docs/`; framework APIs and conventions may differ from older knowledge.
- Verify changes in proportion to risk, including production builds for framework or routing work.
- Avoid empty abstractions, placeholder packages, and files whose only purpose is to make the
  repository look larger.

## Git and documentation professionalism

Never add AI co-author attribution, Codex attribution, Cursor attribution, Antigravity attribution,
or generated-by-AI notes to commits, source files, pull requests, or documentation.

Commits must be small, coherent, and professionally named. Do not rewrite existing history or push
without explicit authorization. README and documentation must describe only what exists or clearly
label future direction. Write for engineers, companies, reviewers, and operators; avoid promotional
filler and unsupported feature claims.
