# AGENTS.md

Guidelines for AI coding agents working on the Future-Self Health App (hackathon prototype).

## 1. App Concept

This app is a personal, future-self simulation that turns long-term health into immediate, visual feedback. It is Tamagotchi-inspired: users care for a version of themselves 30-50 years in the future. The avatar reacts continuously and reversibly to behavior.

Core loop: Action -> Immediate visible consequence -> Emotional reaction.

Key tone: supportive, friendly, and non-punitive. Progress is continuous and recoverable.

## 2. Tech Stack (Required)

- React (UI framework)
- TypeScript (type safety)
- TailwindCSS (styling)
- React Router (navigation)
- Three.js (avatar rendering)
- LocalStorage (persistence)

No additional dependencies should be added without justification.

## 3. UX and UI Preferences

- Mobile-first UI that feels like a personal companion, not a dashboard.
- Friendly, animated UI with subtle micro-feedback.
- Avoid harsh penalties, warnings, or fear-based language.
- Visual changes are gradual; no sudden failure states.

## 4. Pages

1. Home
   - Full-screen avatar canvas + quick action logging controls.
2. Organ Overview
   - System-level health cards with status and vitality.
3. Organ Detail
   - Focused organ view with animation, score, and impact history.
4. Log / Actions
   - Manual logging toggles/sliders for key behaviors.
5. Insights / Timeline (optional)
   - Short history of events and their effects.
6. Settings / Integrations (mocked)
   - Placeholder UI for future sync integrations.

## 5. Components

- AvatarCanvas (Three.js)
- OrganMapOverlay
- OrganCard
- HealthMeter
- ActionToggle / ActionSlider
- FutureSelfMessage
- HabitImpactList
- TimelineMini
- NavigationBar

## 6. User Flow

1. User opens app -> sees future-self avatar.
2. User logs or syncs a behavior (e.g., gym session).
3. Avatar reacts immediately + short message appears.
4. User taps a body region.
5. Organ detail opens with score and contributing behaviors.
6. User explores other organs and exits.

## 7. Three.js Integration Guidance

Implement the avatar in `AvatarCanvas` using Three.js directly (no react-three-fiber).

Minimum setup:
- Initialize `Scene`, `PerspectiveCamera`, and `WebGLRenderer`.
- Set pixel ratio and size based on container.
- Run an animation loop via `requestAnimationFrame`.
- Handle resize to update camera aspect and renderer size.
- Dispose of renderer, geometries, and materials on unmount to avoid leaks.

## 8. State Model

- Organ health metrics stored in app state.
- Avatar state is derived from organ metrics (posture, energy, vitality).
- Updates are optimistic and immediate.
- Persist state to LocalStorage keyed by user profile (single-user prototype).

Suggested shape:
- `organs`: record of organ health percentages (0-100)
- `events`: list of logged actions with timestamps
- `avatarState`: derived display-only fields (no persistence needed)

## 9. Guardrails

- No backend calls, no analytics, no telemetry.
- No secrets or sensitive data.
- Integrations are mocked only (UI placeholders).

## 10. File Structure

```
src/
  App.tsx
  main.tsx
  index.css
  assets/
  components/
    AvatarCanvas.tsx
    OrganCard.tsx
    PageTitle.tsx
    ProgressBar.tsx
    SectionLabel.tsx
  data/
    organs.ts
  pages/
    Home.tsx
    LogActions.tsx
    OrganDetail.tsx
    OrganOverview.tsx
    Settings.tsx
```

## 11. Testing (Manual Only)

- App loads Home and renders avatar without errors.
- Logging an action updates organ metrics and avatar state immediately.
- Navigation to Organ Detail and back works with React Router.
- LocalStorage persists last known state across reload.

## 12. Run / Test Commands

TBD (define once toolchain is added).

## 13. Assumptions

- Repo has no existing code or tooling.
- React Router is the navigation strategy.
- Three.js is used directly in a React component.
- Persistence is via LocalStorage only.
- No backend/API integration for the prototype.
