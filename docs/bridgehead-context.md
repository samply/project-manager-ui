# Acting for a bridgehead in the project view

Many actions of a project belong to one bridgehead: sending the query to a bridgehead, authorizing its data, reviewing
a script as that bridgehead's developer, a document stored for a bridgehead. This page explains how the project view
decides **on whose behalf** a user acts, and why there is no "selected bridgehead" in the page.

Naming: in the code a *site* is a frontend site (dashboard, project view, configuration) and the places taking part in
the infrastructure are *bridgeheads*; a context is the project code plus the project bridgehead. Users never see the
word bridgehead: for them a bridgehead is a *site* and a project is a *request*, so the texts on the screen (and the
mockups below) say "site" and "request".

- Plan and steps: `plans/2026-10-05-plan-site-context.md`.
- Decided with the user on 2026-10-05.

## What it was like before

The first frontend was purely functional: it was built to test the whole workflow, without design. It kept one
**active bridgehead** for the whole page: the first visible bridgehead, changed by clicking a row of the bridgehead
overview in the Status tab. Every call of the page was made with that bridgehead, and the list of actions the user may
use was loaded for it.

In a review with the stakeholders the question came up why one site is highlighted in the Status overview and why it
can be changed. The answer showed the problem: the choice is made in the Status tab, but it silently decides things in
other tabs too - which ethics vote the Request tab shows, and for which bridgehead a document uploaded in the
Documents tab is stored. Nothing on the screen says so.

## Why the bridgehead matters

The bridgehead of a call does two things:

1. **Roles.** The bridgehead roles - BRIDGEHEAD_ADMIN, DEVELOPER, PILOT, FINAL - count only for the bridgehead sent
   with the call (`UserRoles.containsRole`). Without a bridgehead, a bridgehead admin is not a bridgehead admin.
   CREATOR and PROJECT_MANAGER_ADMIN do not depend on a bridgehead.
2. **Target.** For some actions the bridgehead is what the action acts on, or what a file is stored for.

Two facts make this more than a detail:

- One person can administrate several bridgeheads (in Munich, TUM and LMU have the same admin).
- One user can have several roles in the same project (e.g. creator and admin of one bridgehead).

## On whose behalf a user acts

The same rule for documents and for every other action with a bridgehead:

| Role | May act for |
|---|---|
| CREATOR | the whole project (no bridgehead) |
| PROJECT_MANAGER_ADMIN | the whole project, or in the name of any bridgehead |
| BRIDGEHEAD_ADMIN | only the bridgeheads they administrate - one or several; not the whole project |
| DEVELOPER, PILOT, FINAL | only the bridgehead they are assigned to, with that bridgehead's permissions |

Roles add up: the choices for an action are "whole project" if the user is CREATOR or PROJECT_MANAGER_ADMIN, every
bridgehead if PROJECT_MANAGER_ADMIN, and every bridgehead where the user has a bridgehead role that allows the action.
A creator who is also the admin of TUM may act for the whole project and for TUM, not for the other bridgeheads.

To know at which bridgeheads a user has which roles, the project view asks for the roles of each visible bridgehead
(`FETCH_PROJECT_ROLES` answers for one bridgehead at a time) in one request, through the actions batch
(`docs/actions-batch.md`). The list of visible bridgeheads alone is not enough: a creator sees all bridgeheads of the
project, whatever their bridgehead roles are.

## The two options we considered

For users with bridgehead roles at more than one bridgehead, two designs were compared, with the Munich admin (TUM and
LMU) as example. For everyone with one bridgehead, which is almost everyone, both look the same.

**A - one "Acting for site" selector in the page header.** The user chooses a bridgehead once; the whole page, on
every tab, works for that bridgehead until they switch.

```
  Acting for site: [ TUM ▾ ]   You administrate TUM and LMU
  ────────────────────────────────────────────────────────────
  Next step
    Send the query to TUM                       [ Send query ]
  More actions ▾  Resend query (TUM) · Revoke access (TUM)
```

**B - every bridgehead action carries its own bridgehead.** No selector; each button and menu item names its site.

```
  Next step
    Send the query to TUM                       [ Send query ]
    Send the query to LMU                       [ Send query ]
  More actions ▾  TUM: Resend query · TUM: Revoke access
                  LMU: Resend query · LMU: Revoke access
  Script tab:     Authentication script   TUM [⬇]   LMU [⬇]
```

In both, upload dialogs (documents, ethics vote) get a field for the bridgehead ("For:" on the screen) with only the
choices the user is allowed.

| | A: "Acting for site" selector | B: every bridgehead action carries its own bridgehead |
|---|---|---|
| Clarity | Still a "current bridgehead", only visible now. A user who does not notice the selector acts for the wrong one. | No current bridgehead at all. Every button and menu item names its site - the stakeholders' question disappears. |
| Risk of acting for the wrong bridgehead | Possible: switch to LMU, go to Documents, forget you are still on LMU. | None: the bridgehead is part of the action ("LMU: Revoke access"). |
| Overview of pending work | Only for the selected bridgehead; LMU's open steps are hidden while TUM is selected. | Everything for all the user's bridgeheads at once. |
| Daily use (Munich admin) | Switch, act, switch back. | Act directly. |
| Users with one bridgehead (almost all) | As before, no selector. | As before: one bridgehead, one button. |
| Consistency with the upload dialogs | Mixed: uploads choose the bridgehead in the dialog, other actions take it from the header. | One rule everywhere: the bridgehead is chosen, or shown, at the action. |
| Mixed roles (creator + TUM admin) | The selector must also offer "no bridgehead" for the creator's actions - confusing. | Creator actions have no bridgehead, TUM admin actions say TUM. |
| Effort | Small: a selector in the header; the one page bridgehead and its permissions stay. | Larger: Next step, More actions and the Script tab list their actions per bridgehead; the user's state (e.g. script accepted) is loaded per bridgehead. |
| Permissions | One list of active actions per page, as before. | One list per bridgehead of the user (in the end all loaded in the same request, see below). |
| Many bridgeheads | The selector scales to any number. | Lists grow with the bridgeheads - in practice only for users with bridgehead roles at several bridgeheads (Munich: 2). |
| Code afterwards | Keeps the "active bridgehead" state and the reload when switching. | The active bridgehead disappears; every call has an explicit bridgehead or none - easier to follow and to test. |

## Decision: B

- **It removes the problem instead of moving it.** A makes the hidden choice visible; B removes the idea of a current
  bridgehead, which is what confused the stakeholders.
- **Its costs fall on the right side.** B's disadvantages - more work to build, permissions per bridgehead - are paid
  once, by the developers, and only for multi-bridgehead users. A's disadvantage - acting for the wrong bridgehead, not
  seeing the other bridgehead's pending steps - is paid by the users, every day.
- **The growing lists do not hurt in practice:** only users with bridgehead roles at several bridgeheads get them.
- **It matches the rule above:** on whose behalf a user acts is a property of each action, not of the page.

## What this means in the project view

- The bridgehead overview in the Status tab is read only: no highlight, no click. It shows where every bridgehead
  stands; nothing depends on it.
- An action that needs a bridgehead is shown once per bridgehead the user may act for, and names the bridgehead when
  there is more than one. Its permissions are those of that bridgehead.
- Upload dialogs ask for the bridgehead, offering only the allowed choices ("Whole request" and/or sites on the
  screen).
- The Request tab shows the ethics vote per bridgehead.
- Components that already chose the bridgehead themselves stay as they are: the overview's own columns, feasibility,
  inviting users, results, the notifications filter.

## How it is built

- The page context has no bridgehead: it is the project as a whole. Calls with a bridgehead get their own context
  (`createContext(bridgehead)`).
- The page first loads the bridgeheads the user may see directly (`fetchVisibleBridgeheads`, the fixed path
  `/bridgeheads/visible`, open to every user), then `GET /actions` with them (`bridgeheads`), which answers one action
  package per bridgehead plus the one without a bridgehead. `ProjectManagerBackendService` loads them in that one
  request and checks every call against the package of the call's bridgehead. After an action (or in the polling) the
  same two calls again, with a new context.
- A call without a bridgehead that is allowed only through a bridgehead role, and does not need a bridgehead
  (`bridgeheadRequired`), is sent with the first of the user's bridgeheads where it is allowed: there the bridgehead
  only tells the backend the user's role (`resolveCall`). Actions that act on a bridgehead always get it explicitly.
- The roles of the user per bridgehead: `src/services/bridgeheadRoles.ts`.
