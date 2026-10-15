export type PersistenceSnapshot<T> = {
  value: T;
  hydration: 'loading' | 'ready' | 'error';
  saveStatus: 'saved' | 'pending' | 'saving' | 'error';
};

type PersistenceOptions<T> = {
  initialValue: T;
  read: () => Promise<T | null>;
  write: (value: T) => Promise<void>;
  intervalMs?: number;
};

/** One owner per storage key, for the lifetime of the JS runtime.
 * Reads never authorize writes on failure. Only acknowledged writes clear dirty
 * revisions; one in-flight writer drains the latest snapshot in revision order.
 */
export class PersistentState<T> {
  private snapshot: PersistenceSnapshot<T>;
  private options: PersistenceOptions<T>;
  private listeners = new Set<() => void>();
  private hydrationTask: Promise<void> | null = null;
  private writeTask: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private revision = 0;
  private savedRevision = 0;
  private failures = 0;

  constructor(options: PersistenceOptions<T>) {
    this.options = options;
    this.snapshot = { value: options.initialValue, hydration: 'loading', saveStatus: 'saved' };
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(patch: Partial<PersistenceSnapshot<T>>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  initialize = (): Promise<void> => {
    if (this.snapshot.hydration === 'ready') return Promise.resolve();
    if (this.hydrationTask) return this.hydrationTask;
    this.publish({ hydration: 'loading' });
    this.hydrationTask = (async () => {
      // Start on a microtask so even a synchronous adapter failure is single-flight.
      await Promise.resolve();
      try {
        const value = await this.options.read();
        this.publish({ value: value ?? this.options.initialValue, hydration: 'ready' });
      } catch {
        this.publish({ hydration: 'error' });
      } finally {
        this.hydrationTask = null;
      }
    })();
    return this.hydrationTask;
  };

  update = (reduce: (value: T) => T): T => {
    if (this.snapshot.hydration !== 'ready') return this.snapshot.value;
    const value = reduce(this.snapshot.value);
    if (value === this.snapshot.value) return value;
    this.revision++;
    this.publish({ value, saveStatus: this.snapshot.saveStatus === 'error' ? 'error' : 'pending' });
    // Bound the unsaved window even during continuous taps. A failure's backoff
    // is not reset by counting; a running writer picks up the latest revision.
    if (!this.writeTask) this.schedule(this.options.intervalMs ?? 400);
    return value;
  };

  private schedule(delay: number) {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delay);
  }

  flush = (): Promise<boolean> => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.snapshot.hydration !== 'ready') return Promise.resolve(false);
    if (this.writeTask) return this.writeTask;
    if (this.savedRevision === this.revision) return Promise.resolve(true);

    this.writeTask = (async () => {
      await Promise.resolve();
      try {
        while (this.savedRevision < this.revision) {
          const revision = this.revision;
          const value = this.snapshot.value;
          // Keep the failure warning visible until a write actually succeeds.
          if (this.snapshot.saveStatus !== 'error') this.publish({ saveStatus: 'saving' });
          await this.options.write(value);
          this.savedRevision = revision;
        }
        this.failures = 0;
        this.publish({ saveStatus: 'saved' });
        return true;
      } catch {
        this.failures++;
        this.publish({ saveStatus: 'error' });
        this.schedule(Math.min(1000 * 2 ** Math.min(this.failures - 1, 5), 30000));
        return false;
      } finally {
        this.writeTask = null;
      }
    })();
    return this.writeTask;
  };

  retry = async (): Promise<void> => {
    if (this.snapshot.hydration !== 'ready') await this.initialize();
    else await this.flush();
  };
}
