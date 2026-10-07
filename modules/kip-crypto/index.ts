import { requireNativeModule } from 'expo';

type KipCrypto = {
  argon2id(password: string, saltB64: string, memoryKiB: number, iterations: number): Promise<string>;
};

export default requireNativeModule<KipCrypto>('KipCrypto');
