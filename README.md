<div align="center">

  <img src="./assets/icon.png" alt="Zekr Logo" width="120" height="120" style="border-radius: 28px;" />

  # ذِكر — Zekr

  ### مسبحة إلكترونية هادئة ورفيق للذكر والسكينة
  **A Serene, Privacy-First Islamic Tasbeeh & Dhikr Mobile Companion**

  <p align="center">
    <a href="#-key-features">المميزات</a> •
    <a href="#-tech-stack">التقنيات</a> •
    <a href="#-getting-started">التشغيل والتثبيت</a> •
    <a href="#-architecture">الهيكلية</a> •
    <a href="#-privacy--ethics">الخصوصية</a>
  </p>

  [![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
  [![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-DFBA6B?style=for-the-badge)](./LICENSE)
  [![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline-2F855A?style=for-the-badge)](#-privacy--ethics)

</div>

---

## 📖 About Zekr | عن التطبيق

**ذِكر (Zekr)** هو تطبيق إسلامي مفتوح المصدر مصمم بعناية فائقة ليكون رفيقك اليومي في الذكر والتسبيح. يجمع التطبيق بين **جماليات الفن الإسلامي والهندسة المقدسة**، وتجربة المستخدم الحديثة ذات الملمس الفيزيائي التفاعلي، مع الالتزام التام بالخصوصية وعدم الاتصال بالإنترنت.

> *«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»* — سورة الرعد (٢٨)

---

## ✨ Key Features | أبرز المزايا

### 📿 حلقة تسبيح تفاعلية مع ٣٣ حبة ضوئية
- **33 Luminous Prayer Beads**: حلقة دائرية مستوحاة من المسبحة الحقيقية؛ تُضيء الحبات تباعًا بلون الذهب الملكي مع كل تسبيحة.
- **Micro-Animations & Tactile Physics**: ارتداد فيزيائي نابض عند كل ضغطة (`Animated.spring`) مع موجة ضوئية متلاشية وقفزة في العداد.
- **احتفال بإتمام الورد**: نبض ضوئي هادئ وتنبيه اهتزازي لطيف عند بلوغ الهدف المطلوب مع إمكانية بدء الدورة التالية مباشرة.

### 🌟 خلفية هندسية إسلامية (خاتم سليمان الزخرفي)
- نجمة إسلامية ثمانية الأضلاع (*Islamic 8-Point Star*) مصممة بمتجهات SVG مع إشعاع هادئ باللون الزمردي والذهبي، تمنح التطبيق هيبة وسكينة وروحانية.

### 📚 مكتبة أذكار مأثورة بالتشكيل الكامل
- نصوص قرآنية ونبوية مشكولة بالكامل بدقة متناهية.
- مقسمة إلى تصنيفات: *(تسابيح، أذكار جامعة، استغفار، صلاة على النبي)*.
- توثيق فضل كل ذكر وأجره المأثور من الأحاديث الصحيحة مع الهدف المقترح.

### 🔁 نظام الختمات والدورات وإحصائيات التسبيح
- تتبع رقم الدورة الحالية (*الدورة الأولى، الثانية، الثالثة...*).
- عدّاد إجمالي تراكمي يحفظ كل تسبيحة قمت بها على الجهاز.
- تنسيق الأرقام بالمنازل والفاصلة العربية الأصيلة (*١،٢٥٠*).

### 📱 وضع النقر في كامل الشاشة (Free Tap Mode)
- إمكانية تفعيل وضع النقر الحر للمس أي مكان على الشاشة لزيادة العدّ دون الحاجة للنظر إلى الهاتف، مثالي للمشي والخلوات.

### 📳 اهتزاز لمسي مخصص (Haptics Feedback)
- استجابة حسية متقنة عبر محرك الاهتزاز (`expo-haptics`) تميز بين النقرة العادية ولحظة إتمام الهدف.

### 🔒 خصوصية تامة وبدون إنترنت بنسبة ١٠٠٪
- خالي تمامًا من أي إعلانات أو تتبع أو تحليلات.
- لا يتطلب أي صلاحيات إنترنت أو وسائط.
- يُحفظ تقدمك محليًا بالكامل داخل جهازك عبر `AsyncStorage`.

---

## 🛠️ Tech Stack | التقنيات المستخدمة

| التقنية / المكتبة | الإصدار | الاستخدام |
| :--- | :--- | :--- |
| **Expo SDK** | `~57.0` | إطار عمل التطوير المحمول السريع والآمن |
| **React Native** | `0.86.3` | بناء الواجهات المحمولة الأصلية |
| **React** | `19.2.3` | المحرك الأساسي لإدارة المكونات |
| **TypeScript** | `~6.0` | كتابة كود صارم وموثوق بدون أخطاء نوعية |
| **React Native SVG** | `15.15.4` | رسم الزخارف الهندسية وحلقات التسبيح والأيقونات |
| **Expo Linear Gradient** | `~57.0` | تدريجات الألوان الزمردية الملكية |
| **Expo Haptics** | `~57.0` | ردود الفعل اللمسية والاهتزازات الدقيقة |
| **AsyncStorage** | `2.2.0` | التخزين المحلي الآمن لبيانات العداد والأذكار |

---

## 🚀 Getting Started | التثبيت والتشغيل محليًا

### المتطلبات الأساسية
- تثبيت **Node.js** (إصدار 18 أو أحدث)
- تطبيق **Expo Go** على هاتفك المحمول ([iOS App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent))، أو محاكي Simulator/Emulator.

### خطوات التشغيل

1. **استنساخ المستودع (Clone the Repository):**
   ```bash
   git clone https://github.com/amu3dev/Zekr.git
   cd Zekr
   ```

2. **تثبيت الحزم والاعتماديات (Install Dependencies):**
   ```bash
   npm install
   ```

3. **تشغيل خادم التطوير (Start Dev Server):**
   ```bash
   npx expo start
   ```

4. **المعاينة على جهازك:**
   - امسح رمز الـ **QR Code** الظاهر في الطرفية عبر كاميرا الهاتف أو تطبيق Expo Go.
   - أو اضغط على حرف `i` لتشغيل محاكي iOS، أو حرف `a` لتشغيل محاكي Android.

### الفحص والتحقق من الجودة
```bash
# التحقق من خلو الأنواع من الأخطاء
npx tsc --noEmit

# تشخيص سلامة بيئة إكسبو والاعتماديات
npx expo-doctor
```

---

## 📂 Project Architecture | هيكلية المشروع

```
Zekr/
├── assets/                       # أيقونات التطبيق وصور البداية (Splash & Icons)
├── src/
│   ├── components/
│   │   ├── CounterRing.tsx       # حلقة التسبيح التفاعلية وحبات المسبحة والأنيميشن
│   │   ├── IslamicGeometry.tsx   # الزخرفة الهندسية الإسلامية وشعاع النور
│   │   ├── Icons.tsx             # منظومة الأيقونات المتجهية SVG
│   │   └── Modals.tsx            # مكتبة الأذكار، تحديد الهدف، والإعدادات
│   ├── arabic.ts                 # معالجة الأرقام العربية والترتيب اللفظي للدورات
│   ├── counter.ts                # منطق العداد، مكتبة الأذكار، وإدارة الحالة (Reducer)
│   ├── storage.ts                # حفظ واسترجاع الحالة محليًا عبر AsyncStorage
│   └── theme.ts                  # منظومة الألوان والرموز الزجاجية والزمردية
├── App.tsx                       # الشاشة الرئيسية وتكامل الواجهة والتحكم
├── app.json                      # إعدادات تطبيق إكسبو والصلاحيات
├── index.ts                      # نقطة الدخول الرئيسية للتطبيق
├── package.json                  # الاعتماديات وأوامر التشغيل
└── tsconfig.json                 # ضبط مترجم TypeScript
```

---

## 🔒 Privacy & Ethics Manifesto | الخصوصية والميثاق الأخلاقي

- **صدقة جارية (Sadaqah Jariyah)**: هذا المشروع غير ربحي ومفتوح المصدر وخالٍ للأبد من أي إعلانات تجارية مزعجة تشتت روحانية الذكر.
- **انعدام الصلاحيات الحساسة (Zero Permission Footprint)**: لا يطلب التطبيق ولا يحتاج أي صلاحيات للوصول إلى الموقع، الكاميرا، الميكروفون، أو جهات الاتصال.
- **بياناتك لك وحدك**: لا توجد خوادم خارجية، ولا يتم إرسال أي معلومة أو إحصائية خارج جهازك مطلقًا.

---

## 🤝 Contributing | المساهمة في المشروع

نرحب بمساهمات المطورين لتحسين الأداء أو إضافة أذكار مأثورة وصحيحة:

1. قم بعمل **Fork** للمستودع.
2. أنشئ فرعًا جديدًا لميزتك (`git checkout -b feature/amazing-feature`).
3. تأكد من اجتياز الفحص البرمجي: `npx tsc --noEmit`.
4. ارفع التغييرات (`git commit -m 'feat: Add new dhikr collection'`).
5. ادفع الفرع وافتح طلب سحب (**Pull Request**).

---

## 📄 License | الترخيص

هذا المشروع مرخص تحت رخصة **MIT License** — طالع ملف [LICENSE](./LICENSE) للتفاصيل.

<div align="center">
  <sub>صُنع بإحسان ليكون عونًا على ذكر الله في كل وقت وحين 🌿</sub>
</div>
