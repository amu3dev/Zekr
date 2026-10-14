<div align="center">

  <img src="./assets/launcher-icon.png" alt="Zekr Logo" width="120" height="120" style="border-radius: 28px;" />

  # Zekr — ذِكْر

  ### A Serene, Privacy-First Islamic Tasbeeh & Dhikr Mobile Companion
  **مسبحة إلكترونية هادئة ورفيق يومي للذكر والسكينة**

  <p align="center">
    <b>English</b> • <a href="./README.ar.md">العربية (Arabic)</a>
  </p>

  <p align="center">
    <a href="#-app-preview">App Preview</a> •
    <a href="#-about-zekr">About</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-dhikr-library--meanings">Dhikr Library & Meanings</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-privacy--ethics">Privacy</a>
  </p>

  [![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
  [![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-DFBA6B?style=for-the-badge)](./LICENSE)
  [![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline-2F855A?style=for-the-badge)](#-privacy--ethics)

</div>

---

> 🌍 **Language Selection:**
> - [**English**](./README.md) (Current)
> - [**العربية (Arabic)**](./README.ar.md)

---

## 🎨 Design Preview

> [!NOTE]
> The mockups below illustrate the design reference and visual vision for Zekr. The live React Native/Expo application implements these aesthetics through native vector SVG geometry, system typography, and responsive controls.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./assets/screenshots/screen-main.png" width="240" alt="Main Tasbeeh Screen (Design Preview)" style="border-radius: 18px;" />
        <br />
        <sub><b>Main Tasbeeh Ring (Design Preview)</b><br />حلقة التسبيح وحبات المسبحة</sub>
      </td>
      <td align="center">
        <img src="./assets/screenshots/screen-library.png" width="240" alt="Dhikr Library & Virtues (Design Preview)" style="border-radius: 18px;" />
        <br />
        <sub><b>Dhikr Library & Virtues (Design Preview)</b><br />مكتبة الأذكار وفضائلها</sub>
      </td>
      <td align="center">
        <img src="./assets/screenshots/screen-freetap.png" width="240" alt="Eyes-Free Tap HUD (Design Preview)" style="border-radius: 18px;" />
        <br />
        <sub><b>Eyes-Free Tap HUD (Design Preview)</b><br />وضع النقر في كامل الشاشة</sub>
      </td>
    </tr>
  </table>
</div>

---

## 📖 About Zekr

**Zekr (ذِكر)** is an open-source, mobile application crafted with love to provide a peaceful and focused remembrance (*Dhikr*) and tasbeeh experience. 

Designed for both Arabic speakers and **non-native Arabic speakers worldwide**, Zekr blends **timeless Islamic sacred geometry** with modern, tactile mobile physics. It offers a distraction-free spiritual companion that is completely offline, privacy-first, and free of commercial ads forever.

> *"Verily, in the remembrance of Allah do hearts find rest."* — Surah Ar-Ra'd (13:28)

---

## ✨ Key Features

### 📿 1. Interactive Adaptive Tasbeeh Ring
- **Prayer Beads & Goal Progress**: The 33 beads light up once per tap and repeat automatically. The outer arc and its label show progress within the selected goal interval; the large number keeps the cumulative count.
- **Micro-Animations & Physics**: Fluid spring recoil (`Animated.spring`) on touch, restrained light-wave ripples, and a subtle number pop on every increment, with reduced-motion support.
- **Target Completion Feedback**: A brief completion message and success haptic at each multiple of the selected goal. Goals of 1 use ordinary tap feedback without repeated completion messages or announcements.

### 🌟 2. Sacred Islamic Geometric Backdrop
- An SVG vector background featuring the **8-Pointed Islamic Star** (*Khatam Suleiman*) and arabesque framing with a gentle theme-aware ambient glow.

### 📚 3. Authentic Dhikr Library with Full Vowel Marks (Tashkeel)
- Fully diacritized Arabic phrases accompanied by their authentic Hadith references (*Sahih al-Bukhari*, *Sahih Muslim*, *Muttafaqun 'Alayh*).
- Clear English transliterations and translations to empower non-native Arabic speakers.
- Grouped into meaningful categories (*Taspbih*, *Comprehensive Remembrance*, *Istighfar*, *Salawat*).

### 🔁 4. Automatic Milestones & Lifetime Session Stats
- Displays the current 33-bead round (*Round 1, Round 2, Round 3...*), independently of the selected goal.
- All-time session tally formatted with authentic Arabic numerals (`١،٢٥٠`).
- Continues counting automatically through every goal milestone, without resetting the count or requiring a next-cycle button.

### 📱 5. Full-Screen Tap Mode (Eyes-Free Tasbeeh)
- Toggle full-screen mode to tap anywhere on your display without having to aim for the center circle. Ideal for walking, night reflection, or quiet remembrance.

### 📳 6. Customizable Haptic Touch Feedback
- Fine-tuned vibrational pulses powered by `expo-haptics` that differentiate between individual bead counts and goal completion.

### 🎨 7. Three Complete Visual Identities
- Switch instantly between Midnight Sapphire, Royal Amethyst, and Soft Ivory from Settings. Each theme coordinates the background, surfaces, ring, beads, controls, typography, borders, and completion feedback, and the selected theme is saved locally.

### 🌌 8. Intentional Native Launch Experience
- Both native platforms use a stable Midnight Sapphire background and the same transparent Tasbeeh emblem. The JavaScript launch layer reveals the beads, glow, and `ذِكْر` branding after home is prepared.
- Native handoff waits for restored theme/counter state and home layout, independently of the skippable 820 ms introduction. The first intro tap only skips; reduced motion uses a static handoff, and returning from background does not replay it.

### 🔒 9. 100% Offline & Absolute Privacy
- **Zero Ads, Zero Trackers**: No analytics SDKs, no third-party network calls.
- **Zero Permissions**: Requires neither internet access nor media/storage permissions.
- **Local Persistence**: State and preferences are saved locally on your device via `AsyncStorage`.

---

## 📖 Dhikr Library & Meanings

For non-native Arabic speakers, here is a guide to the authentic remembrances included in Zekr:

| Remembrance & Transliteration | Arabic Text | Meaning / Translation | Prescribed Count & Hadith Source |
| :--- | :--- | :--- | :--- |
| **Tasbeeh & Tahmeed**<br>*Subhan Allahi wa bihamdihi, Subhan Allahil-'Azeem* | سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ | *"Glory be to Allah and praise Him; Glory be to Allah the Magnificent."* | **100×**<br>Two phrases light on the tongue, heavy on the balance, beloved to the Most Merciful (*Agreed Upon / Bukhari & Muslim*) |
| **Istighfar (Seeking Forgiveness)**<br>*Astaghfirullaha wa atoobu ilayh* | أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ | *"I seek the forgiveness of Allah and turn to Him in repentance."* | **100×**<br>The Prophet ﷺ sought forgiveness over 70/100 times daily (*Sahih al-Bukhari*) |
| **At-Tasbeeh**<br>*Subhan Allah* | سُبْحَانَ اللَّهِ | *"Glory be to Allah (above all imperfection)."* | **100× / 33×**<br>Whoever says it 100 times receives 1,000 good deeds or has 1,000 sins expiated (*Sahih Muslim*) |
| **At-Tahmeed**<br>*Al-Hamdulillah* | الْحَمْدُ لِلَّهِ | *"All praise and gratitude belong to Allah alone."* | **33×**<br>"Alhamdulillah fills the scale of good deeds" (*Sahih Muslim*) |
| **At-Takbeer**<br>*Allahu Akbar* | اللَّهُ أَكْبَرُ | *"Allah is the Greatest."* | **33×**<br>Among the four most beloved words to Allah (*Sahih Muslim*) |
| **At-Tahlil (Declaration of Oneness)**<br>*La ilaha illallahu wahdahu la shareeka lah...* | لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ | *"There is no deity worthy of worship except Allah alone, without partner; to Him belongs all sovereignty and praise..."* | **100×**<br>Equivalent to freeing 10 captives, 100 good deeds written, 100 sins erased, and protection from Satan (*Agreed Upon*) |
| **Al-Hawqala**<br>*La hawla wa la quwwata illa billah* | لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ | *"There is no power nor might except with Allah."* | **100×**<br>A treasure from the treasures of Paradise (*Agreed Upon*) |
| **As-Salawat (Blessings upon the Prophet)**<br>*Allahumma salli wa sallim 'ala Nabiyyina Muhammad* | اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ | *"O Allah, send peace and blessings upon our Prophet Muhammad."* | **100×**<br>Whoever sends one blessing upon him, Allah sends ten blessings upon them (*Sahih Muslim*) |
| **Al-Baqiyat As-Salihat**<br>*Subhan Allah, wal-Hamdulillah, wa la ilaha illallah, wallahu Akbar* | سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ | *"Glory be to Allah, praise be to Allah, there is no deity but Allah, and Allah is Greatest."* | **33×**<br>"Beloved to me more than all upon which the sun rises" (*Sahih Muslim*) |
| **Sayyid al-Istighfar (Chief of Forgiveness)**<br>*Allahumma Anta Rabbi la ilaha illa Anta...* | اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ... | *"O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant..."* | **1× (Morning & Evening)**<br>Whoever recites it with conviction and passes away that day enters Paradise (*Sahih al-Bukhari*) |

---

## 🛠️ Tech Stack

| Technology / Package | Version | Purpose |
| :--- | :--- | :--- |
| **Expo SDK** | `~57.0` | Cross-platform runtime and build toolchain |
| **React Native** | `0.86.3` | Native UI components and rendering |
| **React** | `19.2.3` | Core UI state management |
| **TypeScript** | `~6.0` | Strict type safety and compilation |
| **React Native SVG** | `15.15.4` | Sacred geometric art, 33-bead tasbeeh track, and icons |
| **Expo Linear Gradient** | `~57.0` | Theme-aware background gradients |
| **Expo Haptics** | `~57.0` | Tactile sensory feedback engine |
| **Expo Splash Screen** | `~57.0` | Native launch screen configuration and handoff |
| **AsyncStorage** | `2.2.0` | Unencrypted local offline persistence |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v22.13 or newer)
- **Expo Go** app on your physical mobile device ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or an iOS Simulator / Android Emulator.

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amu3dev/Zekr.git
   cd Zekr
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo Metro dev server:**
   ```bash
   npx expo start
   ```

4. **Preview on your device:**
   - Scan the **QR Code** in your terminal using the Expo Go app (Android) or the camera app (iOS).
   - Or press `i` to launch the **iOS Simulator**, or `a` to launch the **Android Emulator**.

> Expo Go and development builds do not reproduce the production splash screen. Use a preview or production native build to validate the launch artwork and Android 12 behavior.

### Quality Checks
```bash
# Run TypeScript strict type verification
npx tsc --noEmit

# Run lint rules
npm run lint

# Run counter-regression tests
npm test

# Run Expo project configuration and health diagnostics
npx expo-doctor
```

---

## 📂 Project Architecture

```
Zekr/
├── assets/                       # Launcher icons, transparent splash artwork, and adaptive assets
├── src/
│   ├── components/
│   │   ├── CounterRing.tsx       # Adaptive goal-progress tasbeeh ring & spring animations
│   │   ├── IslamicGeometry.tsx   # 8-point sacred star vector motif & ambient glows
│   │   ├── Icons.tsx             # Clean SVG vector icon collection
│   │   └── Modals.tsx            # Dhikr library, target presets, settings, & theme selector
│   ├── arabic.ts                 # Arabic number formatting, ordinals, and normalization
│   ├── counter.ts                # Dhikr database, hadith virtues, reducer & persistence sanitize
│   ├── storage.ts                # Local storage interface via AsyncStorage
│   ├── theme.ts                  # Semantic tokens for all three visual identities
│   └── ThemeProvider.tsx         # Runtime theme selection and local preference restore
├── App.tsx                       # Main application screen and dock orchestration
├── app.json                      # Expo application manifest & permission lockdown
├── index.ts                      # Application root entry point
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript compiler options
```

---

## 🔒 Privacy & Ethics Manifesto

- **Sadaqah Jariyah (Ongoing Charity)**: This project is strictly non-profit and open-source. It will never feature advertisements, subscriptions, or paywalls.
- **Zero Permission Footprint**: Zekr declares and enforces zero access permissions. It does not ask for location, contacts, microphone, camera, or internet access.
- **Your Data Remains Yours**: Your praises and counts are stored locally on your device. Nothing leaves your phone.

---

## 🤝 Contributing

Contributions to improve performance, add authentic adhkar, or refine accessibility are welcome!

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Ensure type safety: `npx tsc --noEmit` and `npx expo-doctor`.
4. Commit your changes (`git commit -m 'feat: Add new authentic dhikr'`).
5. Push to your branch and open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

<div align="center">
  <sub>Crafted with devotion to be a peaceful companion for the remembrance of Allah 🌿</sub>
</div>
