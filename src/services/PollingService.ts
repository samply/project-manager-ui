// PollingService.ts
export class PollingService {
    private callback: () => Promise<void>;
    private shouldPoll: () => boolean;
    private interval: number;
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    constructor(
        callback: () => Promise<void>,
        shouldPoll: () => boolean,
        interval: number = 5000
    ) {
        this.callback = callback;
        this.shouldPoll = shouldPoll;
        this.interval = interval;
    }

    isPolling(): boolean {
        return this.pollingInterval !== null;
    }

    async execute(): Promise<void> {
        await this.callback();
        this.update(this.shouldPoll());
    }

    start(): void {
        if (this.isPolling()) return;
        this.pollingInterval = setInterval(async () => {
            await this.execute();
        }, this.interval);
    }

    stop(): void {
        if (this.isPolling()) {
            clearInterval(this.pollingInterval!);
            this.pollingInterval = null;
        }
    }

    update(shouldPoll: boolean): void {
        shouldPoll ? this.start() : this.stop();
    }
}