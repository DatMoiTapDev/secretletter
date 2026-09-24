/**
 * Cấu hình 4 Chủ Đề Cốt Lõi cho Digital Secret Letter
 * 1. Tết (Tết Bình An)
 * 2. Sinh nhật (Happy Birthday To You)
 * 3. Yêu (Từ Khi Gặp Em)
 * 4. Tâm tình (Hết Duyên Thì Đi)
 * Hỗ trợ đồng bộ 2 chế độ: Nền Sáng ☀️ & Nền Tối 🌙
 */

export const THEMES = {
  tet: {
    id: 'tet',
    name: 'Tết',
    emoji: '🧧',
    tagline: 'Sắc xuân sum vầy, mai đào đón lộc và bình an viên mãn',
    songName: 'Tết Bình An',
    defaultMusic: 'tet_binh_an',
    particleType: 'petals',
    previewColors: ['#fee2e2', '#fecaca', '#ef4444'],
    fontHeading: 'font-serif',

    // Cấu hình Nền Sáng ☀️
    light: {
      bgGradient: 'from-[#fff8f5] via-[#fef2f2] to-[#fee2e2]',
      readBgGradient: 'from-[#fffafa] via-[#fff1f2] to-[#ffe4e6]',
      paperClass: 'paper-parchment',
      paperText: 'text-neutral-900',
      accentText: 'text-red-700',
      envelope: {
        body: 'bg-gradient-to-b from-[#e11d48] to-[#be123c]',
        flap: 'bg-gradient-to-b from-[#f43f5e] to-[#e11d48]',
        inner: 'bg-[#ffe4e6]',
        border: 'border-amber-300/80',
        sealType: 'gold',
        sealSymbol: '福',
        nameColor: 'text-yellow-300'
      }
    },

    // Cấu hình Nền Tối 🌙
    dark: {
      bgGradient: 'from-[#220708] via-[#350a0d] to-[#180405]',
      readBgGradient: 'from-[#170405] via-[#240608] to-[#0f0203]',
      paperClass: 'paper-parchment',
      paperText: 'text-neutral-800',
      accentText: 'text-red-600',
      envelope: {
        body: 'bg-gradient-to-b from-[#9f1239] to-[#881337]',
        flap: 'bg-gradient-to-b from-[#be123c] to-[#9f1239]',
        inner: 'bg-[#4c0519]',
        border: 'border-yellow-400/50',
        sealType: 'gold',
        sealSymbol: '福',
        nameColor: 'text-yellow-300'
      }
    },

    // Thuộc tính mặc định cấp cao nhất chống lỗi truy cập
    envelope: {
      body: 'bg-gradient-to-b from-[#e11d48] to-[#be123c]',
      flap: 'bg-gradient-to-b from-[#f43f5e] to-[#e11d48]',
      inner: 'bg-[#ffe4e6]',
      border: 'border-amber-300/80',
      sealType: 'gold',
      sealSymbol: '福',
      nameColor: 'text-yellow-300'
    }
  },

  birthday: {
    id: 'birthday',
    name: 'Sinh nhật',
    emoji: '🎂',
    tagline: 'Nắng mai ấm áp, bánh kem ngọt ngào và những lời ước nhiệm màu',
    songName: 'Happy Birthday To You',
    defaultMusic: 'happy_birthday',
    particleType: 'confetti',
    previewColors: ['#fffbeb', '#fef3c7', '#f59e0b'],
    fontHeading: 'font-serif',

    // Cấu hình Nền Sáng ☀️
    light: {
      bgGradient: 'from-[#fffdf7] via-[#fef9ee] to-[#fef3c7]',
      readBgGradient: 'from-[#fffefb] via-[#fefbf2] to-[#fef6dc]',
      paperClass: 'paper-parchment',
      paperText: 'text-neutral-900',
      accentText: 'text-amber-800',
      envelope: {
        body: 'bg-gradient-to-b from-[#e0667c] to-[#c9435b]',
        flap: 'bg-gradient-to-b from-[#f27e94] to-[#e0667c]',
        inner: 'bg-[#ffebef]',
        border: 'border-rose-300/80',
        sealType: 'rose',
        sealSymbol: '🎂',
        nameColor: 'text-amber-900'
      }
    },

    // Cấu hình Nền Tối 🌙
    dark: {
      bgGradient: 'from-[#1a1205] via-[#291c06] to-[#120d03]',
      readBgGradient: 'from-[#120c03] via-[#1c1304] to-[#0a0701]',
      paperClass: 'paper-parchment',
      paperText: 'text-neutral-900',
      accentText: 'text-amber-700',
      envelope: {
        body: 'bg-gradient-to-b from-[#b45309] to-[#78350f]',
        flap: 'bg-gradient-to-b from-[#d97706] to-[#b45309]',
        inner: 'bg-[#451a03]',
        border: 'border-amber-400/40',
        sealType: 'gold',
        sealSymbol: '🎂',
        nameColor: 'text-amber-200'
      }
    },

    envelope: {
      body: 'bg-gradient-to-b from-[#e0667c] to-[#c9435b]',
      flap: 'bg-gradient-to-b from-[#f27e94] to-[#e0667c]',
      inner: 'bg-[#ffebef]',
      border: 'border-rose-300/80',
      sealType: 'rose',
      sealSymbol: '🎂',
      nameColor: 'text-amber-900'
    }
  },

  cute: {
    id: 'cute',
    name: 'Yêu',
    emoji: '💕',
    tagline: 'Mây hồng kẹo bông, pastel ngọt lịm và tình cảm trong trẻo',
    songName: 'Từ Khi Gặp Em',
    defaultMusic: 'tu_khi_gap_em',
    particleType: 'hearts',
    previewColors: ['#fdf2f8', '#fce7f3', '#ec4899'],
    fontHeading: 'font-serif',

    // Cấu hình Nền Sáng ☀️
    light: {
      bgGradient: 'from-[#fff5f8] via-[#fdf2f8] to-[#fce7f3]',
      readBgGradient: 'from-[#fff8fa] via-[#fdf5f9] to-[#fdf2f8]',
      paperClass: 'paper-parchment',
      paperText: 'text-neutral-900',
      accentText: 'text-pink-600',
      envelope: {
        body: 'bg-gradient-to-b from-[#f472b6] to-[#db2777]',
        flap: 'bg-gradient-to-b from-[#fb7185] to-[#f472b6]',
        inner: 'bg-[#ffe4e9]',
        border: 'border-pink-300/80',
        sealType: 'rose',
        sealSymbol: '💖',
        nameColor: 'text-pink-900'
      }
    },

    // Cấu hình Nền Tối 🌙
    dark: {
      bgGradient: 'from-[#1f0914] via-[#2d0d1e] to-[#14060d]',
      readBgGradient: 'from-[#14060d] via-[#1f0914] to-[#0c0308]',
      paperClass: 'paper-dark',
      paperText: 'text-pink-100',
      accentText: 'text-pink-400',
      envelope: {
        body: 'bg-gradient-to-b from-[#9d174d] to-[#831843]',
        flap: 'bg-gradient-to-b from-[#be185d] to-[#9d174d]',
        inner: 'bg-[#500724]',
        border: 'border-pink-400/40',
        sealType: 'rose',
        sealSymbol: '💖',
        nameColor: 'text-pink-200'
      }
    },

    envelope: {
      body: 'bg-gradient-to-b from-[#f472b6] to-[#db2777]',
      flap: 'bg-gradient-to-b from-[#fb7185] to-[#f472b6]',
      inner: 'bg-[#ffe4e9]',
      border: 'border-pink-300/80',
      sealType: 'rose',
      sealSymbol: '💖',
      nameColor: 'text-pink-900'
    }
  },

  emotional: {
    id: 'emotional',
    name: 'Tâm tình',
    emoji: '🌙',
    tagline: 'Bầu trời đêm tĩnh lặng, ngàn sao lấp lánh và nỗi niềm sâu lắng',
    songName: 'Hết Duyên Thì Đi',
    defaultMusic: 'het_duyen_thi_di',
    particleType: 'stars',
    previewColors: ['#f0f9ff', '#e0f2fe', '#0284c7'],
    fontHeading: 'font-serif',

    // Cấu hình Nền Sáng ☀️
    light: {
      bgGradient: 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
      readBgGradient: 'from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]',
      paperClass: 'paper-parchment',
      paperText: 'text-neutral-900',
      accentText: 'text-sky-700',
      envelope: {
        body: 'bg-gradient-to-b from-[#334155] to-[#1e293b]',
        flap: 'bg-gradient-to-b from-[#475569] to-[#334155]',
        inner: 'bg-[#e2e8f0]',
        border: 'border-slate-300/80',
        sealType: 'navy',
        sealSymbol: '🌙',
        nameColor: 'text-slate-100'
      }
    },

    // Cấu hình Nền Tối 🌙
    dark: {
      bgGradient: 'from-[#070b14] via-[#0e1628] to-[#05080f]',
      readBgGradient: 'from-[#04060b] via-[#090e1a] to-[#020306]',
      paperClass: 'paper-dark',
      paperText: 'text-slate-100',
      accentText: 'text-sky-400',
      envelope: {
        body: 'bg-gradient-to-b from-[#1B2A4A] to-[#0f1a30]',
        flap: 'bg-gradient-to-b from-[#243761] to-[#1B2A4A]',
        inner: 'bg-[#0a1120]',
        border: 'border-sky-300/40',
        sealType: 'navy',
        sealSymbol: '🌙',
        nameColor: 'text-sky-200'
      }
    },

    envelope: {
      body: 'bg-gradient-to-b from-[#334155] to-[#1e293b]',
      flap: 'bg-gradient-to-b from-[#475569] to-[#334155]',
      inner: 'bg-[#e2e8f0]',
      border: 'border-slate-300/80',
      sealType: 'navy',
      sealSymbol: '🌙',
      nameColor: 'text-slate-100'
    }
  }
};

export const THEME_LIST = Object.values(THEMES);

/**
 * Lấy theme kết hợp chế độ Nền Sáng (isDark = false) hoặc Nền Tối (isDark = true)
 */
export function getTheme(themeId, isDark = false) {
  const base = THEMES[themeId] || THEMES.tet;
  const modeConfig = isDark ? base.dark : base.light;

  return {
    ...base,
    isDark,
    bgGradient: modeConfig.bgGradient,
    readBgGradient: modeConfig.readBgGradient,
    paperClass: modeConfig.paperClass,
    paperText: modeConfig.paperText,
    accentText: modeConfig.accentText,
    envelope: modeConfig.envelope
  };
}
