# Date input and page language

A date field of a form shows a placeholder such as `tt.mm.jjjj` while it is being filled in, and the same date as
`2026-10-07` in the summary, the request view and the PDF. This page explains why, and what the UI does about it.

- Decided with the user on 2026-10-07 (option A below).

## Two different sources

| Where | Who draws it | Format comes from |
|---|---|---|
| Input of a `DATE` field (draft) | The browser: `<input type="date">` in `ProjectFieldRow.vue` (`datetime-local` for `TIMESTAMP` and `LOCAL_DATE_TIME`) | The **user's browser**: Chrome and Edge use the browser's display language, Firefox the browser or operating-system regional settings, Safari the operating system |
| Summary, request view, PDF | The UI (`formatDisplayDate` in `displayFormatService.ts`) and the backend | The **deployment**: `DATE_FORMAT` etc. in `display-formats.json`, served by `/frontend/display-formats` |

So a user with a German browser sees `tt.mm.jjjj` (*Tag, Monat, Jahr*), a British user `dd/mm/yyyy`, an American user
`mm/dd/yyyy` - each the order they know - while the summary shows the configured English format `yyyy-MM-dd` for
everyone. Both are as designed; they simply follow different settings.

The value itself is not affected: the browser always hands the field over as ISO `yyyy-MM-dd`, and that is what is
stored, whatever the user saw while typing.

## The page language does not change the input

The `lang` attribute of the page (or of an element) does **not** change the format of a browser date input; browsers
ignore it for this. Setting it is still right, for other reasons: screen readers pick the pronunciation from it, and
the browser uses it for hyphenation and spell checking.

The UI sets it from the locale the backend resolves for the display formats (`locale` of `/frontend/display-formats`,
e.g. `en-US`, see `getDisplayLocale`):

- On the app's root element (`<div id="app" :lang="...">` in `App.vue`), always.
- On the document (`<html lang>`, `main.ts`) only when it has none. In the standalone page `public/index.html` leaves
  it empty on purpose for this; as a micro frontend the host page owns `<html>` and the UI does not overwrite its
  language.

"View page source" (Ctrl+U) always shows `<html lang="">`: it shows the file as the server sent it, before any
script ran. The language set by the UI is visible in the live page: developer tools, Elements tab, or
`document.documentElement.lang` in the console (e.g. `en-US`).

The display formats are loaded in single-spa's `bootstrap`, before the app is mounted, so the value is available
from the start; it does not need to be known before the backend answers.

## Options considered

| | What | Result |
|---|---|---|
| **A (chosen)** | Keep the browser's date input; set the page language | Each user gets the date order they know, the browser's calendar and keyboard input. Input and summary may look different (`tt.mm.jjjj` vs `2026-10-07`) |
| B | Own date input with the configured `DATE_FORMAT` (placeholder, parsing, validation, a bundled date picker - no CDN, see the offline-assets plan) | Input, summary and PDF look the same for everyone, at the cost of own validation and accessibility work |
| C | A, plus the chosen date shown next to the input in the configured format | Confirms the entered date in the deployment's format; possible later if users are confused |

Why A: the browser's control is the most familiar one for each user (it uses their own conventions), and `yyyy-MM-dd`
in the summary cannot be misread. If the summary should read even more naturally, a deployment can give its date
fields a long format (`LONG_DATE_FORMAT`, e.g. "October 7, 2026") through `display_format` - no code change needed.

## Checking what a user sees

To see the input as a user with another language would, change the browser's language (Chrome: Settings > Languages >
"Display Google Chrome in this language", restart) - changing the page's `lang` in the developer tools has no effect.
