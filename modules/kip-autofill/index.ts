import { requireNativeModule } from 'expo';

type KipAutofill = {
  isEnabled(): boolean;
  writeFillCache(json: string): Promise<void>;
  clearFillCache(): Promise<void>;
  drainQueue(): Promise<string[]>;
  listApps(): Promise<{ label: string; pkg: string }[]>;
};

export type QueuedLogin = {
  title: string;
  username: string;
  password: string;
  source: string;
  /** Site or app package. Missing on entries queued before it existed. */
  url?: string;
  createdAt: number;
};

export default requireNativeModule<KipAutofill>('KipAutofill');
