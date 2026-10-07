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

    const currentRoleInfo = this.roleInfoMap[this.currentRole];

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
                    value="" 
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

              <!-- Quên Mật Khẩu -->
              <div class="login-options-row" style="justify-content:flex-end;">
                <a href="javascript:void(0)" class="login-forgot-link" onclick="GatewayView.showForgotPasswordNotice()">
                  Quên mật khẩu?
                </a>
              </div>

              <!-- Nút Submit Đăng Nhập -->
              <button type="submit" class="login-submit-btn" id="btnLoginSubmit">
                <span>🔐</span> <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span> <span class="submit-arrow">→</span>
              </button>

              <!-- Phím Chọn Nhanh 1-Chạm (Không cần gõ mật khẩu) -->
              <div style="margin-top:14px; padding:12px 10px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; text-align:center;">
                <div style="font-size:11.5px; font-weight:800; color:#0369a1; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.3px;">
                  ⚡ Vào nhanh 1-chạm (Không cần nhập mật khẩu):
                </div>
                <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                  <button type="button" class="btn btn-xs btn-primary" onclick="Auth.quickSwitch('u_tutor')" style="font-size:11.5px; padding:5px 9px;">👨‍🏫 Thầy Minh Đức</button>
                  <button type="button" class="btn btn-xs btn-secondary" onclick="Auth.quickSwitch('u_tutor_linh')" style="font-size:11.5px; padding:5px 9px;">👩‍🏫 Cô Linh</button>
                  <button type="button" class="btn btn-xs btn-white" onclick="Auth.quickSwitch('u_admin')" style="font-size:11.5px; padding:5px 9px; border:1px solid #cbd5e1;">👑 Admin</button>
                  <button type="button" class="btn btn-xs btn-outline" onclick="Auth.quickSwitch('u_std_quang')" style="font-size:11.5px; padding:5px 9px;">🎒 Em Quang</button>
                </div>
              </div>

              <!-- Liên kết Tạo tài khoản mới -->
              <div style="text-align:center; margin:14px 0 6px 0; padding-top:12px; border-top:1px dashed #e2e8f0;">
                <span style="font-size:13px; color:#64748b;">Chưa có tài khoản? </span>
                <button type="button" onclick="GatewayView.openRegisterModal()" style="background:none; border:none; color:var(--primary); font-size:13px; font-weight:700; cursor:pointer; text-decoration:underline;">
                  ✨ Tạo tài khoản Học Sinh / Gia Sư
                </button>
              </div>

            </form>

            <!-- Thanh trạng thái đồng bộ đám mây trên màn hình đăng nhập -->
            <div style="margin-top:16px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:space-between; font-size:12.5px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span>☁️</span>
                <span style="color:var(--text-muted);">
                  ${window.CloudSync && CloudSync.isConnected ? '<strong style="color:#059669;">Đám mây Realtime: Đang kết nối</strong>' : (window.CloudSync && CloudSync.isConfigured ? '<span style="color:#d97706;">Đám mây: Đang chờ kết nối</span>' : '<span>Dữ liệu chưa đồng bộ giữa PC & ĐT</span>')}
                </span>
              </div>
              <button type="button" onclick="CloudSync.openModal()" style="border:none; background:none; color:var(--primary); font-weight:700; cursor:pointer; font-size:12px; text-decoration:underline;">
                ⚙️ Cài đặt
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

    const uInput = document.getElementById('loginUsername');
    if (uInput) {
      uInput.placeholder = `${info.placeholder}...`;
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
  handleLoginSubmit(event) {
    if (event) event.preventDefault();

    const uInput = document.getElementById('loginUsername');
    const pInput = document.getElementById('loginPassword');

    const username = uInput ? uInput.value.trim() : '';
    const password = pInput ? pInput.value.trim() : '';

    if (!username || !password) {
      this.showAlert('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!');
      return;
    }

    const btn = document.getElementById('btnLoginSubmit');
    const originalBtnText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> <span>Đang xác thực...</span>`;
    }

    setTimeout(() => {
      const result = Auth.login(username, password);

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
      }
    }, 120);
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

  // ================= ĐĂNG KÝ / TẠO TÀI KHOẢN MỚI TỪ LOGIN =================
  currentRegisterRole: 'student',

  openRegisterModal(role = 'student') {
    this.currentRegisterRole = role;
    
    // Nạp danh sách gia sư vào dropdown
    const tutorSelect = document.getElementById('regStdTutorSelect');
    if (tutorSelect) {
      const tutors = Store.getTutors();
      tutorSelect.innerHTML = tutors.map(t => `
        <option value="${t.id}">${t.name} (${t.phone || 'Gia Sư'})</option>
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
    if (stdU) stdU.value = '';
    const stdP = document.getElementById('regStdPassword');
    if (stdP) stdP.value = '';

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
    if (tutU) tutU.value = '';
    const tutP = document.getElementById('regTutorPassword');
    if (tutP) tutP.value = '';

    this.switchRegisterTab(role);

    const modal = document.getElementById('registerAccountModal');
    if (modal) modal.classList.add('active');
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
      const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
      const words = clean.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const lastName = words[words.length - 1];
        const initials = words.slice(0, -1).map(w => w[0]).join('');
        uField.value = 'std_' + initials + lastName;
      }
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

  submitRegister() {
    if (this.currentRegisterRole === 'student') {
      const name = document.getElementById('regStdName')?.value.trim();
      const grade = document.getElementById('regStdGrade')?.value || 'Lớp 12';
      const school = document.getElementById('regStdSchool')?.value.trim() || '';
      const phone = document.getElementById('regStdPhone')?.value.trim();
      const tutorId = document.getElementById('regStdTutorSelect')?.value || 'u_tutor';
      let username = document.getElementById('regStdUsername')?.value.trim();
      const password = document.getElementById('regStdPassword')?.value.trim();

      if (!name) {
        App.showToast('Vui lòng nhập họ và tên học sinh!', 'error');
        return;
      }
      if (!phone) {
        App.showToast('Vui lòng nhập số điện thoại liên hệ!', 'error');
        return;
      }
      if (!username) {
        App.showToast('Vui lòng nhập tên đăng nhập!', 'error');
        return;
      }
      if (!password || password.length < 4) {
        App.showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
        return;
      }

      if (Store.isUsernameTaken(username)) {
        App.showToast(`Tên đăng nhập "${username}" đã có người sử dụng. Vui lòng chọn tên khác!`, 'error');
        return;
      }

      const tutor = Store.getUserById(tutorId);
      const tutorName = tutor ? tutor.name : 'Thầy Minh Đức';

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
        assignedTutorId: tutorId,
        assignedTutorName: tutorName,
        gender: 'Nam',
        dob: '2008-01-01',
        school: school,
        grade: grade,
        phone: phone,
        parentName: 'Phụ huynh ' + name,
        parentPhone: phone,
        currentScore: 7.0,
        targetScore: 9.0,
        subject: 'Toán THPT',
        feePerSession: 250000,
        totalSessions: 0,
        learningMode: '1 kèm 1',
        schedule: 'Theo thỏa thuận với gia sư'
      };

      Store.data.users.push(newStudent);
      Store.save();

      App.closeModal('registerAccountModal');
      this.switchRole('student');
      
      const uField = document.getElementById('loginUsername');
      const pField = document.getElementById('loginPassword');
      if (uField) uField.value = username;
      if (pField) pField.value = password;

      App.showToast(`🎉 Tạo tài khoản Học Sinh thành công! Tên đăng nhập: ${username}`, 'success');
    } else {
      const name = document.getElementById('regTutorName')?.value.trim();
      const gender = document.getElementById('regTutorGender')?.value || 'Nam';
      const subject = document.getElementById('regTutorSubject')?.value.trim() || 'Toán Học THPT';
      const phone = document.getElementById('regTutorPhone')?.value.trim();
      const degree = document.getElementById('regTutorDegree')?.value.trim();
      let username = document.getElementById('regTutorUsername')?.value.trim();
      const password = document.getElementById('regTutorPassword')?.value.trim();

      if (!name) {
        App.showToast('Vui lòng nhập họ và tên gia sư!', 'error');
        return;
      }
      if (!phone) {
        App.showToast('Vui lòng nhập số điện thoại / Zalo!', 'error');
        return;
      }
      if (!username) {
        App.showToast('Vui lòng nhập tên đăng nhập!', 'error');
        return;
      }
      if (!password || password.length < 4) {
        App.showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
        return;
      }

      if (Store.isUsernameTaken(username)) {
        App.showToast(`Tên đăng nhập "${username}" đã có người sử dụng. Vui lòng chọn tên khác!`, 'error');
        return;
      }

      const newTutor = {
        id: 'u_tutor_' + Date.now(),
        username: username,
        password: password,
        name: name,
        gender: gender,
        phone: phone,
        role: 'tutor',
        roleName: 'Gia Sư Phụ Trách',
        subjects: [subject],
        degree: degree || 'Giáo viên dạy kèm chuyên môn'
      };

      Store.addTutor(newTutor);

      App.closeModal('registerAccountModal');
      this.switchRole('tutor');

      const uField = document.getElementById('loginUsername');
      const pField = document.getElementById('loginPassword');
      if (uField) uField.value = username;
      if (pField) pField.value = password;

      App.showToast(`🎉 Tạo tài khoản Gia Sư thành công! Tên đăng nhập: ${username}`, 'success');
    }
  }
};
