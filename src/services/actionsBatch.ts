// Loading a page's data through the backend's actions batch: several read actions in one request, each answered on
// its own (see project-manager/plans/2026-09-30-plan-batch-getter-endpoint.md).
//
// A page declares what it loads as a list of BatchLoads. Loads that depend on the result of others run in a later
// request; runBatchLoads works out those waves. No imports: the module is tested with plain Node.

/** What the backend answers for one entry of a batch. */
export interface BatchResult {
    /** Body of the endpoint's answer; absent for an answer without a body. */
    response?: unknown;
    /** HTTP status the endpoint would have answered with; only for a failed entry. */
    errorCode?: number;
    errorMessage?: string;
    errorStacktrace?: string;
    durationMs?: number;
}

/** Responses of the loads that have run so far, by load id. A load without a response has no entry. */
export type BatchResponses = Record<string, unknown>;

/**
 * One read action of a page. M, A and C are the page's module, action and context types.
 */
export interface BatchLoad<M, A, C> {
    /** Unique within the list; other loads refer to it in dependsOn and read its response by it. */
    id: string;
    module: M;
    action: A;
    /** Default: no parameters besides the context. */
    params?: (responses: BatchResponses) => Map<string, unknown>;
    /** Default: the page's context. */
    context?: (responses: BatchResponses) => C;
    /** Ids of the loads that must have run (successfully or not) before this one. */
    dependsOn?: string[];
    /** Whether to run at all, decided from the responses of the loads it depends on. Default: yes. */
    when?: (responses: BatchResponses) => boolean;
    /** Takes the response of a successful answer. */
    apply?: (response: any) => void | Promise<void>;
    /** Called instead of apply whenever there is no response: not run, not allowed, not found or failed. */
    otherwise?: () => void | Promise<void>;
}

/** One entry of a request to the backend, built from a load. */
export interface BatchEntry<M, A, C> {
    id: string;
    module: M;
    action: A;
    params: Map<string, unknown>;
    context?: C;
}

/**
 * Sends the entries in one request. An entry that may not be sent (action not active for this user and context) has
 * no result.
 */
export type BatchFetcher<M, A, C> = (entries: BatchEntry<M, A, C>[]) => Promise<Map<string, BatchResult>>;

export interface BatchLoadsOutcome {
    responses: BatchResponses;
    /** Entries that failed with something other than "not found" or "not allowed", by load id. */
    errors: Record<string, BatchResult>;
    /** How many requests were sent. */
    waves: number;
}

const NOT_FOUND = 404;
// 403: the URL rule of the endpoint; 405: its role, state or project constraints
const NOT_ALLOWED = [403, 405];

/**
 * Runs the loads in as few requests as their dependencies allow. A failed load never stops the others: it is
 * reported on the console and in the outcome, and its `otherwise` runs.
 */
export async function runBatchLoads<M, A, C>(
    loads: BatchLoad<M, A, C>[],
    fetchBatch: BatchFetcher<M, A, C>
): Promise<BatchLoadsOutcome> {
    const outcome: BatchLoadsOutcome = {responses: {}, errors: {}, waves: 0};
    const ids = new Set(loads.map(load => load.id));
    if (ids.size !== loads.length) {
        throw new Error('Batch loads need unique ids');
    }
    loads.forEach(load => (load.dependsOn ?? []).filter(id => !ids.has(id)).forEach(id => {
        throw new Error(`Batch load '${load.id}' depends on unknown load '${id}'`);
    }));

    const done = new Set<string>();
    let pending = [...loads];
    while (pending.length > 0) {
        const ready = pending.filter(load => (load.dependsOn ?? []).every(id => done.has(id)));
        if (ready.length === 0) {
            throw new Error(`Batch loads depend on each other in a circle: ${pending.map(load => load.id).join(', ')}`);
        }
        pending = pending.filter(load => !ready.includes(load));

        const wave: BatchLoad<M, A, C>[] = [];
        for (const load of ready) {
            if (load.when && !load.when(outcome.responses)) {
                await load.otherwise?.();
            } else {
                wave.push(load);
            }
        }
        if (wave.length > 0) {
            outcome.waves++;
            const results = await fetchBatch(wave.map(load => ({
                id: load.id,
                module: load.module,
                action: load.action,
                params: load.params?.(outcome.responses) ?? new Map<string, unknown>(),
                context: load.context?.(outcome.responses)
            })));
            for (const load of wave) {
                await applyResult(load, results.get(load.id), outcome);
            }
        }
        ready.forEach(load => done.add(load.id));
    }
    return outcome;
}

async function applyResult<M, A, C>(load: BatchLoad<M, A, C>, result: BatchResult | undefined, outcome: BatchLoadsOutcome) {
    try {
        if (result !== undefined && result.errorCode === undefined) {
            // An answer without a body has no response, as with the single endpoint
            outcome.responses[load.id] = result.response;
            await load.apply?.(result.response);
            return;
        }
        if (result?.errorCode === NOT_FOUND) {
            console.warn(`Error 404: Resource not found for action '${load.action}' of module '${load.module}'`);
        } else if (result !== undefined && !NOT_ALLOWED.includes(result.errorCode as number)) {
            outcome.errors[load.id] = result;
            console.error(`Error ${result.errorCode} calling action '${load.action}' of module '${load.module}':`,
                result.errorMessage ?? '', result.errorStacktrace ? `\n${result.errorStacktrace}` : '');
        }
        await load.otherwise?.();
    } catch (error) {
        // A page's own handling of one answer must not stop the other loads
        outcome.errors[load.id] = {errorMessage: String(error)};
        console.error(`Error handling the answer of action '${load.action}' of module '${load.module}':`, error);
    }
}
