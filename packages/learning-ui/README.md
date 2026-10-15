# Shared practice cards

Hozo components for validated [content v1](../../docs/reference/content-package.md),
plus a standalone Storybook. The package exports `CardBody`, `PracticeCard` and
their props as TypeScript source for the host's Hozo integration to compile.
Declaration files are built into `dist/`.

## Run from the repository root

```sh
mise exec -- npm run build:packages
mise exec -- npm run storybook
```

Open http://127.0.0.1:6006. Use the theme toolbar to switch light/dark appearance.
The stories import the public package entry and the repository's original lesson
fixture. They work without Anki, Express or Tauri. `Audio*` stories show host-owned
status examples; they do not play audio, run timers or record answers.

```sh
mise exec -- npm run build:storybook
mise exec -- npm exec -- playwright install --no-shell chromium
mise exec -- npm run test:ui
```

The static catalog is generated under `dist/storybook/` in this package. Browser
tests run the stories in Playwright's bundled Chromium using its new headless
mode, including interaction checks and axe accessibility checks configured to fail
on violations. On Linux, add `--with-deps` to the browser installation command.
Run browser installation again when the locked Playwright version changes.

Root `build` includes declarations and the static Storybook. Root `type-check`
includes this package, its stories and configuration. Root `test` and `ci` include
the browser tests, so install Chromium before running either locally. `setup`
builds/type-checks the package but does not download browsers or run tests.

## Component contract

```tsx
import { PracticeCard } from '@ankiniki/learning-ui';

<PracticeCard
  content={lesson}
  item={lesson.items[0]}
  activityId={lesson.items[0].activities[0].activityId}
  appearance='light'
  onOpenSource={url => host.openExternal(url)}
/>;
```

The host validates the lesson and selects an activity that belongs to the item.
The card displays literal prompt/answer/explanation, provenance and optional
license/source information. HTML and Markdown syntax remain text; whitespace is
preserved and long words wrap. It owns answer visibility, which resets when
package, revision, item or activity changes. Multiple cards keep independent
state. The button retains focus while toggling with mouse, Enter or Space.

`appearance` selects light/dark colors; the host owns its theme preference.
`audio` accepts a host-owned React node for playback/status UI. `onOpenSource`
receives the source URL without opening or fetching it inside the component.
Without the callback, the source is displayed as text.

A consumer must run Hozo over the exported source. Configure `@hozo/vite` (before
React), `@hozo/storybook`, or the corresponding host integration. Add
`@ankiniki/learning-ui` to `content.packages`, retaining any other source packages
the host needs: an explicit list replaces Hozo's default list. The package's
`theme.css` is a Tailwind token input for Hozo's `css` option; do not import it
directly into a browser without a Tailwind pipeline. A host with its own theme
must supply the same semantic color tokens, or adapt the palette in a later
integration. Hozo emits its own preflight and compiled stylesheets.

## Verification and limits

The 14 browser stories check literal text/whitespace, question/answer/explanation,
Enter/Space and focus, item/revision/activity reset, independent cards, host
source callbacks, a 280px card with long content, actual dark colors and six
audio presentation states. Browser axe checks supplement these checks; they do
not establish screen-reader or Native device behavior.

Local development HMR was verified by changing a text-size class from 18px to
20px and restoring it, without reload or losing the revealed answer. Hozo emits
some dynamic-class diagnostics for conditional card/button styles and uses its
project-wide candidate CSS for those literal classes; browser layout and theme
checks exercise that path.

This package does not yet implement Markdown rendering, MDX authoring, a session
controller, audio playback, persistent progress, Anki template rendering or a
Native app. The desktop's existing Anki-backed study screen is unchanged. See
[the implementation stages](../../docs/design/practice-ui-and-authoring.md).
