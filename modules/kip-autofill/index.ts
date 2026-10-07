import { requireNativeModule } from 'expo';

type KipAutofill = {
  isEnabled(): boolean;
  writeFillCache(json: string): Promise<void>;
  clearFillCache(): Promise<void>;
  drainQueue(): Promise<string[]>;
};

export type QueuedLogin = { title: string; username: string; password: string; source: string; createdAt: number };

export default requireNativeModule<KipAutofill>('KipAutofill');
