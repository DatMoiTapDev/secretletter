import React, { useEffect, useRef } from 'react';

/**
 * Particle Canvas Engine: Hệ thống hiệu ứng hạt Canvas tối ưu hiệu năng 60fps
 * Hỗ trợ 8 loại hạt phù hợp hoàn hảo với từng chủ đề
 */
export default function ParticleCanvas({ particleType = 'snow', active = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || particleType === 'minimal') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Danh sách các hạt
    let particles = [];
    const isMobile = width < 768;
    const count = isMobile ? 35 : 70; // Giảm số lượng trên mobile để tiết kiệm pin

    function initParticles() {
      particles = [];

      for (let i = 0; i < count; i++) {
        if (particleType === 'snow') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 3 + 1,
            density: Math.random() * 20,
            speedY: Math.random() * 1.5 + 0.6,
            speedX: Math.random() * 0.8 - 0.4,
            opacity: Math.random() * 0.7 + 0.3
          });
        } else if (particleType === 'petals') {
          // Hoa Mai & Hoa Đào Tết
          const isYellow = Math.random() > 0.45;
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 8 + 6,
            color: isYellow ? '#F7D046' : '#FF9BB2',
            secondaryColor: isYellow ? '#E89814' : '#FF6584',
            speedY: Math.random() * 1.8 + 0.8,
            speedX: Math.random() * 1.2 - 0.6,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2,
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
            w: Math.random() * 7 + 4,
            h: Math.random() * 10 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 2.2 + 1,
            speedX: Math.random() * 1.5 - 0.75,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 6
          });
        } else if (particleType === 'stars') {
          // Bầu trời đêm tĩnh lặng & Sao rơi
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.8 + 0.5,
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
            size: Math.random() * 10 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: -(Math.random() * 1.2 + 0.5), // Bay lên
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
            size: Math.random() * 10 + 14,
            speedY: Math.random() * 1.2 + 0.4,
            speedX: Math.random() * 0.8 - 0.4,
            opacity: Math.random() * 0.7 + 0.3
          });
        } else if (particleType === 'gold_dust') {
          // Bụi vàng champagne sang trọng
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 0.5,
            speedY: -(Math.random() * 0.6 + 0.2),
            speedX: Math.random() * 0.4 - 0.2,
            alpha: Math.random() * 0.8 + 0.2,
            pulseSpeed: Math.random() * 0.03 + 0.01
          });
        }
      }
    }

    initParticles();

    // Vòng lặp render canvas
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
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

          // Vẽ cánh hoa mai/đào
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

          // Chớp tắt tại chỗ
        } else if (particleType === 'hearts') {
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.8;
          p.y += p.speedY;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          // Vẽ hình trái tim bằng đường cong bezier
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
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#D4AF37';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [particleType, active]);

  if (!active || particleType === 'minimal') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
}
