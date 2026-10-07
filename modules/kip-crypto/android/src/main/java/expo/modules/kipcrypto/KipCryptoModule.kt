package expo.modules.kipcrypto

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.bouncycastle.crypto.generators.Argon2BytesGenerator
import org.bouncycastle.crypto.params.Argon2Parameters

class KipCryptoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KipCrypto")

    // Runs off the JS thread. Returns a 32-byte key as base64.
    AsyncFunction("argon2id") { password: String, saltB64: String, memoryKiB: Int, iterations: Int ->
      val params = Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
        .withSalt(Base64.decode(saltB64, Base64.NO_WRAP))
        .withMemoryAsKB(memoryKiB)
        .withIterations(iterations)
        .withParallelism(1)
        .build()
      val out = ByteArray(32)
      Argon2BytesGenerator().apply { init(params) }.generateBytes(password.toByteArray(Charsets.UTF_8), out)
      Base64.encodeToString(out, Base64.NO_WRAP)
    }
  }
}
