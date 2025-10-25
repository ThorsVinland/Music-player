import { View, Text } from 'react-native'
import React from 'react'
import Home from './(tabs)/Home'

export default function index() {
  return <Home />
}
// project/
// │
// ├── app/
// │   ├── (tabs)/
// │   │   ├── Home.tsx          ← الصفحة الرئيسية
// │   │   ├── Player.tsx        ← شاشة تشغيل الأغنية
// │   │   └── Settings.tsx
// │
// ├── components/
// │   ├── music/
// │   │   ├── MusicList.tsx     ← مكوّن عرض قائمة الأغاني (الكود السابق)
// │   │   ├── MusicItem.tsx     ← عنصر واحد في القائمة (اختياري لاحقًا)
// │   │
// │   └── ui/
// │       └── StaticGradientBackground.tsx
// │
// ├── utils/
// │   └── audioUtils.ts         ← دوال مساعدة (تشغيل، إيقاف، تنسيق الوقت...)
// │
// └── assets/
//     └── icons/                ← أيقونات