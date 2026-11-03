import React, { useEffect, useRef, useState } from 'react';

/**
 * Particle Canvas Engine: Hệ thống hiệu ứng hạt Canvas tối ưu hiệu năng
 * - Tự động giới hạn FPS (35 FPS trên thiết bị di động, 60 FPS trên máy tính) tránh hao pin/GPU
 * - Lắng nghe visibilitychange: Tự động tạm dừng hoàn toàn vòng lặp render khi chuyển tab hoặc khóa màn hình
 * - Tôn trọng thiết lập trợ năng prefers-reduced-motion của người dùng
 * - Giảm số lượng hạt thông minh theo kích thước màn hình
 */
export default function ParticleCanvas({ particleType = 'snow', active = true }) {
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Lắng nghe thay đổi thiết lập prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    if (!active || particleType === 'minimal' || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Giới hạn FPS thích ứng: 35 FPS trên Mobile/Tablet để tiết kiệm pin, 60 FPS trên Desktop
    const isMobile = width < 768;
    const targetFps = isMobile ? 35 : 60;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = performance.now();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Danh sách các hạt
    let particles = [];
    const count = isMobile ? 28 : (width < 1024 ? 45 : 65);

    function initParticles() {
      particles = [];

      for (let i = 0; i < count; i++) {
        if (particleType === 'snow') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.8 + 1,
            density: Math.random() * 20,
            speedY: Math.random() * 1.4 + 0.6,
            speedX: Math.random() * 0.8 - 0.4,
            opacity: Math.random() * 0.7 + 0.3
          });
        } else if (particleType === 'petals') {
          // Hoa Mai & Hoa Đào Tết
          const isYellow = Math.random() > 0.45;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 7 + 5,
            color: isYellow ? '#F7D046' : '#FF9BB2',
            secondaryColor: isYellow ? '#E89814' : '#FF6584',
            speedY: Math.random() * 1.6 + 0.7,
            speedX: Math.random() * 1.2 - 0.6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 1.8,
            swing: Math.random() * 2,
            swingSpeed: Math.random() * 0.03 + 0.01,
            swingAngle: Math.random() * Math.PI * 2
          });
        } else if (particleType === 'confetti') {
          // Confetti Sinh Nhật
          const colors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            w: Math.random() * 6 + 4,
            h: Math.random() * 9 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 2.0 + 0.9,
            speedX: Math.random() * 1.4 - 0.7,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 5
          });
        } else if (particleType === 'stars') {
          // Bầu trời đêm tĩnh lặng & Sao rơi
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.6 + 0.5,
            alpha: Math.random(),
            pulseSpeed: Math.random() * 0.02 + 0.005,
            color: Math.random() > 0.3 ? '#ffffff' : '#bae6fd'
          });
        } else if (particleType === 'hearts') {
          // Trái tim tình cảm & Dễ thương
          const colors = ['#f472b6', '#fb7185', '#fda4af', '#f43f5e'];
          particles.push({
            x: Math.random() * width,
            y: height + Math.random() * 100,
            size: Math.random() * 9 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: -(Math.random() * 1.1 + 0.5),
            speedX: Math.random() * 0.8 - 0.4,
            opacity: Math.random() * 0.6 + 0.3,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.04 + 0.02
          });
        } else if (particleType === 'emojis') {
          // Emoji vui nhộn
          const emojiList = ['✨', '🎉', '💛', '🥳', '🎈', '⭐', '💫'];
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
            size: Math.random() * 8 + 12,
            speedY: Math.random() * 1.1 + 0.4,
            speedX: Math.random() * 0.8 - 0.4,
            opacity: Math.random() * 0.7 + 0.3
          });
        } else if (particleType === 'gold_dust') {
          // Bụi vàng champagne sang trọng
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.8 + 0.5,
            speedY: -(Math.random() * 0.6 + 0.2),
            speedX: Math.random() * 0.4 - 0.2,
            alpha: Math.random() * 0.8 + 0.2,
            pulseSpeed: Math.random() * 0.03 + 0.01
          });
        }
      }
    }

    initParticles();

    // Vòng lặp render canvas tối ưu FPS và delta time
    const render = (now) => {
      animationFrameId = requestAnimationFrame(render);

      // Bỏ qua frame nếu chưa đến chu kỳ interval mục tiêu
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (particleType === 'snow') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fill();

          p.y += p.speedY;
          p.x += Math.sin(p.y * 0.01) * 0.6;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        } else if (particleType === 'petals') {
          p.swingAngle += p.swingSpeed;
          p.x += Math.sin(p.swingAngle) * p.swing + p.speedX;
          p.y += p.speedY;
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);

          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
          const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, p.secondaryColor);
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.restore();

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else if (particleType === 'confetti') {
          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else if (particleType === 'stars') {
          p.alpha += p.pulseSpeed;
          const currentAlpha = Math.abs(Math.sin(p.alpha));

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha * 0.8 + 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (particleType === 'hearts') {
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.8;
          p.y += p.speedY;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          const s = p.size / 15;
          ctx.scale(s, s);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-7, -7, -14, 3, 0, 14);
          ctx.bezierCurveTo(14, 3, 7, -7, 0, 0);
          ctx.fill();
          ctx.restore();

          if (p.y < -30) {
            p.y = height + 30;
            p.x = Math.random() * width;
          }
        } else if (particleType === 'emojis') {
          p.y += p.speedY;
          p.x += p.speedX;

          ctx.font = `${p.size}px sans-serif`;
          ctx.globalAlpha = p.opacity;
          ctx.fillText(p.emoji, p.x, p.y);
          ctx.globalAlpha = 1;

          if (p.y > height + 30) {
            p.y = -30;
            p.x = Math.random() * width;
          }
        } else if (particleType === 'gold_dust') {
          p.y += p.speedY;
          p.x += p.speedX;
          p.alpha += p.pulseSpeed;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#C58D34';
          ctx.globalAlpha = Math.abs(Math.sin(p.alpha)) * 0.7 + 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
      }
    };

    // Tự động tạm dừng / khôi phục khi chuyển tab (Visibility Lifecycle)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        if (!animationFrameId) {
          lastFrameTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [particleType, active, reducedMotion]);

  if (!active || particleType === 'minimal' || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
}
