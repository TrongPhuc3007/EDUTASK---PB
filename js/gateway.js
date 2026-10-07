/**
 * EDUTASK PRO — AUTHENTICATION & LOGIN GATEWAY
 * Giao diện đăng nhập chính thức cho hệ thống giáo dục
 * Phân tách 3 không gian độc lập: Quản Trị Viên, Gia Sư, Học Sinh
 */

const GatewayView = {
  currentRole: 'admin',

  roleInfoMap: {
    admin: {
      id: 'admin',
      title: 'Cổng Quản Trị Viên',
      icon: '👑',
      badge: 'QUẢN TRỊ HỆ THỐNG',
      className: 'role-admin',
      description: 'Quản trị danh sách học sinh, phân công giảng dạy, theo dõi học phí và giám sát hệ thống.',
      placeholder: 'Tài khoản quản trị viên'
    },
    tutor: {
      id: 'tutor',
      title: 'Cổng Gia Sư Trực Tiếp',
      icon: '👨‍🏫',
      badge: 'CHUYÊN MÔN GIẢNG DẠY',
      className: 'role-tutor',
      description: 'Không gian giảng dạy: quản lý học sinh theo học, giao bài 1-1, chấm bài Canvas bút đỏ và gửi báo cáo Zalo.',
      placeholder: 'Tài khoản gia sư'
    },
    student: {
      id: 'student',
      title: 'Cổng Học Sinh Chính Thức',
      icon: '🎒',
      badge: 'BÀN HỌC CÁ NHÂN',
      className: 'role-student',
      description: 'Bàn học cá nhân: nhận bài tập riêng, nộp ảnh bài làm viết tay và xem kết quả chấm bài của gia sư.',
      placeholder: 'Tài khoản học sinh'
    }
  },

  render(container) {
    if (!container) return;

    const existingUsername = document.getElementById('loginUsername')?.value || '';
    const currentRoleInfo = this.roleInfoMap[this.currentRole];
    const studentList = (window.Store && typeof Store.getStudents === 'function') ? Store.getStudents() : [];
    const tutorList = (window.Store && typeof Store.getTutors === 'function') ? Store.getTutors() : [];

    container.innerHTML = `
      <div class="login-page-wrapper">
        
        <!-- Brand Header Tri Thức -->
        <div class="login-hero-header">
          <div class="login-system-pill">
            <span class="pill-seal-emblem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </span>
            <span class="pill-title-main">EDUTASK - PB</span>
            <span class="pill-divider">✦</span>
            <span class="pill-subtitle-text">HỆ THỐNG DẠY KÈM TRI THỨC</span>
          </div>
          <h2 class="login-hero-title">Cổng Đăng Nhập Tri Thức</h2>
          <p class="login-hero-subtitle">
            <span class="sub-phrase">Không gian học tập & quản trị kèm 1–1 tinh hoa</span>
            <span class="sub-bullet">•</span>
            <span class="sub-phrase">Kèm cặp tận tâm, <span class="no-orphan">bứt phá năng lực</span></span>
          </p>
          <div class="scholarly-quote-badge">
            <span class="quote-quill">📜</span>
            <span class="quote-text">« Tri thức khai sáng tương lai — Rèn luyện chuyên sâu, bứt phá tư duy »</span>
          </div>
        </div>

        <!-- Card Đăng Nhập -->
        <div class="login-main-card" id="loginCard">
          <div class="login-card-top-accent"></div>
          
          <div class="login-card-body">
            
            <!-- 3 Tabs Chọn Cổng Truy Cập -->
            <div>
              <div class="login-role-tabs">
                <button type="button" class="login-role-tab-btn ${this.currentRole === 'admin' ? 'active' : ''}" data-role="admin" onclick="GatewayView.switchRole('admin')">
                  <span>👑</span> <span>Quản Trị</span>
                </button>
                <button type="button" class="login-role-tab-btn ${this.currentRole === 'tutor' ? 'active' : ''}" data-role="tutor" onclick="GatewayView.switchRole('tutor')">
                  <span>👨‍🏫</span> <span>Gia Sư</span>
                </button>
                <button type="button" class="login-role-tab-btn ${this.currentRole === 'student' ? 'active' : ''}" data-role="student" onclick="GatewayView.switchRole('student')">
                  <span>🎒</span> <span>Học Sinh</span>
                </button>
              </div>
            </div>

            <!-- Banner Hướng Dẫn Vai Trò -->
            <div class="role-context-banner ${currentRoleInfo.className}" id="roleContextBanner">
              <div style="font-size: 20px; line-height: 1;">${currentRoleInfo.icon}</div>
              <div style="flex:1;">
                <div style="font-weight: 800; font-size: 13.5px; margin-bottom: 2px;">
                  ${currentRoleInfo.title}
                </div>
                <div style="font-size: 12.5px; opacity: 0.9;" id="roleDescriptionText">
                  ${currentRoleInfo.description}
                </div>
              </div>
            </div>

            <!-- Khối Nổi Bật: Đăng Ký Tài Khoản Nhanh Cho Học Sinh / Gia Sư Mới -->
            <div id="roleRegisterCtaBox" style="${this.currentRole === 'student' ? 'display:flex;' : (this.currentRole === 'tutor' ? 'display:flex;' : 'display:none;')} align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-radius:12px; ${this.currentRole === 'student' ? 'background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border:1.5px solid #10b981; box-shadow:0 4px 12px rgba(16,185,129,0.12);' : 'background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border:1.5px solid #3b82f6;'}; margin-top:-8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">${this.currentRole === 'student' ? '🎒' : '👨‍🏫'}</span>
                <div>
                  <div style="font-weight:800; font-size:13.5px; color:${this.currentRole === 'student' ? '#065f46' : '#1e40af'};" id="roleRegisterCtaTitle">
                    ${this.currentRole === 'student' ? 'Em là Học Sinh Mới?' : 'Thầy/Cô là Gia Sư Mới?'}
                  </div>
                  <div style="font-size:12px; color:${this.currentRole === 'student' ? '#047857' : '#1d4ed8'};" id="roleRegisterCtaSub">
                    ${this.currentRole === 'student' ? 'Chưa có tài khoản làm bài tập 1 kèm 1?' : 'Đăng ký nhận lớp và giao bài 1 kèm 1?'}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                class="btn btn-primary btn-sm" 
                onclick="GatewayView.openRegisterModal('${this.currentRole === 'tutor' ? 'tutor' : 'student'}')"
                id="btnRoleRegisterCta"
                style="${this.currentRole === 'student' ? 'background:#059669; border-color:#059669;' : 'background:#2563eb; border-color:#2563eb;'} font-weight:700; font-size:12.5px; padding:7px 14px; border-radius:8px; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.15); cursor:pointer;"
              >
                ✨ Đăng Ký Ngay
              </button>
            </div>

            <!-- Inline Alert Thông Báo Lỗi -->
            <div class="login-alert-banner" id="loginAlert">
              <div style="font-size: 18px; line-height: 1;">⚠️</div>
              <div style="flex:1;" id="loginAlertMessage">
                Thông tin đăng nhập không chính xác.
              </div>
              <button type="button" onclick="GatewayView.dismissAlert()" style="background:none; border:none; color:inherit; font-size:16px; cursor:pointer; padding:0 4px;">&times;</button>
            </div>

            <!-- Form Đăng Nhập -->
            <form class="login-form" id="loginMainForm" onsubmit="GatewayView.handleLoginSubmit(event)">
              
              <!-- Tên Đăng Nhập -->
              <div class="login-form-group">
                <label class="login-form-label" for="loginUsername">
                  Tên Đăng Nhập / Tài Khoản <span style="color:var(--danger)">*</span>
                </label>
                <div class="login-input-wrapper">
                  <span class="login-input-icon">👤</span>
                  <input 
                    type="text" 
                    id="loginUsername" 
                    class="login-input-field" 
                    placeholder="${currentRoleInfo.placeholder}..." 
                    value="${existingUsername}" 
                    autocomplete="username"
                    required
                  >
                </div>
              </div>

              <!-- Mật Khẩu -->
              <div class="login-form-group">
                <label class="login-form-label" for="loginPassword">
                  Mật Khẩu <span style="color:var(--danger)">*</span>
                </label>
                <div class="login-input-wrapper">
                  <span class="login-input-icon">🔒</span>
                  <input 
                    type="password" 
                    id="loginPassword" 
                    class="login-input-field" 
                    placeholder="Nhập mật khẩu..." 
                    autocomplete="current-password"
                    required
                  >
                  <button 
                    type="button" 
                    class="login-pwd-toggle-btn" 
                    id="btnTogglePwd" 
                    onclick="GatewayView.togglePasswordVisibility()" 
                    title="Ẩn / Hiện mật khẩu"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <!-- Tùy chọn Ghi nhớ & Quên Mật Khẩu -->
              <div class="login-options-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <label style="display:flex; align-items:center; gap:7px; font-size:12.5px; color:#475569; cursor:pointer; user-select:none;">
                  <input type="checkbox" id="loginRememberMe" style="accent-color:var(--primary); width:15px; height:15px; cursor:pointer;">
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="javascript:void(0)" class="login-forgot-link" onclick="GatewayView.showForgotPasswordNotice()">
                  Quên mật khẩu?
                </a>
              </div>

              <!-- Nút Submit Đăng Nhập -->
              <button type="submit" class="login-submit-btn" id="btnLoginSubmit">
                <span>🔐</span> <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span> <span class="submit-arrow">→</span>
              </button>

              <!-- Khối Nút Tạo Tài Khoản Nổi Bật -->
              <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 11.5px; font-weight: 700; text-transform: uppercase;">
                  <span style="flex: 1; height: 1px; background: #e2e8f0;"></span>
                  <span id="gatewayOrDividerText">${this.currentRole === 'student' ? 'HOẶC DÀNH CHO HỌC SINH MỚI' : (this.currentRole === 'tutor' ? 'HOẶC DÀNH CHO GIA SƯ MỚI' : 'HOẶC TẠO TÀI KHOẢN MỚI')}</span>
                  <span style="flex: 1; height: 1px; background: #e2e8f0;"></span>
                </div>
                <button 
                  type="button" 
                  id="btnQuickRegisterFromGateway"
                  class="btn" 
                  onclick="GatewayView.openRegisterModal(GatewayView.currentRole === 'tutor' ? 'tutor' : 'student')"
                  style="width: 100%; padding: 12px 16px; border-radius: 12px; font-weight: 700; font-size: 14px; border: 1.5px solid ${this.currentRole === 'tutor' ? '#3b82f6' : '#10b981'}; color: ${this.currentRole === 'tutor' ? '#1e40af' : '#065f46'}; background: ${this.currentRole === 'tutor' ? '#eff6ff' : '#ecfdf5'}; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
                >
                  <span>✨</span> <span id="quickRegisterBtnText">${this.currentRole === 'tutor' ? 'Tạo Tài Khoản Gia Sư Mới' : 'Tạo Tài Khoản Học Sinh Mới'}</span> <span style="font-size:16px;">→</span>
                </button>
              </div>

            </form>

            <!-- Danh sách tài khoản Học sinh đã kết nối trên Cloud -->
            <div id="syncedAccountsBox" style="${this.currentRole === 'student' ? 'display:block;' : 'display:none;'} margin-top:14px; padding:10px 12px; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:12px; font-size:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:700; color:#1e293b; display:flex; align-items:center; gap:5px;">
                  <span>👥</span> <span>Tài khoản học sinh sẵn sàng (${studentList.length}):</span>
                </span>
                <span style="font-size:11px; color:#059669; font-weight:700;">⚡ Chạm để điền nhanh</span>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:95px; overflow-y:auto; padding:2px;">
                ${studentList.map(s => `
                  <button type="button" onclick="GatewayView.fillAccount('${s.username}', '${s.password || '123456'}')" style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:4px 9px; font-size:11.5px; cursor:pointer; color:#0f172a; font-weight:600; display:flex; align-items:center; gap:5px; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.15s ease;" title="Chạm để tự điền tài khoản em ${s.name}">
                    <span>🎒</span> <span>${s.name}</span> <span style="color:#64748b; font-size:10px; font-weight:500;">(${s.username})</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Trạng thái Đồng Bộ Tự Động 100% Không Cần Thao Tác -->
            <div style="margin-top:14px; padding:10px 14px; background:linear-gradient(135deg, #f0fdf4, #ecfdf5); border:1px solid #bbf7d0; border-radius:10px; display:flex; align-items:center; justify-content:space-between; font-size:12.5px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.25);"></span>
                <span style="color:#166534; font-weight:600;">
                  Đồng bộ đa thiết bị (${studentList.length} HS • ${tutorList.length} Gia Sư)
                </span>
              </div>
              <button 
                type="button" 
                onclick="GatewayView.triggerManualSync(this)" 
                style="background:#059669; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 2px 4px rgba(5,150,105,0.2);"
                title="Kiểm tra và tải dữ liệu mới nhất từ Cloud ngay lập tức"
              >
                🔄 Đồng Bộ Ngay
              </button>
            </div>

            <div class="login-card-footer-note">
              <div class="footer-note-seal">🏛️ <strong>EDUTASK - PB</strong> • Nền Tảng Học Tập & Dạy Kèm Chuẩn Mực</div>
              <div class="footer-note-sub">Phân quyền độc lập • Bảo mật dữ liệu & Vững bước tri thức</div>
            </div>

          </div>
        </div>

      </div>
    `;

    setTimeout(() => {
      const uInput = document.getElementById('loginUsername');
      const pInput = document.getElementById('loginPassword');
      if (uInput && !uInput.value) {
        uInput.focus();
      } else if (pInput) {
        pInput.focus();
      }
    }, 150);
  },

  // Chuyển đổi tab vai trò
  switchRole(role) {
    if (!this.roleInfoMap[role]) return;
    this.currentRole = role;
    const info = this.roleInfoMap[role];

    document.querySelectorAll('.login-role-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-role') === role);
    });

    const banner = document.getElementById('roleContextBanner');
    if (banner) {
      banner.className = `role-context-banner ${info.className}`;
      banner.innerHTML = `
        <div style="font-size: 20px; line-height: 1;">${info.icon}</div>
        <div style="flex:1;">
          <div style="font-weight: 800; font-size: 13.5px; margin-bottom: 2px;">
            ${info.title}
          </div>
          <div style="font-size: 12.5px; opacity: 0.9;" id="roleDescriptionText">
            ${info.description}
          </div>
        </div>
      `;
    }

    // Cập nhật banner CTA đăng ký nổi bật
    const ctaBox = document.getElementById('roleRegisterCtaBox');
    if (ctaBox) {
      if (role === 'student') {
        ctaBox.style.display = 'flex';
        ctaBox.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
        ctaBox.style.borderColor = '#10b981';
        ctaBox.style.boxShadow = '0 4px 12px rgba(16,185,129,0.12)';
        ctaBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">🎒</span>
            <div>
              <div style="font-weight:800; font-size:13.5px; color:#065f46;" id="roleRegisterCtaTitle">
                Em là Học Sinh Mới?
              </div>
              <div style="font-size:12px; color:#047857;" id="roleRegisterCtaSub">
                Chưa có tài khoản làm bài tập 1 kèm 1?
              </div>
            </div>
          </div>
          <button 
            type="button" 
            class="btn btn-primary btn-sm" 
            onclick="GatewayView.openRegisterModal('student')" 
            style="background:#059669; border-color:#059669; font-weight:700; font-size:12.5px; padding:7px 14px; border-radius:8px; white-space:nowrap; box-shadow:0 2px 8px rgba(5,150,105,0.3); cursor:pointer;"
          >
            ✨ Đăng Ký Ngay
          </button>
        `;
      } else if (role === 'tutor') {
        ctaBox.style.display = 'flex';
        ctaBox.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
        ctaBox.style.borderColor = '#3b82f6';
        ctaBox.style.boxShadow = '0 4px 12px rgba(59,130,246,0.12)';
        ctaBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">👨‍🏫</span>
            <div>
              <div style="font-weight:800; font-size:13.5px; color:#1e40af;" id="roleRegisterCtaTitle">
                Thầy/Cô là Gia Sư Mới?
              </div>
              <div style="font-size:12px; color:#1d4ed8;" id="roleRegisterCtaSub">
                Đăng ký nhận lớp và giao bài 1 kèm 1?
              </div>
            </div>
          </div>
          <button 
            type="button" 
            class="btn btn-primary btn-sm" 
            onclick="GatewayView.openRegisterModal('tutor')" 
            style="background:#2563eb; border-color:#2563eb; font-weight:700; font-size:12.5px; padding:7px 14px; border-radius:8px; white-space:nowrap; box-shadow:0 2px 8px rgba(37,99,235,0.3); cursor:pointer;"
          >
            ✨ Đăng Ký Gia Sư
          </button>
        `;
      } else {
        ctaBox.style.display = 'none';
      }
    }

    // Cập nhật nút tạo tài khoản phía dưới form
    const orText = document.getElementById('gatewayOrDividerText');
    const quickBtnText = document.getElementById('quickRegisterBtnText');
    const quickBtn = document.getElementById('btnQuickRegisterFromGateway');
    if (quickBtnText && orText && quickBtn) {
      if (role === 'student') {
        orText.textContent = 'HOẶC DÀNH CHO HỌC SINH MỚI';
        quickBtnText.textContent = 'Tạo Tài Khoản Học Sinh Mới';
        quickBtn.style.background = '#ecfdf5';
        quickBtn.style.color = '#065f46';
        quickBtn.style.borderColor = '#10b981';
      } else if (role === 'tutor') {
        orText.textContent = 'HOẶC DÀNH CHO GIA SƯ MỚI';
        quickBtnText.textContent = 'Tạo Tài Khoản Gia Sư Mới';
        quickBtn.style.background = '#eff6ff';
        quickBtn.style.color = '#1e40af';
        quickBtn.style.borderColor = '#3b82f6';
      } else {
        orText.textContent = 'HOẶC TẠO TÀI KHOẢN MỚI';
        quickBtnText.textContent = 'Tạo Tài Khoản Học Sinh Mới';
        quickBtn.style.background = '#ecfdf5';
        quickBtn.style.color = '#065f46';
        quickBtn.style.borderColor = '#10b981';
      }
    }

    const uInput = document.getElementById('loginUsername');
    if (uInput) {
      uInput.placeholder = `${info.placeholder}...`;
    }

    const syncedBox = document.getElementById('syncedAccountsBox');
    if (syncedBox) {
      syncedBox.style.display = role === 'student' ? 'block' : 'none';
    }

    this.dismissAlert();
  },

  // Ẩn / hiện mật khẩu
  togglePasswordVisibility() {
    const pInput = document.getElementById('loginPassword');
    const toggleBtn = document.getElementById('btnTogglePwd');
    if (!pInput || !toggleBtn) return;

    if (pInput.type === 'password') {
      pInput.type = 'text';
      toggleBtn.innerHTML = '🙈';
      toggleBtn.title = 'Ẩn mật khẩu';
    } else {
      pInput.type = 'password';
      toggleBtn.innerHTML = '👁️';
      toggleBtn.title = 'Hiện mật khẩu';
    }
  },

  // Xử lý submit form đăng nhập
  async handleLoginSubmit(event) {
    if (event) event.preventDefault();

    const uInput = document.getElementById('loginUsername');
    const pInput = document.getElementById('loginPassword');

    const username = uInput ? uInput.value.trim() : '';
    const password = pInput ? pInput.value.trim() : '';

    if (!username || !password) {
      this.showAlert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
      return;
    }

    // Hạ bàn phím ảo trên điện thoại để trả lại viewport chuẩn
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    const btn = document.getElementById('btnLoginSubmit');
    const originalBtnText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> <span>Đang kiểm tra tài khoản...</span>`;
    }

    const remInput = document.getElementById('loginRememberMe');
    const rememberMe = remInput ? remInput.checked : false;

    try {
      const result = await Auth.login(username, password, rememberMe);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
      }

      if (!result.success) {
        this.showAlert(result.message);
        
        const card = document.getElementById('loginCard');
        if (card) {
          card.classList.remove('shakeAlert');
          void card.offsetWidth;
          card.style.animation = 'shakeAlert 0.35s ease';
          setTimeout(() => { card.style.animation = ''; }, 400);
        }

        if (pInput) {
          pInput.focus();
          pInput.select();
        }
      } else {
        this.dismissAlert();
        // Đưa màn hình về đỉnh trang (0, 0) chống kẹt khoảng trắng trên điện thoại
        window.scrollTo(0, 0);
        if (document.body) document.body.scrollTop = 0;
        if (document.documentElement) document.documentElement.scrollTop = 0;
      }
    } catch (e) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
      }
      this.showAlert('Đã có lỗi xảy ra: ' + (e.message || 'Vui lòng thử lại'));
    }
  },

  // Hiển thị thông báo lỗi inline
  showAlert(message) {
    const alertBox = document.getElementById('loginAlert');
    const msgEl = document.getElementById('loginAlertMessage');
    if (alertBox && msgEl) {
      msgEl.innerHTML = message;
      alertBox.classList.add('active');
    }
  },

  // Đóng thông báo lỗi inline
  dismissAlert() {
    const alertBox = document.getElementById('loginAlert');
    if (alertBox) {
      alertBox.classList.remove('active');
    }
  },

  // Hướng dẫn Quên mật khẩu
  showForgotPasswordNotice() {
    alert(
      "📌 HƯỚNG DẪN KHÔI PHỤC MẬT KHẨU:\n\n" +
      "Vui lòng liên hệ trực tiếp với Quản Trị Viên (Hotline: 0900.123.456) hoặc Gia sư phụ trách để được hỗ trợ cấp lại mật khẩu cho tài khoản của bạn."
    );
  },

  // Sinh username chuẩn theo họ tên tiếng Việt
  generateUsernameFromName(fullName, prefix = 'std_') {
    if (!fullName || !fullName.trim()) return prefix + Math.floor(Math.random() * 900 + 100);
    const clean = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
    const words = clean.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return prefix + Date.now().toString().slice(-4);
    if (words.length === 1) return prefix + words[0];
    const lastName = words[words.length - 1];
    const initials = words.slice(0, -1).map(w => w[0]).join('');
    return prefix + initials + lastName;
  },

  // ================= ĐĂNG KÝ / TẠO TÀI KHOẢN MỚI TỪ LOGIN =================
  currentRegisterRole: 'student',

  openRegisterModal(role = 'student') {
    this.currentRegisterRole = role;
    
    // Nạp danh sách gia sư vào dropdown
    const tutorSelect = document.getElementById('regStdTutorSelect');
    if (tutorSelect) {
      const tutors = Store.getTutors();
      tutorSelect.innerHTML = tutors.map(t => `
        <option value="${t.id}">${t.name} (${t.phone || 'Gia Sư Phụ Trách'})</option>
      `).join('');
    }

    // Reset các trường học sinh
    const stdName = document.getElementById('regStdName');
    if (stdName) stdName.value = '';
    const stdSchool = document.getElementById('regStdSchool');
    if (stdSchool) stdSchool.value = '';
    const stdPhone = document.getElementById('regStdPhone');
    if (stdPhone) stdPhone.value = '';
    const stdU = document.getElementById('regStdUsername');
    if (stdU) {
      stdU.value = '';
      delete stdU.dataset.customized;
    }
    const stdP = document.getElementById('regStdPassword');
    if (stdP) stdP.value = '123456';

    // Reset các trường gia sư
    const tutName = document.getElementById('regTutorName');
    if (tutName) tutName.value = '';
    const tutSub = document.getElementById('regTutorSubject');
    if (tutSub) tutSub.value = 'Toán Học THPT';
    const tutPhone = document.getElementById('regTutorPhone');
    if (tutPhone) tutPhone.value = '';
    const tutDegree = document.getElementById('regTutorDegree');
    if (tutDegree) tutDegree.value = '';
    const tutU = document.getElementById('regTutorUsername');
    if (tutU) {
      tutU.value = '';
      delete tutU.dataset.customized;
    }
    const tutP = document.getElementById('regTutorPassword');
    if (tutP) tutP.value = '123456';

    this.switchRegisterTab(role);

    const modal = document.getElementById('registerAccountModal');
    if (modal) modal.classList.add('active');

    setTimeout(() => {
      if (role === 'student') {
        if (stdName) stdName.focus();
      } else {
        if (tutName) tutName.focus();
      }
    }, 150);
  },

  switchRegisterTab(role) {
    this.currentRegisterRole = role;
    const tabStd = document.getElementById('tabRegStudent');
    const tabTut = document.getElementById('tabRegTutor');
    const formStd = document.getElementById('formRegStudent');
    const formTut = document.getElementById('formRegTutor');

    if (role === 'student') {
      if (tabStd) { tabStd.className = 'btn btn-primary'; }
      if (tabTut) { tabTut.className = 'btn btn-outline'; }
      if (formStd) formStd.style.display = 'block';
      if (formTut) formTut.style.display = 'none';
    } else {
      if (tabStd) { tabStd.className = 'btn btn-outline'; }
      if (tabTut) { tabTut.className = 'btn btn-primary'; }
      if (formStd) formStd.style.display = 'none';
      if (formTut) formTut.style.display = 'block';
    }
  },

  handleStudentRegNameInput(name) {
    const uField = document.getElementById('regStdUsername');
    if (uField && !uField.dataset.customized) {
      if (!name || !name.trim()) { uField.value = ''; return; }
      uField.value = this.generateUsernameFromName(name, 'std_');
    }
  },

  handleTutorRegNameInput(name) {
    const uField = document.getElementById('regTutorUsername');
    if (uField && !uField.dataset.customized) {
      if (!name || !name.trim()) { uField.value = ''; return; }
      const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
      const words = clean.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const lastName = words[words.length - 1];
        uField.value = 'giasu_' + lastName;
      }
    }
  },

  async submitRegister() {
    const btn = document.getElementById('btnSubmitRegister');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> <span>Đang khởi tạo & đồng bộ tài khoản...</span>';
    }

    try {
      if (this.currentRegisterRole === 'student') {
        const name = document.getElementById('regStdName')?.value.trim();
        const grade = document.getElementById('regStdGrade')?.value || 'Lớp 12';
        const school = document.getElementById('regStdSchool')?.value.trim() || 'THPT';
        const phone = document.getElementById('regStdPhone')?.value.trim();
        const tutorId = document.getElementById('regStdTutorSelect')?.value || 'u_tutor';
        let username = document.getElementById('regStdUsername')?.value.trim();
        let password = document.getElementById('regStdPassword')?.value.trim() || '123456';

        if (!name) {
          App.showToast('Vui lòng nhập họ và tên học sinh!', 'error');
          return;
        }

        const finalPhone = phone || 'Chưa cập nhật';

        if (!username) {
          username = this.generateUsernameFromName(name, 'std_');
        }

        if (password.length < 4) {
          App.showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
          return;
        }

        if (Store.isUsernameTaken(username)) {
          username = username + Math.floor(Math.random() * 90 + 10);
        }

        const tutor = Store.getUserById(tutorId) || Store.getTutors()[0];
        const tutorIdFinal = tutor ? tutor.id : 'u_tutor';
        const tutorNameFinal = tutor ? tutor.name : 'Thầy Minh Đức';

        const words = name.trim().split(/\s+/).filter(Boolean);
        const avatarText = words.length > 1 
          ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
          : words[0].slice(0, 2).toUpperCase();

        const newStudent = {
          id: 'u_std_' + Date.now(),
          hasAccount: true,
          accountStatus: 'active',
          username: username,
          password: password,
          accountCreatedAt: new Date().toISOString(),
          name: name,
          role: 'student',
          roleName: 'Học Sinh',
          assignedTutorId: tutorIdFinal,
          assignedTutorName: tutorNameFinal,
          gender: 'Nam',
          dob: '2008-01-01',
          school: school,
          grade: grade,
          phone: finalPhone,
          address: 'Chưa cập nhật',
          parentName: 'Phụ huynh em ' + name,
          parentPhone: finalPhone,
          parentJob: '',
          subject: 'Toán Học ' + grade.replace('Lớp ', ''),
          initialScore: 6.5,
          currentScore: 6.5,
          targetScore: 9.0,
          feePerSession: 250000,
          totalSessions: 0,
          learningMode: '1 kèm 1',
          schedule: 'Theo thỏa thuận với gia sư',
          startDate: new Date().toISOString().slice(0, 10),
          strengths: 'Chăm chỉ, sẵn sàng rèn luyện',
          weaknesses: 'Cần củng cố kiến thức phương pháp',
          notes: 'Đăng ký tài khoản trực tuyến',
          avatarText: avatarText
        };

        Store.addStudent(newStudent);

        // Đẩy tức thì lên Firebase Realtime Database
        if (window.CloudSync && typeof CloudSync.pushData === 'function') {
          try {
            await CloudSync.pushData(Store.data, true);
          } catch (e) {
            console.warn('Lỗi push Firebase:', e);
          }
        }

        // Đẩy song song lên GitHub
        if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
          GitHubSync.pushToGitHub(Store.data, false).catch(e => console.warn('Lỗi push GitHub:', e));
        }

        App.closeModal('registerAccountModal');

        const isAlreadyLoggedIn = Auth.getCurrentUser() !== null;
        if (isAlreadyLoggedIn) {
          App.showToast(`🎉 Đã thêm học sinh "${name}" (TK: ${username}) thành công và đồng bộ dữ liệu!`, 'success');
          App.updateHeaderProfile();
          App.renderCurrentView();
        } else {
          // Điền trước thông tin đăng nhập
          this.switchRole('student');
          const uField = document.getElementById('loginUsername');
          const pField = document.getElementById('loginPassword');
          if (uField) uField.value = username;
          if (pField) pField.value = password;

          App.showToast(`🎉 Chúc mừng ${name}! Đang tự động vào bàn học cá nhân...`, 'success');

          // TỰ ĐỘNG ĐĂNG NHẬP NGAY LẬP TỨC
          await Auth.login(username, password, true);

          window.scrollTo(0, 0);
          if (document.body) document.body.scrollTop = 0;
          if (document.documentElement) document.documentElement.scrollTop = 0;
        }

      } else {
        const name = document.getElementById('regTutorName')?.value.trim();
        const gender = document.getElementById('regTutorGender')?.value || 'Nam';
        const subject = document.getElementById('regTutorSubject')?.value.trim() || 'Toán Học THPT';
        const phone = document.getElementById('regTutorPhone')?.value.trim();
        const degree = document.getElementById('regTutorDegree')?.value.trim();
        let username = document.getElementById('regTutorUsername')?.value.trim();
        let password = document.getElementById('regTutorPassword')?.value.trim() || '123456';

        if (!name) {
          App.showToast('Vui lòng nhập họ và tên gia sư!', 'error');
          return;
        }

        const finalPhone = phone || 'Chưa cập nhật';

        if (!username) {
          const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
          const words = clean.trim().split(/\s+/).filter(Boolean);
          const lastName = words.length > 0 ? words[words.length - 1] : 'gs';
          username = 'giasu_' + lastName;
        }

        if (password.length < 4) {
          App.showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
          return;
        }

        if (Store.isUsernameTaken(username)) {
          username = username + Math.floor(Math.random() * 90 + 10);
        }

        const words = name.trim().split(/\s+/).filter(Boolean);
        const avatarText = words.length > 1 
          ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
          : words[0].slice(0, 2).toUpperCase();

        const newTutor = {
          id: 'u_tutor_' + Date.now(),
          username: username,
          password: password,
          name: name,
          gender: gender,
          phone: finalPhone,
          role: 'tutor',
          roleName: 'Gia Sư Phụ Trách',
          subjects: [subject],
          degree: degree || 'Giáo viên dạy kèm chuyên môn',
          avatarText: avatarText
        };

        Store.addTutor(newTutor);

        // Đẩy tức thì lên Firebase Realtime Database
        if (window.CloudSync && typeof CloudSync.pushData === 'function') {
          try {
            await CloudSync.pushData(Store.data, true);
          } catch (e) {
            console.warn('Lỗi push Firebase:', e);
          }
        }

        // Đẩy song song lên GitHub
        if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
          GitHubSync.pushToGitHub(Store.data, false).catch(e => console.warn('Lỗi push GitHub:', e));
        }

        App.closeModal('registerAccountModal');

        const isAlreadyLoggedIn = Auth.getCurrentUser() !== null;
        if (isAlreadyLoggedIn) {
          App.showToast(`🎉 Đã thêm Gia Sư "${name}" (TK: ${username}) thành công và đồng bộ dữ liệu!`, 'success');
          App.updateHeaderProfile();
          App.renderCurrentView();
        } else {
          this.switchRole('tutor');
          const uField = document.getElementById('loginUsername');
          const pField = document.getElementById('loginPassword');
          if (uField) uField.value = username;
          if (pField) pField.value = password;

          App.showToast(`🎉 Chào mừng Thầy/Cô ${name}! Đang tự động vào bàn làm việc...`, 'success');

          // TỰ ĐỘNG ĐĂNG NHẬP NGAY LẬP TỨC
          await Auth.login(username, password, true);

          window.scrollTo(0, 0);
          if (document.body) document.body.scrollTop = 0;
          if (document.documentElement) document.documentElement.scrollTop = 0;
        }
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  // Điền nhanh tài khoản học sinh đã đồng bộ
  fillAccount(username, password) {
    const uField = document.getElementById('loginUsername');
    const pField = document.getElementById('loginPassword');
    if (uField) uField.value = username;
    if (pField && password) pField.value = password;
    this.dismissAlert();
    if (window.App && App.showToast) {
      App.showToast(`Đã chọn tài khoản "${username}". Nhấn "Đăng Nhập" để vào bàn học!`, 'info');
    }
  },

  // Kích hoạt đồng bộ thủ công từ Cloud ngay trên màn hình đăng nhập
  async triggerManualSync(btn) {
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Đang đồng bộ...</span>';
    }
    try {
      if (window.CloudSync && typeof CloudSync.pullFromCloud === 'function') {
        await CloudSync.pullFromCloud(true);
      }
    } catch (e) {
      console.warn('Lỗi khi kích hoạt đồng bộ:', e);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      const c = document.getElementById('viewContainer');
      if (c) this.render(c);
    }
  }
};
