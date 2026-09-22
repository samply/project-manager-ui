// Shared classification for the "lifecycle pipeline" visual pattern used by
// both ProjectView.vue's single-bridgehead Status card and
// BridgeheadOverview.vue's per-site timelines: a sequence of steps, each
// done/failed/warning/not_required/not-yet-started, with exactly one "next"
// step per pipeline (the first not-yet-started step following the last step
// that has any activity at all).
//
// "warning" and "not_required" are deliberately kept separate (2026-09-22):
// they used to share the same amber color, but they mean opposite things -
// "something's actively happening, check on it" vs. "nothing to do here,
// this step doesn't apply." Amber is now reserved exclusively for the former.
export type PipelineClassification = 'done' | 'failed' | 'warning' | 'not_required' | 'grey';
export type PipelineStepVisual = 'done' | 'failed' | 'warning' | 'not_required' | 'next' | 'future';

const WARNING_STATES = [
  'to_be_sent', 'to_be_sent_and_executed', 'sending', 'sending_and_executing',
  'export_running_1', 'export_running_2', 'request_changes', 'not_found',
  'inactive', 'expired'
];

// Mirrors state_circle.css's own done/failed/warning/grey bucketing for a raw
// backend state value - not a new color rule, just its computed equivalent.
// Note: state_circle.css has no "not_required" bucket of its own - that
// classification only ever comes from a field's own done/not-done boolean
// (see the ethics vote in both ProjectView.vue and BridgeheadOverview.vue),
// never from this function.
export function classifyStateCircle(value?: string | null): PipelineClassification {
  const normalized = value?.toLowerCase();
  if (!normalized) return 'grey';
  if (['accepted', 'with_data', 'finished'].includes(normalized)) return 'done';
  if (['rejected', 'error'].includes(normalized)) return 'failed';
  if (WARNING_STATES.includes(normalized)) return 'warning';
  return 'grey';
}

// Human-readable descriptions for the raw QueryState values that drive the
// "Data export authorised" step's amber/warning state - shared so
// ProjectView.vue and BridgeheadOverview.vue can't drift apart on wording.
// Best-effort guesses from the state names, not verified backend docs -
// EXPORT_RUNNING_1 vs. EXPORT_RUNNING_2 in particular is an assumption.
export const QUERY_STATE_DESCRIPTIONS: Record<string, string> = {
  TO_BE_SENT: 'Query prepared, waiting to be sent',
  TO_BE_SENT_AND_EXECUTED: 'Query prepared, waiting to be sent and executed',
  SENDING: 'Query is being sent to the site',
  SENDING_AND_EXECUTING: 'Query is being sent and will execute automatically',
  EXPORT_RUNNING_1: 'Data export in progress',
  EXPORT_RUNNING_2: 'Data export in progress (second stage)'
};

export function describeQueryState(state: string): string {
  return QUERY_STATE_DESCRIPTIONS[state] ?? state;
}

// Same idea for "Data received and accepted" - today the only warning value
// there is UserProjectState.REQUEST_CHANGES.
export const CREATOR_STATUS_DESCRIPTIONS: Record<string, string> = {
  REQUEST_CHANGES: 'Applicant requested changes before accepting'
};

export function describeCreatorStatus(state: string): string {
  return CREATOR_STATUS_DESCRIPTIONS[state] ?? state;
}

// "Next" is the first still-grey (untouched) step found after the last step
// with any activity (done/failed/warning/not_required) - not simply the
// first grey step in list order, since steps don't always progress strictly
// left-to-right (e.g. several bridgeheads/project types can advance out of
// sync). Every other grey step is "future".
export function assignPipelineVisuals<T extends { classification: PipelineClassification }>(
    steps: T[]
): (T & { visual: PipelineStepVisual })[] {
  let lastActiveIndex = -1;
  steps.forEach((step, index) => {
    if (step.classification !== 'grey') lastActiveIndex = index;
  });
  let nextIndex = -1;
  for (let i = lastActiveIndex + 1; i < steps.length; i++) {
    if (steps[i].classification === 'grey') {
      nextIndex = i;
      break;
    }
  }
  return steps.map((step, index) => {
    let visual: PipelineStepVisual;
    if (step.classification === 'done') visual = 'done';
    else if (step.classification === 'failed') visual = 'failed';
    else if (step.classification === 'warning') visual = 'warning';
    else if (step.classification === 'not_required') visual = 'not_required';
    else visual = index === nextIndex ? 'next' : 'future';
    return {...step, visual};
  });
}
