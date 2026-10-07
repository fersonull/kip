# Kip: Local-Only Credential Manager (Android, Expo)

## 1. Overview

Kip is an Android app that stores credentials **locally and encrypted**, with **no server and no internet connection**. Speed and ease of use are the top priorities: adding a credential should take a few seconds, and Kip should offer to save credentials automatically when the user logs in or submits a form elsewhere on the device.

### Goals

- Fully offline. The app never makes a network request.
- Fast capture: shake, Quick Settings tile, widget, and shortcuts.
- Automatic "Save to Kip?" prompt on login or form submission, with all captured info.
- Strong, simple security model with biometric quick unlock.

### Non-goals (for now)

- Cloud sync or accounts
- iOS support (Android first)
- Browser extensions
- Passkeys (possible later via Credential Manager on Android 14+)

---

## 2. Platform Constraints

| Idea                                 | Reality                                                                                             | Decision                                                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shake to add while the app is closed | Android doesn't allow background accelerometer access without a battery-draining foreground service | Shake works while the app is open. For closed-app use: Quick Settings tile, widget, long-press icon shortcut. An optional foreground service can come later. |
| Auto-prompt to save on login         | Supported via the Android Autofill framework (`AutofillService.onSaveRequest`)                      | Core feature. Some apps and browsers block or limit autofill, so manual add stays first-class.                                                               |
| PWA                                  | Cannot register an autofill service or Quick Settings tile                                          | Native Android app via Expo development build                                                                                                                |
| Expo Go                              | Cannot load custom native modules                                                                   | Not usable. Use a development build (`expo prebuild` / EAS).                                                                                                 |

---

## 3. Tech Stack

| Need                  | Choice                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| UI / navigation       | React Native + Expo Router (TypeScript)                                                                  |
| Encrypted DB          | `expo-sqlite` with SQLCipher enabled via config plugin                                                   |
| Key storage           | `expo-secure-store` (Android Keystore-backed)                                                            |
| Biometrics            | `expo-local-authentication`                                                                              |
| Master password KDF   | Native Argon2id library (e.g. `react-native-argon2`). Avoid pure-JS Argon2, which is too slow on phones. |
| Shake (app open)      | `expo-sensors` accelerometer                                                                             |
| Screenshot blocking   | `expo-screen-capture`                                                                                    |
| Clipboard             | `expo-clipboard` with a timer to auto-clear                                                              |
| Native Android pieces | Kotlin via the Expo Modules API and config plugins                                                       |

- **Min SDK:** 26 (Android 8.0), where the Autofill framework starts.
- **Workflow:** all native code is wired in through config plugins so `expo prebuild` regenerates `android/` cleanly. Never hand-edit the generated folder.

---

## 4. Security Model

1. A random **256-bit data key** encrypts the database.
2. The data key is wrapped two ways:
   - by a key derived from the **master password** using Argon2id
   - by a **biometric-bound Keystore key** for quick unlock
3. The master password is required on first launch, after a device reboot, or after too many failed biometric attempts.
4. Hardening:
   - `INTERNET` added to `android.blockedPermissions` (a verifiable "no network" claim)
   - `allowBackup: false` so Android cloud backup never copies the vault
   - `FLAG_SECURE` on all screens (no screenshots or recents preview)
   - Clipboard auto-clear after copy
   - Auto-lock on background and after a configurable timeout
5. **Tradeoff:** with no server there is no recovery. If the master password is lost, the data is lost. The UI must state this clearly during setup.

---

## 5. Data Model

**Credential**

- `id`
- `title`
- `username`
- `password`
- `url` or `appId` (web domain or Android package name, used for autofill matching)
- `notes`
- `customFields[]` (label, value, hidden flag)
- `createdAt`, `updatedAt`

**Settings**

- Auto-lock timeout
- Shake sensitivity
- Clipboard clear timeout
- Biometrics on/off

---

## 6. Fast-Add Features

| Trigger                       | Behavior                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Shake (app open)**          | Accelerometer listener opens the Add screen                                                                           |
| **Quick Settings tile**       | `TileService` opens Add after unlock. Closed-app equivalent of shake.                                                 |
| **Long-press icon shortcuts** | "Add credential" and "Search"                                                                                         |
| **Home screen widget**        | One-tap Add and Search (optional)                                                                                     |
| **Closed-app shake**          | Optional, opt-in foreground service with a persistent notification. Off by default because of battery cost. Deferred. |

---

## 7. Autofill and Auto-Save

Kip registers as an `AutofillService`. The user selects it once under Settings → Passwords & Autofill.

### Fill

1. User focuses a login field in an app or browser.
2. Kip detects the fields and shows an **"Unlock Kip"** suggestion.
3. Tapping it launches an authentication activity that runs the biometric prompt.
4. On success, Kip returns the matching dataset, matched by app package or web domain.

### Save

1. User submits a login or sign-up form.
2. Android shows **"Save to Kip?"** with the captured username, password, and the app or site it came from.
3. `onSaveRequest` runs even if the JS runtime is not alive, so the credential is encrypted with a Keystore **public key** (no unlock needed) and written to a **pending queue**.
4. The next time the app is unlocked, it decrypts the queue, opens a prefilled screen for title and notes, and imports the entries into the vault.

### Caveats

- Autofill behavior varies between Chrome, other browsers, and individual apps. Test early on real devices.
- Apps that block autofill cannot be covered. Manual add remains available.
- The service must not depend on the JS runtime, so fill and save logic lives in Kotlin, with the pending queue as the handoff.

---

## 8. Screens

1. Setup (create master password, enable biometrics)
2. Unlock
3. Vault list with search
4. Credential detail (reveal and copy actions)
5. Add / Edit
6. Pending saves review (from autofill)
7. Password generator
8. Settings (auto-lock, shake sensitivity, clipboard timeout, autofill setup shortcut)
9. Backup and Restore

---

## 9. Backup and Restore

- **Encrypted export file** (`.kip`), protected by a user-chosen password via Argon2id and AES-256-GCM.
- Import merges or replaces, with a clear choice for the user.
- Included in the MVP. This is the only way to move devices or recover from a lost phone, since there is no sync.

---

## 10. Milestones

1. **Foundation:** Expo project, development build, SQLCipher DB, master password with Argon2id, biometric unlock, auto-lock, manifest hardening
2. **Vault CRUD:** list, search, add/edit/delete, copy with auto-clear, password generator
3. **Fast add:** foreground shake, then the Quick Settings tile native module, then shortcuts and widget
4. **Autofill:** fill flow first, then the save queue
5. **Backup:** encrypted export and import
6. **Hardening:** weak and reused password check (offline), edge-case testing on real devices, release build checks

---

## 11. Decisions

| Decision                 | Choice                      |
| ------------------------ | --------------------------- |
| Platform                 | Android only (iOS later)    |
| Framework                | Expo with development build |
| Min SDK                  | 26                          |
| Backup                   | Encrypted export in MVP     |
| Closed-app shake service | Skipped initially           |

## 12. Risks

- Autofill inconsistencies across apps and browsers
- Native module complexity (AutofillService, TileService) inside an Expo workflow
- SQLCipher config-plugin compatibility with the current Expo SDK version (verify before building on it)
- Unrecoverable data if the master password is lost (mitigated by backups and clear UX)

## 13. Future

- Passkey support via Android 14+ Credential Manager
- Closed-app shake foreground service (opt-in)
- iOS: credential provider extension for filling, plus Shortcuts and Action Button for fast add
