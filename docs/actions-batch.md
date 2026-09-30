# Loading data with the actions batch

Several read actions of the backend can be called in **one request**. Each of them is answered on its own: with its
response, or with the error its endpoint would have answered with. One failing action never affects the others.

Use it wherever a component loads several things at once (a page's first load, one value per site). Keep using
`fetchData` for a single call, for user actions (buttons), and for everything that is not a read action.

- Backend: `POST /actions/batch/results` (`ProjectManagerController.fetchActionsBatch`).
- Frontend: `ProjectManagerBackendService.fetchBatch` and `runBatchLoads` in `src/services/actionsBatch.ts`.
- Background and decisions: `project-manager/plans/2026-09-30-plan-batch-getter-endpoint.md`.

## The two levels

| | Use it when | You get |
|---|---|---|
| `fetchBatch(entries, context)` | you know all calls up front and want the raw results | a `Map` from your entry id to a `BatchResult` |
| `runBatchLoads(loads, fetch)` | calls depend on each other, or each answer sets a value of the component | your `apply` / `otherwise` functions are called; dependent calls go in a later request automatically |

`runBatchLoads` is built on `fetchBatch`. Most components want `runBatchLoads`.

## What can go into a batch

- Only **read actions**: actions whose endpoint is a GET. Anything else gets the error 405 for its entry.
- Only answers that are **JSON**. A download gets 406; call its endpoint with `downloadFile`.
- Actions that are **not active** for the user and the context are not sent at all and have no result, exactly like
  `isModuleActionActive` followed by `fetchData`. This includes actions that need a site when the context has none.
- There is no limit on the number of entries. The backend limits how many run at the same time.

The batch is a frontend action itself (`Module.ACTIONS_MODULE`, `Action.FETCH_ACTIONS_BATCH_ACTION`), so its path comes
from the backend like for every other action. It is available on the request view and the dashboard. To use it on
another site, add a `@FrontendSiteModule` for that site to `fetchActionsBatch` in the backend.

## `fetchBatch`

```ts
const results = await this.projectManagerBackendService.fetchBatch([
  {id: 'states', module: Module.PROJECTS_MODULE, action: Action.FETCH_VISIBLE_PROJECT_STATES_ACTION, params: new Map()},
  {id: 'sites', module: Module.PROJECTS_MODULE, action: Action.FETCH_VISIBLE_BRIDGEHEADS_ACTION, params: new Map()}
], this.context);

const states = results.get('states');
if (states && states.errorCode === undefined) {
  this.availableProjectStates = states.response as ProjectState[];
}
```

- `id` is yours to choose. It only has to be unique within the call; the result comes back under it.
- `params` are the action's own parameters. Project code and site are added from the context, as with `fetchData`.
- The second argument is the context for all entries. An entry can bring its own with `context`.

A result (`BatchResult`) is one of:

| Situation | Result |
|---|---|
| The endpoint answered | `{response, durationMs}`; `response` is missing if the endpoint answers without a body |
| The endpoint refused or failed | `{errorCode, errorMessage?, errorStacktrace?, durationMs}`; `errorCode` is the HTTP status the endpoint would have sent |
| The action is not active | no entry in the map |

`errorCode` values you will meet: 404 (nothing there, e.g. no document), 405 (not allowed for this user, state or
project), 400 (a required parameter is missing), 500 (the backend failed; `errorStacktrace` has the stack trace).

`fetchBatch` itself only throws if the whole request fails (network, not logged in).

### The same action several times

Because entries have their own id, one action can be called for several sites in one request. This is how the Status
table loads the vote of every site (`BridgeheadOverview.updateBridgeheadExtraInfo`):

```ts
const entries = this.bridgeheads.map((bridgehead, index) => ({
  id: `votum-${index}`,
  module: Module.PROJECT_DOCUMENTS_MODULE,
  action: Action.EXISTS_VOTUM_ACTION,
  params: new Map<string, unknown>(),
  context: new ProjectManagerContext(this.context.projectCode, bridgehead)
}));
const results = await this.projectManagerBackendService.fetchBatch(entries, this.context);
this.existsVotums = this.bridgeheads.map((_, index) => results.get(`votum-${index}`)?.response === true);
```

## `runBatchLoads`

A component describes what it loads as a list of **loads**. `runBatchLoads` sends them in as few requests as possible
and calls your functions with the answers.

```ts
import {runBatchLoads} from "@/services/actionsBatch";

await runBatchLoads<Module, Action, ProjectManagerContext>([
  {
    id: 'projectStates', module: Module.PROJECTS_MODULE, action: Action.FETCH_VISIBLE_PROJECT_STATES_ACTION,
    apply: states => this.applyProjectStates(states),
    otherwise: () => this.applyProjectStates([])
  },
  {
    id: 'projects', module: Module.PROJECTS_MODULE, action: Action.FETCH_PROJECTS_ACTION,
    params: () => this.projectsParams(),
    apply: projects => this.applyProjects(projects)
  }
], entries => this.projectManagerBackendService.fetchBatch(entries, this.context));
```

The fields of a load:

| Field | Meaning |
|---|---|
| `id` | Unique in the list. Other loads refer to it. |
| `module`, `action` | The read action to call. |
| `params` | Function returning the action's parameters. Default: none. |
| `context` | Function returning the context for this load. Default: the one given to `fetchBatch`. |
| `dependsOn` | Ids of loads that must have run before this one. |
| `when` | Function deciding whether this load runs at all. Default: yes. |
| `apply` | Called with the response when the endpoint answered. |
| `otherwise` | Called whenever there is **no** response: `when` said no, the action is not active, not found, not allowed, or it failed. |

`params`, `context` and `when` get the responses of the loads that have already run, by id.

What `runBatchLoads` does with each answer:

| Answer | `apply` | `otherwise` | Console |
|---|---|---|---|
| Response | called | – | – |
| 404 | – | called | warning |
| 403 or 405 (not allowed) | – | called | – |
| Not active (not sent) | – | called | – |
| Any other error | – | called | error with message and stack trace |
| `when` returned false | – | called | – |

The answers are applied **in the order of the list**, so put what others build on first. An exception inside your
`apply` or `otherwise` is printed to the console and does not stop the other loads.

It returns `{responses, errors, waves}`: the responses by id, the failed entries by id, and how many requests were sent.

### Dependencies

A load with `dependsOn` is sent in a later request, after the loads it names. Loads without `dependsOn` all go into
the first request.

**Fetch only if something exists.** The description of a document is fetched only when the document exists; otherwise
the value is reset:

```ts
{
  id: 'existsVotum', module: Module.PROJECT_DOCUMENTS_MODULE, action: Action.EXISTS_VOTUM_ACTION,
  apply: exists => { this.existsVotum = exists; }
},
{
  id: 'votumDescription', module: Module.PROJECT_DOCUMENTS_MODULE, action: Action.FETCH_VOTUM_DESCRIPTION_ACTION,
  dependsOn: ['existsVotum'],
  when: responses => responses.existsVotum === true,
  apply: description => { this.votumDescription = description; },
  otherwise: () => { this.votumDescription = {} as ProjectDocument; }
}
```

Request 1 contains `existsVotum`. If it answers `true`, request 2 contains `votumDescription`. If it answers `false`,
fails or is not allowed, no second request is sent for it and `otherwise` runs.

**Use an earlier response as a parameter.** `params` can read what came before (an illustration; no component does
this yet):

```ts
{
  id: 'currentUser', module: Module.USER_MODULE, action: Action.FETCH_CURRENT_USER_ACTION
},
{
  id: 'theirRequests', module: Module.PROJECTS_MODULE, action: Action.FETCH_PROJECTS_ACTION,
  dependsOn: ['currentUser'],
  when: responses => 'currentUser' in responses,
  params: responses => new Map([[PmRequestParameter.PROJECT_CREATOR_EMAIL, (responses.currentUser as User).email]])
}
```

`'currentUser' in responses` is the way to ask "did that load get a response": a load without a response has no entry.

**Several loads waiting for the same one.** They go into the same later request:

```ts
{id: 'selectedForms', module: Module.PROJECT_EDITION_MODULE, action: Action.FETCH_SELECTED_PROJECT_FORMS_ACTION,
  apply: forms => { this.selectedForms = forms; }},
{id: 'formFields', module: Module.PROJECT_EDITION_MODULE, action: Action.FETCH_PROJECT_FORM_FIELDS_ACTION,
  dependsOn: ['selectedForms'], when: responses => 'selectedForms' in responses,
  apply: fields => this.addFormFields(fields)},
{id: 'layouts', module: Module.PROJECT_EDITION_MODULE, action: Action.FETCH_PROJECT_FORM_LAYOUTS_ACTION,
  dependsOn: ['selectedForms'], when: responses => 'selectedForms' in responses,
  apply: layouts => { this.layouts = layouts; }}
```

Chains work the same way: a load that depends on `formFields` would go into a third request.

`runBatchLoads` refuses a list with duplicate ids, a `dependsOn` naming an id that is not in the list, or loads that
depend on each other in a circle. These are programming errors and throw immediately.

### A load for another site or without a site

```ts
{
  id: 'notifications', module: Module.NOTIFICATIONS_MODULE, action: Action.FETCH_NOTIFICATIONS_ACTION,
  // The Notifications tab covers the whole request, not only the active site
  context: () => new ProjectManagerContext(this.context.projectCode, undefined),
  apply: notifications => { this.notifications = notifications; }
}
```

## Where it is used

- `ProjectView.projectRelatedLoads()`: everything the request view loads for its project, in two requests.
- `ProjectDashboard.initializeCurrentData()`: filter options and the first page of requests.
- `BridgeheadOverview.updateBridgeheadExtraInfo()`: vote and DataSHIELD status of every site.

## Testing

`runBatchLoads` has no dependencies and is tested with plain Node: `npm run test:actions-batch`
(`tests/actionsBatch.test.cjs`). A test passes its own `fetch` function instead of the backend service.

## What goes over the wire

Request:

```json
{
  "requests": {
    "existsVotum": {"action": "EXISTS_VOTUM", "params": {"project-code": "TEST-2026-0001", "bridgehead": "site-a"}},
    "projectStates": {"action": "FETCH_PROJECT_STATES", "params": {"project-code": "TEST-2026-0001"}}
  }
}
```

Response:

```json
{
  "results": {
    "existsVotum": {"response": true, "durationMs": 12},
    "projectStates": {"errorCode": 500, "errorMessage": "java.lang.IllegalStateException: ...",
                      "errorStacktrace": "java.lang.IllegalStateException: ...\n\tat ...", "durationMs": 3}
  }
}
```
