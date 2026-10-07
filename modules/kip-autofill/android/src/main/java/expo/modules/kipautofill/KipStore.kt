package expo.modules.kipautofill

import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.io.File
import java.nio.ByteBuffer
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.spec.MGF1ParameterSpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import javax.crypto.spec.SecretKeySpec

/**
 * Files the autofill service shares with the app, sealed with Keystore RSA keys.
 * Sealing only needs the public key, so it works while Kip is locked and with no JS running.
 *
 * - Fill cache: logins the app writes after each unlock/change. Its private key needs a
 *   fingerprint (or screen lock on Android 11+) for every use.
 * - Save queue: logins caught by onSaveRequest. Its private key works without a prompt,
 *   because the app drains it right after the user already unlocked Kip.
 */
object KipStore {
  const val FILL = "kip_autofill_fill"
  const val QUEUE = "kip_autofill_queue"

  private const val RSA = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
  // Keystore only supports SHA-1 for MGF1, so both sides pin it.
  private val OAEP = OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA1, PSource.PSpecified.DEFAULT)
  private val keyStore: KeyStore get() = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

  private fun dir(ctx: Context) = File(ctx.noBackupFilesDir, "kip-autofill").apply { mkdirs() }
  private fun cacheFile(ctx: Context) = File(dir(ctx), "fill.bin")
  private fun queueFile(ctx: Context) = File(dir(ctx), "queue.txt")

  private fun ensureKey(alias: String, userAuth: Boolean) {
    if (keyStore.containsAlias(alias)) return
    val spec = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
      .setKeySize(2048)
      .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA1)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
      .apply {
        if (userAuth) {
          setUserAuthenticationRequired(true)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL)
          }
        }
      }
      .build()
    KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore").apply { initialize(spec) }.generateKeyPair()
  }

  fun deleteKey(alias: String) = keyStore.deleteEntry(alias)

  /** [2-byte wrapped-key length][RSA-wrapped AES key][12-byte IV][AES-GCM ciphertext] */
  private fun seal(alias: String, userAuth: Boolean, plain: ByteArray): ByteArray {
    ensureKey(alias, userAuth)
    // Encrypt in software with a copy of the public key; Keystore public-key ops add nothing here.
    val pub = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(keyStore.getCertificate(alias).publicKey.encoded))
    val aes = ByteArray(32).also { SecureRandom().nextBytes(it) }
    val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
    val wrapped = Cipher.getInstance(RSA).apply { init(Cipher.ENCRYPT_MODE, pub, OAEP) }.doFinal(aes)
    val body = Cipher.getInstance("AES/GCM/NoPadding")
      .apply { init(Cipher.ENCRYPT_MODE, SecretKeySpec(aes, "AES"), GCMParameterSpec(128, iv)) }
      .doFinal(plain)
    return ByteBuffer.allocate(2 + wrapped.size + iv.size + body.size)
      .putShort(wrapped.size.toShort()).put(wrapped).put(iv).put(body).array()
  }

  /** A cipher ready to unwrap with this key. For the fill key, hand it to BiometricPrompt first. */
  fun unwrapCipher(alias: String): Cipher =
    Cipher.getInstance(RSA).apply { init(Cipher.DECRYPT_MODE, keyStore.getKey(alias, null) as PrivateKey, OAEP) }

  private fun open(unwrap: Cipher, blob: ByteArray): ByteArray {
    val buf = ByteBuffer.wrap(blob)
    val wrapped = ByteArray(buf.short.toInt()).also { buf.get(it) }
    val iv = ByteArray(12).also { buf.get(it) }
    val body = ByteArray(buf.remaining()).also { buf.get(it) }
    val aes = unwrap.doFinal(wrapped)
    return Cipher.getInstance("AES/GCM/NoPadding")
      .apply { init(Cipher.DECRYPT_MODE, SecretKeySpec(aes, "AES"), GCMParameterSpec(128, iv)) }
      .doFinal(body)
  }

  // Fill cache

  @Synchronized
  fun writeFillCache(ctx: Context, json: String) {
    cacheFile(ctx).writeBytes(seal(FILL, true, json.toByteArray()))
  }

  fun hasFillCache(ctx: Context) = cacheFile(ctx).exists()

  @Synchronized
  fun readFillCache(ctx: Context, unlocked: Cipher): String = String(open(unlocked, cacheFile(ctx).readBytes()))

  @Synchronized
  fun clearFillCache(ctx: Context) {
    cacheFile(ctx).delete()
  }

  // Save queue: one sealed entry per line, base64.

  @Synchronized
  fun enqueue(ctx: Context, json: String) {
    queueFile(ctx).appendText(Base64.encodeToString(seal(QUEUE, false, json.toByteArray()), Base64.NO_WRAP) + "\n")
  }

  /** Returns every queued entry as JSON strings and empties the queue. Unreadable lines are dropped. */
  @Synchronized
  fun drainQueue(ctx: Context): List<String> {
    val f = queueFile(ctx)
    if (!f.exists()) return emptyList()
    val lines = f.readLines().filter { it.isNotBlank() }
    f.delete()
    if (lines.isEmpty() || !keyStore.containsAlias(QUEUE)) return emptyList()
    return lines.mapNotNull { line ->
      runCatching { String(open(unwrapCipher(QUEUE), Base64.decode(line, Base64.NO_WRAP))) }.getOrNull()
    }
  }
}
