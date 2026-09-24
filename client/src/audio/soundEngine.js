/**
 * Sound Engine: Trình phát nhạc nền MP3 chất lượng cao & Hiệu ứng âm thanh tương tác
 * - Tự động phát nhạc MP3 tương ứng khi chọn 4 chủ đề:
 *   1. Tết -> tết bình an (tet_binh_an.mp3)
 *   2. Sinh nhật -> happy birthday to you (happy_birthday.mp3)
 *   3. Yêu -> từ khi gặp em (tu_khi_gap_em.mp3)
 *   4. Tâm tình -> hết duyên thì đi (het_duyen_thi_di.mp3)
 * - Tích hợp điều khiển âm lượng, chuyển đổi Mute, và Fade-in mượt mà
 */

const RAW_BASE = import.meta.env.BASE_URL || '/';
const AUDIO_BASE = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;

export const TRACK_URLS = {
  tet_binh_an: `${AUDIO_BASE}audio/tet_binh_an.mp3`,
  happy_birthday: `${AUDIO_BASE}audio/happy_birthday.mp3`,
  tu_khi_gap_em: `${AUDIO_BASE}audio/tu_khi_gap_em.mp3`,
  het_duyen_thi_di: `${AUDIO_BASE}audio/het_duyen_thi_di.mp3`
};

export const PRESET_TRACKS = [
  { id: 'tet_binh_an', name: 'Tết Bình An', mood: 'Rộn ràng, ấm áp, sum vầy đầu năm' },
  { id: 'happy_birthday', name: 'Happy Birthday To You', mood: 'Vui vẻ, hân hoan, rực rỡ tuổi mới' },
  { id: 'tu_khi_gap_em', name: 'Từ Khi Gặp Em', mood: 'Ngọt ngào, lãng mạn, rung động' },
  { id: 'het_duyen_thi_di', name: 'Hết Duyên Thì Đi', mood: 'Sâu lắng, da diết, hoài niệm' }
];

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.htmlAudio = null;
    this.isMuted = false;
    this.masterVolume = 0.4;
    this.isPlaying = false;
    this.currentTrack = null;
    this.fadeInterval = null;
  }

  // Khởi tạo AudioContext cho hiệu ứng tương tác (chạm nút, bóc seal)
  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Âm thanh mở khóa thư: Tiếng chuông ngân vang kỳ diệu (Unlock Sparkle Chime)
   */
  playUnlockSound() {
    try {
      this.initContext();
      if (!this.audioCtx || this.isMuted) return;

      const now = this.audioCtx.currentTime;
      // Hợp âm C maj9 rực rỡ: C5, E5, G5, B5, D6
      const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66];

      freqs.forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 1.25);
      });
    } catch (e) {
      console.warn('Không thể phát âm thanh mở khóa:', e);
    }
  }

  /**
   * Âm thanh bóc con dấu sáp / xé giấy mở phong bì
   */
  playWaxSealSound() {
    try {
      this.initContext();
      if (!this.audioCtx || this.isMuted) return;

      const now = this.audioCtx.currentTime;
      const bufferSize = this.audioCtx.sampleRate * 0.15;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3, now);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Lỗi âm thanh sáp niêm phong:', e);
    }
  }

  /**
   * Âm thanh chạm/bấm nút nhẹ nhàng
   */
  playClickSound() {
    try {
      this.initContext();
      if (!this.audioCtx || this.isMuted) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Bỏ qua lỗi
    }
  }

  /**
   * Bắt đầu phát nhạc nền MP3 thật tương ứng với hiệu ứng Fade-in
   */
  startBackgroundMusic(config = {}) {
    this.stopBackgroundMusic();

    let trackKey = 'tet_binh_an';
    let customUrl = '';
    let targetVol = this.masterVolume;

    if (typeof config === 'string') {
      trackKey = config;
    } else if (typeof config === 'object' && config !== null) {
      trackKey = config.track || trackKey;
      customUrl = config.customUrl || '';
      if (typeof config.defaultVolume === 'number') {
        targetVol = config.defaultVolume;
        this.masterVolume = targetVol;
      }
    }

    this.currentTrack = trackKey;

    // Chọn URL file MP3: nếu có link riêng dùng riêng, không thì dùng 4 bài mặc định
    let finalUrl = '';
    if (customUrl && customUrl.trim()) {
      finalUrl = customUrl;
    } else if (TRACK_URLS[trackKey]) {
      finalUrl = TRACK_URLS[trackKey];
    } else {
      finalUrl = TRACK_URLS.tet_binh_an;
    }

    this.playHtmlAudio(finalUrl);
  }

  /**
   * Phát file âm thanh HTML5 với Fade-In
   */
  playHtmlAudio(url) {
    try {
      this.htmlAudio = new Audio(url);
      this.htmlAudio.loop = true;
      this.htmlAudio.preload = 'auto';
      this.htmlAudio.volume = 0;
      this.isPlaying = true;

      const playPromise = this.htmlAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.fadeVolume(0, this.isMuted ? 0 : this.masterVolume, 1200);
          })
          .catch((err) => {
            console.warn('Tự động phát audio bị chặn bởi trình duyệt, sẽ phát khi có tương tác tiếp theo:', err);
          });
      }
    } catch (e) {
      console.error('Không thể phát file nhạc:', e);
    }
  }

  /**
   * Fade âm lượng theo thời gian (ms)
   */
  fadeVolume(from, to, duration = 1200) {
    if (!this.htmlAudio) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const steps = 24;
    const intervalTime = duration / steps;
    const delta = (to - from) / steps;
    let current = from;
    this.htmlAudio.volume = from;

    this.fadeInterval = setInterval(() => {
      current += delta;
      if ((delta > 0 && current >= to) || (delta < 0 && current <= to)) {
        if (this.htmlAudio) this.htmlAudio.volume = Math.max(0, Math.min(1, to));
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      } else {
        if (this.htmlAudio) this.htmlAudio.volume = Math.max(0, Math.min(1, current));
      }
    }, intervalTime);
  }

  /**
   * Tắt / Dừng nhạc nền
   */
  stopBackgroundMusic() {
    this.isPlaying = false;
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
      } catch (e) {
        // Bỏ qua
      }
      this.htmlAudio = null;
    }
  }

  /**
   * Chuyển đổi Bật / Tắt âm thanh (Mute / Unmute)
   */
  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.htmlAudio) {
      this.htmlAudio.muted = this.isMuted;
      if (!this.isMuted) {
        this.htmlAudio.volume = this.masterVolume;
      }
    }
    return this.isMuted;
  }

  /**
   * Chỉnh âm lượng lớn / nhỏ (0.0 -> 1.0)
   */
  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.htmlAudio && !this.isMuted) {
      this.htmlAudio.volume = this.masterVolume;
    }
  }
}

export const soundEngine = new SoundEngine();
