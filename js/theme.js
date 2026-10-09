/**
 * EDUTASK PRO — SEASONAL THEME MODULE (NÂNG CẤP GIAO DIỆN THEO 4 MÙA & LỄ HỘI)
 * Quản lý chủ đề theo mùa (Xuân - Hạ - Thu - Đông - Chuẩn Học Thuật),
 * Tự động đổi theo tháng trong năm và hiệu ứng hạt canvas thẩm mỹ nhẹ nhàng.
 */

const ThemeManager = {
  // Định nghĩa các chủ đề theo mùa
  themes: {
    auto: {
      id: 'auto',
      name: 'Tự Động Theo Lịch',
      icon: '🔄',
      tag: 'Khuyên Dùng',
      desc: 'Tự động kích hoạt giao diện theo mùa thực tế trong năm.',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #0284c7 35%, #ea580c 70%, #2563eb 100%)'
    },
    spring: {
      id: 'spring',
      name: 'Mùa Xuân & Tết',
      icon: '🌸',
      tag: 'Tháng 1 - 2',
      desc: 'Sắc đỏ thắm may mắn, hoa đào nở rộ & mai vàng đón Tết thịnh vượng.',
      gradient: 'linear-gradient(135deg, #b91c1c, #e11d48 60%, #eab308 100%)',
      accent: '#dc2626',
      particleType: 'petal'
    },
    summer: {
      id: 'summer',
      name: 'Mùa Hè & Thi Cử',
      icon: '☀️',
      tag: 'Tháng 3 - 7',
      desc: 'Xanh biển tươi mát, năng lượng bứt phá 9+ rực lửa mùa thi cử.',
      gradient: 'linear-gradient(135deg, #0369a1, #0284c7 60%, #38bdf8 100%)',
      accent: '#0284c7',
      particleType: 'sunbeam'
    },
    autumn: {
      id: 'autumn',
      name: 'Mùa Thu Tựu Trường',
      icon: '🍂',
      tag: 'Tháng 8 - 10',
      desc: 'Sắc cam đất & lá phong vàng nồng ấm, hân hoan tựu trường khai giảng.',
      gradient: 'linear-gradient(135deg, #7c2d12, #c2410c 60%, #d97706 100%)',
      accent: '#c2410c',
      particleType: 'leaf'
    },
    winter: {
      id: 'winter',
      name: 'Mùa Đông & Giáng Sinh',
      icon: '❄️',
      tag: 'Tháng 11 - 12',
      desc: 'Sắc lam băng tuyết trong suốt, cây thông ấm áp & đón chào năm mới.',
      gradient: 'linear-gradient(135deg, #0f172a, #1e3a8a 60%, #2563eb 100%)',
      accent: '#2563eb',
      particleType: 'snow'
    },
    standard: {
      id: 'standard',
      name: 'Chuẩn Học Thuật Pro',
      icon: '🎓',
      tag: 'Cổ Điển',
      desc: 'Sắc xanh Oxford Navy hoàng gia cổ điển & thanh lịch của EDUTASK PB.',
      gradient: 'linear-gradient(135deg, #0f2b5c, #1e40af 60%, #0284c7 100%)',
      accent: '#1e40af',
      particleType: 'none'
    }
  },

  // Trạng thái hiện tại
  currentSetting: 'auto',      // 'auto' hoặc 'spring' | 'summer' | 'autumn' | 'winter' | 'standard'
  activeSeason: 'autumn',       // Mùa đang được áp dụng thực tế
  particlesEnabled: true,

  // Canvas particle engine
  particles: [],
  animFrameId: null,
  canvas: null,
  ctx: null,

  init() {
    this.currentSetting = localStorage.getItem('edutask_season_theme') || 'auto';
    const savedParticles = localStorage.getItem('edutask_season_particles');
    this.particlesEnabled = savedParticles === null ? true : savedParticles === 'true';

    this.applyTheme(this.currentSetting, false);
    this.initCanvas();
    this.renderHeaderButton();

    // Lắng nghe sự kiện tab ẩn/hiện để tạm dừng vẽ hạt tiết kiệm CPU/pin
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopParticles();
      } else if (this.particlesEnabled && this.activeSeason !== 'standard') {
        this.startParticles();
      }
    });

    console.log(`🎨 [ThemeManager] Đã kích hoạt chủ đề theo mùa: ${this.activeSeason} (Cài đặt: ${this.currentSetting})`);
  },

  // Tính mùa tự động theo tháng
  detectSeasonByMonth() {
    const month = new Date().getMonth() + 1; // 1-12
    if (month === 1 || month === 2) return 'spring';
    if (month >= 3 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  },

  setTheme(settingKey, showNotification = true) {
    return this.applyTheme(settingKey, showNotification);
  },

  // Áp dụng chủ đề
  applyTheme(settingKey, showNotification = true) {
    this.currentSetting = settingKey;
    localStorage.setItem('edutask_season_theme', settingKey);

    let effectiveSeason = settingKey;
    if (settingKey === 'auto') {
      effectiveSeason = this.detectSeasonByMonth();
    }
    this.activeSeason = effectiveSeason;

    // Xóa toàn bộ class mùa cũ trên documentElement & body
    const seasonClasses = ['theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter', 'theme-standard'];
    seasonClasses.forEach(cls => {
      document.documentElement.classList.remove(cls);
      document.body?.classList.remove(cls);
    });

    // Thêm class mùa mới
    if (effectiveSeason !== 'standard') {
      const newClass = 'theme-' + effectiveSeason;
      document.documentElement.classList.add(newClass);
      document.body?.classList.add(newClass);
    }

    this.renderHeaderButton();
    this.resetParticlesForSeason(effectiveSeason);

    if (showNotification) {
      const themeInfo = this.themes[settingKey] || this.themes[effectiveSeason];
      const autoNote = settingKey === 'auto' ? ` (Tự động theo Tháng ${new Date().getMonth() + 1})` : '';
      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`${themeInfo.icon} Đã áp dụng giao diện: ${themeInfo.name}${autoNote}!`, 'success');
      }
    }
  },

  // Cập nhật nút chọn chủ đề trên Header
  renderHeaderButton() {
    const btnIcon = document.getElementById('seasonThemeIcon');
    const btnLabel = document.getElementById('seasonThemeLabel');
    if (!btnIcon || !btnLabel) return;

    const currentSeasonInfo = this.themes[this.activeSeason] || this.themes.standard;
    btnIcon.textContent = currentSeasonInfo.icon;
    btnLabel.textContent = this.currentSetting === 'auto' ? `${currentSeasonInfo.name}` : currentSeasonInfo.name;
  },

  // Bật/tắt hiệu ứng hạt
  toggleParticles(enable) {
    this.particlesEnabled = enable;
    localStorage.setItem('edutask_season_particles', enable ? 'true' : 'false');
    if (enable) {
      this.resetParticlesForSeason(this.activeSeason);
    } else {
      this.stopParticles();
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    this.renderModalContent();
  },

  // ================= CANVAS PARTICLE ENGINE (SIÊU NHẸ 18 HẠT) =================

  initCanvas() {
    this.canvas = document.getElementById('seasonParticlesCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const resize = () => {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (this.particlesEnabled && this.activeSeason !== 'standard') {
      this.resetParticlesForSeason(this.activeSeason);
    }
  },

  resetParticlesForSeason(seasonKey) {
    if (!this.canvas || !this.ctx) return;
    this.particles = [];
    this.stopParticles();

    if (!this.particlesEnabled || seasonKey === 'standard') {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const type = this.themes[seasonKey]?.particleType || 'none';
    if (type === 'none') {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    // Khởi tạo 18 hạt với vị trí ngẫu nhiên
    const count = 18;
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(type, w, h, true));
    }

    this.startParticles();
  },

  createParticle(type, w, h, initial = false) {
    return {
      type: type,
      x: Math.random() * w,
      y: initial ? Math.random() * h : -20,
      size: type === 'leaf' ? (10 + Math.random() * 8) : (type === 'petal' ? (8 + Math.random() * 7) : (type === 'snow' ? (3 + Math.random() * 4) : (4 + Math.random() * 5))),
      speedY: 0.6 + Math.random() * 1.0,
      speedX: (Math.random() - 0.4) * 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: 0.02 + Math.random() * 0.02,
      opacity: 0.4 + Math.random() * 0.45
    };
  },

  startParticles() {
    if (this.animFrameId) return;
    const loop = () => {
      this.updateAndDrawParticles();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  },

  stopParticles() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  },

  updateAndDrawParticles() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.particles.forEach(p => {
      p.y += p.speedY;
      p.swing += p.swingSpeed;
      p.x += p.speedX + Math.sin(p.swing) * 0.5;
      p.rotation += p.rotationSpeed;

      // Vẽ theo từng loại hạt theo mùa
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      if (p.type === 'petal') {
        // Cánh hoa đào hồng phớt (Xuân)
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'leaf') {
        // Lá phong vàng cam ấm (Thu)
        ctx.fillStyle = p.opacity > 0.6 ? '#ea580c' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'snow') {
        // Bông tuyết tinh khôi (Đông)
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sunbeam') {
        // Đốm nắng vàng nhẹ (Hạ)
        const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        rad.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
        rad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Tái tạo lại khi rơi ra khỏi mép màn hình
      if (p.y > h + 20 || p.x < -30 || p.x > w + 30) {
        Object.assign(p, this.createParticle(p.type, w, h, false));
      }
    });
  },

  // ================= MODAL CHỌN GIAO DIỆN THEO MÙA =================

  openModal() {
    const modal = document.getElementById('seasonThemeModal');
    if (!modal) return;
    this.renderModalContent();
    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('seasonThemeModal');
    if (modal) modal.classList.remove('active');
  },

  renderModalContent() {
    const container = document.getElementById('seasonThemeModalBody');
    if (!container) return;

    const currentMonth = new Date().getMonth() + 1;
    const detectedSeason = this.detectSeasonByMonth();
    const isAuto = this.currentSetting === 'auto';

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 30px;">🗓️</span>
          <div>
            <strong style="font-size: 14.5px; display: block;">Hôm nay là Tháng ${currentMonth} / ${new Date().getFullYear()}</strong>
            <small style="color: #94a3b8; font-size: 12px;">Mùa thực tế hiện tại: <strong style="color: #38bdf8;">${this.themes[detectedSeason].name}</strong></small>
          </div>
        </div>
        <div>
          <button class="btn btn-xs ${isAuto ? 'btn-primary' : 'btn-white'}" onclick="ThemeManager.applyTheme('auto'); ThemeManager.renderModalContent();" style="padding: 6px 12px; font-weight: 700;">
            🔄 ${isAuto ? '✓ Đang Tự Động Theo Lịch' : 'Bật Tự Động Theo Lịch'}
          </button>
        </div>
      </div>

      <!-- Lưới danh sách 5 chủ đề mùa -->
      <div class="season-theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 14px;">
        ${['spring', 'summer', 'autumn', 'winter', 'standard'].map(key => {
          const t = this.themes[key];
          const isSelected = (!isAuto && this.currentSetting === key) || (isAuto && this.activeSeason === key);
          const isCurrentActive = this.activeSeason === key;

          return `
            <div class="season-card ${isSelected ? 'selected' : ''}" onclick="ThemeManager.applyTheme('${key}'); ThemeManager.renderModalContent();" style="border: 2px solid ${isSelected ? 'var(--primary)' : '#e2e8f0'}; border-radius: 14px; padding: 14px; background: #ffffff; cursor: pointer; transition: all 0.2s ease; position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: ${isSelected ? '0 4px 16px var(--primary-glow)' : 'var(--shadow-sm)'};">
              
              <!-- Gradient preview bar -->
              <div style="height: 6px; width: 100%; border-radius: 6px; background: ${t.gradient};"></div>

              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 24px;">${t.icon}</span>
                  <span class="badge ${isSelected ? 'badge-primary' : 'badge-secondary'}" style="font-size: 11px;">
                    ${t.tag}
                  </span>
                </div>
                <strong style="font-size: 14px; color: #1e293b; display: block;">${t.name}</strong>
                <p style="font-size: 11.5px; color: #64748b; margin: 4px 0 0 0; line-height: 1.4;">${t.desc}</p>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                <span style="font-size: 11.5px; font-weight: 700; color: ${isCurrentActive ? 'var(--primary)' : '#94a3b8'};">
                  ${isCurrentActive ? '● Đang hiển thị' : 'Chọn giao diện'}
                </span>
                ${isSelected ? '<span style="color: var(--primary); font-weight: 900; font-size: 15px;">✓</span>' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Tùy chọn hiệu ứng hạt chuyển động -->
      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">✨</span>
          <div>
            <strong style="font-size: 13px; color: #1e293b;">Hiệu ứng hạt rơi nhẹ nhàng</strong>
            <div style="font-size: 11.5px; color: #64748b;">Cánh hoa đào (Xuân), ánh nắng (Hạ), lá phong (Thu), tuyết rơi (Đông)</div>
          </div>
        </div>
        <label class="switch-toggle" style="display: inline-flex; align-items: center; cursor: pointer; user-select: none;">
          <input type="checkbox" ${this.particlesEnabled ? 'checked' : ''} onchange="ThemeManager.toggleParticles(this.checked)" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;">
          <span style="font-size: 12.5px; font-weight: 700; margin-left: 6px; color: ${this.particlesEnabled ? 'var(--primary)' : '#94a3b8'};">
            ${this.particlesEnabled ? 'BẬT' : 'TẮT'}
          </span>
        </label>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
}
