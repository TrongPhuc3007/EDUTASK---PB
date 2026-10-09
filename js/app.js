/**
 * EDUTASK PRO — MAIN APPLICATION CONTROLLER
 * Điều phối ứng dụng, điều hướng các View, Modals và Toasts
 */

const App = {
  currentSubmittingAssignmentId: null,

  init() {
    Store.init();
    Auth.init();
    Grader.init();
    if (window.AntiCheat) AntiCheat.init();
    if (window.Quiz) Quiz.init();
    if (window.ThemeManager) ThemeManager.init();

    // Hỗ trợ kiểm thử nhanh theo tham số URL hoặc Hash nếu có
    const urlParams = new URLSearchParams(window.location.search);
    const testUser = urlParams.get('test_user') || (window.location.hash ? window.location.hash.replace('#', '') : null);
    if (testUser) {
      if (testUser === 'admin') Auth.login('admin', 'admin123');
      else if (testUser === 'tutor') Auth.login('giasu', '123456');
      else if (testUser === 'tutor_linh') Auth.login('giasu_linh', '123456');
      else if (testUser === 'student') Auth.login('std_quang', '123456');
      else if (testUser === 'create_modal') {
        Auth.login('giasu', '123456');
      }
      else if (testUser === 'add_tutor') {
        Auth.login('admin', 'admin123');
      }
    }

    this.bindGlobalEvents();
    this.updateHeaderProfile();
    if (window.CloudSync && typeof CloudSync.renderHeaderIndicator === 'function') {
      CloudSync.renderHeaderIndicator();
    }
    if (window.GitHubSync && typeof GitHubSync.renderHeaderIndicator === 'function') {
      GitHubSync.renderHeaderIndicator();
    }
    this.renderCurrentView();

    if (testUser === 'create_modal') this.openCreateAssignmentModal();
    else if (testUser === 'register') GatewayView.openRegisterModal('student');
    else if (testUser === 'add_tutor') AdminView.openAddTutorModal();

    console.log("EDUTASK - PB initialized successfully!");
  },

  bindGlobalEvents() {
    // Theo dõi thao tác người dùng (cuộn, vuốt chạm, lăn chuột) để hoãn các đợt re-render nền
    const markInteraction = () => {
      this.lastUserInteractionTime = Date.now();
    };
    window.addEventListener('scroll', markInteraction, { passive: true });
    window.addEventListener('touchstart', markInteraction, { passive: true });
    window.addEventListener('touchmove', markInteraction, { passive: true });
    window.addEventListener('wheel', markInteraction, { passive: true });

    // Lắng nghe sự kiện chuyển đổi user
    window.addEventListener('auth:user_changed', () => {
      this.updateHeaderProfile();
      this.renderCurrentView();
    });

    // Bắt sự kiện chọn hình thức giao bài trong modal tạo bài tập
    const targetTypeSelect = document.getElementById('newAsnTargetType');
    if (targetTypeSelect) {
      targetTypeSelect.addEventListener('change', (e) => {
        const studentPicker = document.getElementById('studentPickerContainer');
        if (studentPicker) {
          studentPicker.style.display = e.target.value === 'individual' ? 'block' : 'none';
        }
      });
    }

    // Lắng nghe thay đổi loại bài tập (Tự luận vs Trắc nghiệm)
    const newAsnTypeSelect = document.getElementById('newAsnType');
    if (newAsnTypeSelect) {
      newAsnTypeSelect.addEventListener('change', (e) => {
        if (window.Quiz) Quiz.toggleBuilder('create', e.target.value);
      });
    }

    const editAsnTypeSelect = document.getElementById('editAsnType');
    if (editAsnTypeSelect) {
      editAsnTypeSelect.addEventListener('change', (e) => {
        if (window.Quiz) Quiz.toggleBuilder('edit', e.target.value);
      });
    }

    // Hỗ trợ kéo thả tệp vào vùng upload đề bài
    const dropZone = document.getElementById('asnFileUploadZone');
    if (dropZone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('dragover');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
          const fakeEvent = { target: { files: files, value: '' } };
          App.handleAssignmentFileSelect(fakeEvent);
        }
      });
    }

    // Nhấp ra ngoài vùng modal-box để đóng modal tự động
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Nhấn phím Escape để đóng nhanh mọi modal đang mở
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        if (typeof Grader !== 'undefined' && Grader.close) Grader.close();
      }
    });
  },

  updateHeaderProfile() {
    const banner = document.getElementById('adminSuperviseBanner');
    const subEl = document.getElementById('headerWorkspaceSubtitle');
    const navEl = document.getElementById('headerRoleNavigation');
    const actionsEl = document.getElementById('headerUserActions');

    if (!Auth.isAuthenticated()) {
      if (subEl) subEl.textContent = 'Hệ Thống Đăng Nhập Tập Trung';
      if (navEl) navEl.innerHTML = '';
      if (actionsEl) {
        actionsEl.innerHTML = '';
      }
      if (banner) banner.style.display = 'none';
      return;
    }

    const sessionUser = Auth.getSessionUser();
    const activeUser = Auth.getCurrentUser();
    const isRealAdmin = Auth.isRealAdmin();
    const isSupervising = Auth.isAdminSupervising();

    // 1. Dải Banner Giám Sát (Chỉ hiện khi Admin đang xem dưới góc nhìn của Gia Sư hoặc Học Sinh)
    if (banner) {
      if (isSupervising) {
        banner.style.display = 'flex';
        const targetNameEl = document.getElementById('adminSuperviseTargetName');
        if (targetNameEl) {
          targetNameEl.textContent = `${activeUser.name} (${activeUser.roleName})`;
        }
      } else {
        banner.style.display = 'none';
      }
    }

    // 2. Subtitle thương hiệu theo không gian làm việc
    if (subEl) {
      if (activeUser.role === 'admin') {
        subEl.textContent = 'Bàn Quản Trị Hệ Thống (Toàn Quyền)';
      } else if (activeUser.role === 'tutor') {
        subEl.textContent = isSupervising ? 'Bàn Gia Sư (Đang Giám Sát)' : 'Bàn Làm Việc Chuyên Môn Gia Sư';
      } else if (activeUser.role === 'student') {
        subEl.textContent = isSupervising ? `Bàn Học Sinh (Đang Giám Sát: ${activeUser.name})` : `Bàn Học Cá Nhân • ${activeUser.grade || 'Học Sinh'}`;
      }
    }

    // 3. Thanh điều hướng: CHỈ ADMIN MỚI CÓ MASTER BAR ĐỂ GIÁM SÁT! GIA SƯ VÀ HỌC SINH HOÀN TOÀN KHÔNG CÓ!
    if (navEl) {
      if (isRealAdmin) {
        const isAdmActive = activeUser.role === 'admin';
        const isStdActive = activeUser.role === 'student';

        navEl.innerHTML = `
          <div class="role-switcher-bar" style="background:#e0e7ff; border:1px solid #c7d2fe;">
            <button class="role-switch-btn ${isAdmActive ? 'active' : ''}" 
                    onclick="Auth.adminReturnToAdmin()" title="Về bàn quản trị hệ thống">
              <span class="role-icon">👑</span> Quản Trị (Admin)
            </button>
            <button class="role-switch-btn ${activeUser.role === 'tutor' ? 'active' : ''}" 
                    onclick="App.openAdminPickTutorModal()" title="Giám sát bàn làm việc của Gia sư">
              <span class="role-icon">👨‍🏫</span> Xem Bàn Gia Sư ▾
            </button>
            <button class="role-switch-btn ${isStdActive ? 'active' : ''}" 
                    onclick="App.openAdminPickStudentModal()" title="Chọn học sinh để giám sát bàn học">
              <span class="role-icon">🎒</span> Xem Bàn Học Sinh ▾
            </button>
          </div>
        `;
      } else {
        // GIA SƯ & HỌC SINH: TUYỆT ĐỐI KHÔNG CÓ BẤT KỲ THANH CHUYỂN VAI TRÒ NÀO!
        navEl.innerHTML = '';
      }
    }

    // 4. Khối tài khoản & Nút Đăng Xuất
    if (actionsEl) {
      actionsEl.innerHTML = `
        <div class="user-profile-badge">
          <div class="user-avatar">${activeUser.avatarText || activeUser.name.slice(0, 2).toUpperCase()}</div>
          <div class="user-meta">
            <span class="user-name">${activeUser.name}</span>
            <span class="user-account-sub">TK: ${activeUser.username} • ${isSupervising ? 'Đang giám sát' : activeUser.roleName}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="Auth.logout()" title="Đăng xuất để chuyển cổng" style="border-radius:999px; gap:4px; font-weight:700;">
          🚪 Đăng Xuất
        </button>
      `;
    }

    // 5. Quản lý hiển thị thanh Mobile Bottom Navigation (Chỉ hiện khi là Học Sinh trên điện thoại)
    const mobileNav = document.getElementById('mobileBottomNav');
    const isStudent = activeUser && activeUser.role === 'student';
    if (mobileNav) {
      mobileNav.style.display = isStudent ? 'flex' : 'none';
    }
    if (document.body) {
      document.body.classList.toggle('has-bottom-nav', !!isStudent);
    }
  },

  lastRenderedRole: null,
  pendingRenderTimer: null,
  lastUserInteractionTime: 0,

  // Render an toàn có debounce chống giật và bảo vệ khi người dùng đang gõ bàn phím / làm bài / tương tác
  safeRenderCurrentView(force = false) {
    const isGrader = window.Grader && Grader.activeSubmission;
    const hasActiveModal = document.querySelector('.modal-overlay.active');
    const isTakingQuiz = window.Quiz && Quiz.activeQuiz && Quiz.activeQuiz.assignment;
    const isAntiCheat = window.AntiCheat && AntiCheat.isMonitoring;

    // Đang mở modal, đang chấm bài, đang làm trắc nghiệm hoặc đang thi -> Không hủy DOM giao diện
    if (isGrader || hasActiveModal || isTakingQuiz || isAntiCheat) return;

    const activeEl = document.activeElement;
    const isEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    if (!force && isEditing) {
      if (this.pendingRenderTimer) clearTimeout(this.pendingRenderTimer);
      this.pendingRenderTimer = setTimeout(() => {
        this.safeRenderCurrentView(false);
      }, 1500);
      return;
    }

    // Nếu người dùng vừa vuốt chạm hoặc cuộn trang trong vòng 500ms -> Hoãn lại để giữ độ mượt, chống giật
    const timeSinceInteraction = Date.now() - this.lastUserInteractionTime;
    if (!force && timeSinceInteraction < 500) {
      if (this.pendingRenderTimer) clearTimeout(this.pendingRenderTimer);
      this.pendingRenderTimer = setTimeout(() => {
        this.safeRenderCurrentView(false);
      }, 500);
      return;
    }

    if (this.pendingRenderTimer) clearTimeout(this.pendingRenderTimer);
    // Debounce 400ms: Gom nhóm tất cả các đợt đồng bộ liên tiếp từ nhiều máy cùng lúc thành 1 lần vẽ duy nhất
    this.pendingRenderTimer = setTimeout(() => {
      this.pendingRenderTimer = null;
      this.updateHeaderProfile();
      this.renderCurrentView(false);
    }, 400);
  },

  renderCurrentView(forceScrollTop = false) {
    try {
      const container = document.getElementById('viewContainer');
      if (!container) return;

      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const prevHeight = container.offsetHeight;
      if (prevHeight > 0) {
        container.style.minHeight = prevHeight + 'px';
      }

      if (!Auth.isAuthenticated()) {
        // Hiển thị Màn Hình 3 Cổng Đăng Nhập Phân Quyền
        GatewayView.render(container);
        if (forceScrollTop) window.scrollTo(0, 0);
        container.style.minHeight = '';
        return;
      }

      const activeUser = Auth.getCurrentUser();
      if (!activeUser) {
        GatewayView.render(container);
        if (forceScrollTop) window.scrollTo(0, 0);
        container.style.minHeight = '';
        return;
      }

      const roleChanged = this.lastRenderedRole !== activeUser.role;
      this.lastRenderedRole = activeUser.role;

      if (activeUser.role === 'admin') {
        AdminView.render(container);
      } else if (activeUser.role === 'tutor') {
        TutorView.render(container);
      } else if (activeUser.role === 'student') {
        StudentView.render(container);
      } else if (activeUser.role === 'parent') {
        ParentView.render(container);
      }

      if (forceScrollTop || roleChanged) {
        container.style.minHeight = '';
        window.scrollTo(0, 0);
      } else {
        requestAnimationFrame(() => {
          if (currentScrollY > 0) {
            window.scrollTo({ top: currentScrollY, behavior: 'instant' });
          }
          container.style.minHeight = '';
        });
      }
    } catch (err) {
      console.error("Lỗi khi hiển thị trang:", err);
      const container = document.getElementById('viewContainer');
      if (container) {
        container.style.minHeight = '';
        container.innerHTML = `
          <div style="padding:40px; text-align:center; background:white; border-radius:12px; margin:20px; border:1px solid #fee2e2;">
            <h3 style="color:#dc2626;">⚠️ Đã xảy ra lỗi khi tải dữ liệu</h3>
            <p style="color:#64748b; margin:12px 0;">${err.message}</p>
            <button class="btn btn-primary" onclick="Auth.logout(); location.reload();">🔄 Đăng Xuất Về Màn Hình Cổng</button>
          </div>
        `;
      }
    }
  },

  handleLogoClick() {
    if (!Auth.isAuthenticated()) {
      location.reload();
      return;
    }
    if (Auth.isRealAdmin()) {
      Auth.adminReturnToAdmin();
    } else {
      this.renderCurrentView();
    }
  },

  openAdminPickStudentModal() {
    const listEl = document.getElementById('adminPickStudentList');
    if (!listEl) return;

    const students = Store.getStudents();
    listEl.innerHTML = students.map(std => {
      const hasAcc = std.hasAccount === true && std.accountStatus === 'active';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 14px; border-radius:10px; border:1px solid #e2e8f0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="user-avatar" style="width:36px; height:36px; font-size:12px;">
              ${std.avatarText || std.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong style="color:var(--text-main); font-size:14px;">${std.name}</strong> 
              <span class="badge ${hasAcc ? 'badge-success' : 'badge-danger'}" style="font-size:10.5px; margin-left:4px;">
                ${hasAcc ? 'Đã có TK' : 'Chưa có TK'}
              </span>
              <div style="font-size:11.5px; color:var(--primary); font-family:var(--font-mono); font-weight:600; margin-top:1px;">
                TK: ${std.username || 'Chưa cấp'}
              </div>
              <small style="color:var(--text-muted);">${std.grade} • ${std.school || 'Học sinh kèm'}</small>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="App.closeModal('adminPickStudentModal'); Auth.adminSupervise('${std.id}')">
            👁️ Xem Bàn Học
          </button>
        </div>
      `;
    }).join('');

    const modal = document.getElementById('adminPickStudentModal');
    if (modal) modal.classList.add('active');
  },

  // ================= MODAL: CHỌN GIA SƯ ĐỂ GIÁM SÁT (ADMIN TOÀN QUYỀN) =================
  openAdminPickTutorModal() {
    const listEl = document.getElementById('adminPickTutorList');
    if (!listEl) return;

    const tutors = Store.getTutors();
    listEl.innerHTML = tutors.map(tut => {
      const myStudents = Store.getStudentsByTutor(tut.id);
      const myAssignments = Store.getAllAssignments().filter(a => a.tutorId === tut.id || (a.targetStudentIds && a.targetStudentIds.some(sid => myStudents.some(s => s.id === sid))));
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 14px; border-radius:10px; border:1px solid #e2e8f0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="user-avatar" style="width:38px; height:38px; font-size:13px; background:linear-gradient(135deg, #4f46e5, #4338ca); color:white;">
              ${tut.avatarText || tut.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong style="color:var(--text-main); font-size:14.5px;">${tut.name}</strong>
              <div style="font-size:12px; color:var(--primary); font-family:var(--font-mono); font-weight:600; margin-top:1px;">
                TK: ${tut.username} • SĐT: ${tut.phone || 'Chưa cập nhật'}
              </div>
              <small style="color:var(--text-muted); font-size:12px;">
                Phụ trách: <strong style="color:var(--primary);">${myStudents.length} học sinh</strong> • ${myAssignments.length} bài tập
              </small>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="App.closeModal('adminPickTutorModal'); Auth.adminSupervise('${tut.id}')">
            👁️ Xem Bàn Này
          </button>
        </div>
      `;
    }).join('');

    const modal = document.getElementById('adminPickTutorModal');
    if (modal) modal.classList.add('active');
  },

  // ================= MODAL: TẠO BÀI TẬP CÁ NHÂN HÓA HOẶC CẢ LỚP =================
  currentAssignmentAttachment: null,

  updateClassPickerInfo() {
    const classSelect = document.getElementById('newAsnClassSelect');
    const infoBox = document.getElementById('classPickerInfoBox');
    if (!classSelect || !infoBox) return;

    const classId = classSelect.value;
    const cls = Store.getClassById(classId);
    if (!cls) {
      infoBox.innerHTML = '';
      return;
    }

    const students = Store.getStudentsByClass(cls.id);
    infoBox.innerHTML = `
      <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px; padding:10px 14px; font-size:12.5px; color:#4338ca; display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>🏫 <strong>Lớp:</strong> ${cls.name}</span>
          <span class="badge" style="background:#4f46e5; color:white; font-size:11px;">Sĩ số: ${students.length} học sinh</span>
        </div>
        <div style="font-size:12px; color:#6d28d9;">
          Môn học: <strong>${cls.subject || 'Toán'}</strong> • Phụ trách: <strong>${cls.tutorName || 'Gia Sư'}</strong> • Phòng: <strong>${cls.room || 'Trực tuyến'}</strong>
        </div>
        <div style="margin-top:4px; display:flex; flex-wrap:wrap; gap:4px; max-height:60px; overflow-y:auto;">
          ${students.length === 0 ? '<em style="color:#818cf8;">Lớp này chưa có học sinh nào. Hãy thêm học sinh vào lớp trước.</em>' : students.map(s => `
            <span class="badge" style="background:#ede9fe; color:#5b21b6; font-size:11px; border:1px solid #ddd6fe;">
              👤 ${s.name}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleTargetTypeChange(type) {
    const classContainer = document.getElementById('classPickerContainer');
    const studentContainer = document.getElementById('studentPickerContainer');
    if (classContainer) classContainer.style.display = (type === 'class') ? 'block' : 'none';
    if (studentContainer) studentContainer.style.display = (type === 'individual') ? 'block' : 'none';
    if (type === 'class') {
      this.updateClassPickerInfo();
    }
  },

  openCreateAssignmentModal(targetStudentId = null, targetClassId = null) {
    const modal = document.getElementById('createAssignmentModal');
    if (!modal) return;

    const user = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = user ? user.id : '';
    const studentListContainer = document.getElementById('studentCheckboxesList');
    
    // Chỉ lấy học sinh thuộc quyền phụ trách của giáo viên này (hoặc toàn bộ nếu là Master Admin)
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    // Tạo danh sách checkbox học sinh
    if (students.length === 0) {
      studentListContainer.innerHTML = `
        <div style="padding:12px; text-align:center; color:var(--text-muted); font-size:13px;">
          Chưa có học sinh nào được phân công cho giáo viên này.
        </div>
      `;
    } else {
      studentListContainer.innerHTML = students.map(std => `
        <label class="student-picker-item">
          <input type="checkbox" name="targetStudent" value="${std.id}" 
            ${targetStudentId === std.id ? 'checked' : ''}>
          <div>
            <strong>${std.name}</strong> <span style="font-size:11.5px; color:var(--primary); font-family:var(--font-mono); font-weight:600;">(TK: ${std.username || 'Chưa cấp'})</span> — <small style="color:var(--text-muted);">${std.grade}</small>
          </div>
        </label>
      `).join('');
    }

    // Đổ danh sách lớp học
    const classSelect = document.getElementById('newAsnClassSelect');
    const classes = isMasterAdmin ? Store.getClasses() : Store.getClassesByTutor(currentTutorId);
    const availableClasses = classes.length > 0 ? classes : Store.getClasses();
    if (classSelect) {
      if (availableClasses.length === 0) {
        classSelect.innerHTML = `<option value="">Chưa có lớp học nào — Vui lòng tạo lớp học trước</option>`;
      } else {
        classSelect.innerHTML = availableClasses.map(cls => `
          <option value="${cls.id}">${cls.name} (${cls.grade} • Sĩ số: ${(cls.studentIds || []).length} em)</option>
        `).join('');
      }
      if (targetClassId) {
        classSelect.value = targetClassId;
      }
    }

    const targetTypeSelect = document.getElementById('newAsnTargetType');
    if (targetStudentId) {
      targetTypeSelect.value = 'individual';
    } else if (targetClassId || availableClasses.length > 0) {
      targetTypeSelect.value = 'class';
    } else {
      targetTypeSelect.value = 'individual';
    }
    this.handleTargetTypeChange(targetTypeSelect.value);

    // Đặt hạn nộp mặc định là 2 ngày sau lúc 21h
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(21, 0, 0, 0);
    const deadlineString = now.toISOString().slice(0, 16);
    document.getElementById('newAsnDeadline').value = deadlineString;

    // Reset form fields
    const titleInput = document.getElementById('newAsnTitle');
    if (titleInput) titleInput.value = '';
    const descInput = document.getElementById('newAsnDesc');
    if (descInput) descInput.value = '';
    const topicInput = document.getElementById('newAsnTopic');
    if (topicInput) topicInput.value = '';
    const typeSelect = document.getElementById('newAsnType');
    if (typeSelect) typeSelect.value = 'photo';
    if (window.Quiz) {
      Quiz.initDefaultQuestions('create', 10);
      Quiz.toggleBuilder('create', 'photo');
    }

    // Reset file đính kèm
    this.currentAssignmentAttachment = null;
    const fileInput = document.getElementById('newAsnFileInput');
    if (fileInput) fileInput.value = '';
    this.updateAssignmentFilePreview();

    modal.classList.add('active');
  },

  handleAssignmentFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      App.showToast('Kích thước tệp vượt quá 25MB! Vui lòng chọn tệp nhỏ hơn.', 'error');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      App.currentAssignmentAttachment = {
        name: file.name,
        size: App.formatFileSize(file.size),
        type: file.type || file.name.split('.').pop(),
        dataUrl: e.target.result
      };
      App.updateAssignmentFilePreview();
      App.showToast(`📎 Đã đính kèm tệp: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  },

  removeAssignmentAttachment() {
    this.currentAssignmentAttachment = null;
    const input = document.getElementById('newAsnFileInput');
    if (input) input.value = '';
    this.updateAssignmentFilePreview();
    this.showToast('Đã xóa tệp đính kèm.', 'info');
  },

  updateAssignmentFilePreview() {
    const prompt = document.getElementById('asnFileDropPrompt');
    const card = document.getElementById('asnFileSelectedCard');
    const nameEl = document.getElementById('asnFileName');
    const sizeEl = document.getElementById('asnFileSize');
    const iconEl = document.getElementById('asnFileIcon');
    const extractBtn = document.getElementById('btnExtractQuizFromAttachment');

    if (!prompt || !card) return;

    if (this.currentAssignmentAttachment) {
      prompt.style.display = 'none';
      card.style.display = 'flex';
      const ext = this.currentAssignmentAttachment.name.split('.').pop().toLowerCase();
      if (nameEl) nameEl.textContent = this.currentAssignmentAttachment.name;
      if (sizeEl) sizeEl.textContent = this.currentAssignmentAttachment.size;
      if (iconEl) {
        if (['pdf'].includes(ext)) iconEl.textContent = '📕';
        else if (['doc', 'docx'].includes(ext)) iconEl.textContent = '📘';
        else if (['xls', 'xlsx'].includes(ext)) iconEl.textContent = '📗';
        else if (['png', 'jpg', 'jpeg'].includes(ext)) iconEl.textContent = '🖼️';
        else if (['zip', 'rar'].includes(ext)) iconEl.textContent = '📦';
        else iconEl.textContent = '📄';
      }
      if (extractBtn) {
        extractBtn.style.display = ['docx', 'txt'].includes(ext) ? 'inline-flex' : 'none';
      }
    } else {
      prompt.style.display = 'flex';
      card.style.display = 'none';
      if (extractBtn) extractBtn.style.display = 'none';
    }
  },

  // Tự động đọc và bóc tách đề thi từ tệp vừa đính kèm (.docx, .txt)
  extractQuizFromCurrentAttachment() {
    if (!this.currentAssignmentAttachment) return;
    const typeSelect = document.getElementById('newAsnType');
    if (typeSelect) {
      typeSelect.value = 'quiz';
      if (window.Quiz) {
        Quiz.toggleBuilder('create', 'quiz');
        Quiz.setBuilderMode('create', 'import');
      }
    }

    const att = this.currentAssignmentAttachment;
    const ext = att.name.split('.').pop().toLowerCase();

    if (ext === 'txt') {
      try {
        const base64Part = att.dataUrl.split(',')[1];
        const text = decodeURIComponent(escape(atob(base64Part)));
        const textarea = document.getElementById('createImportTextarea');
        if (textarea) {
          textarea.value = text;
          Quiz.handleParsePreview('create');
          this.showToast(`✓ Đã tự động đọc đề bài từ ${att.name}!`, 'success');
        }
      } catch (e) {
        console.warn(e);
      }
    } else if (ext === 'docx') {
      try {
        const base64Part = att.dataUrl.split(',')[1];
        const binaryStr = atob(base64Part);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        this.showToast('⏳ Đang giải nén và phân tích tệp Word...', 'info');
        Quiz.extractTextFromDocx(bytes.buffer).then(text => {
          const textarea = document.getElementById('createImportTextarea');
          if (textarea) {
            textarea.value = text;
            Quiz.handleParsePreview('create');
            this.showToast(`✓ Đã bóc tách thành công từ tệp Word ${att.name}!`, 'success');
          }
        }).catch(err => {
          console.warn(err);
          this.showToast('Không thể giải nén tự động tệp Word này. Bạn có thể mở Word và dán nội dung vào ô bên dưới!', 'warning');
        });
      } catch (e) {
        console.warn(e);
      }
    }
  },

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  handleDownloadAttachment(event, asnId) {
    const asn = Store.getAllAssignments().find(a => a.id === asnId);
    if (!asn || !asn.attachmentName) return;

    App.showToast(`📥 Đang tải xuống tệp đề bài: "${asn.attachmentName}"...`, 'info');

    // Nếu đã có Base64 dataUrl chuẩn thì trình duyệt tự tải
    if (asn.attachmentDataUrl && asn.attachmentDataUrl.startsWith('data:') && !asn.attachmentDataUrl.startsWith('data:text/plain')) {
      return;
    }

    // Luôn đảm bảo học sinh tải về thành công 100% bằng cách tạo File Blob tải tức thì
    event.preventDefault();
    const sampleContent = `EDUTASK - PB — TÀI LIỆU ĐỀ BÀI TẬP VỀ NHÀ\n\n` +
      `Tiêu đề bài tập: ${asn.title}\n` +
      `Chuyên đề: ${asn.topic || 'Toán Học THPT'}\n` +
      `Gia sư giao bài: ${asn.tutorName || 'Gia Sư Phụ Trách'}\n` +
      `Hạn chót nộp bài: ${new Date(asn.deadline).toLocaleString('vi-VN')}\n\n` +
      `Nội dung & Yêu cầu đề bài:\n${asn.description || 'Làm bài chi tiết ra vở viết tay và chụp ảnh nộp trước hạn chót.'}\n\n` +
      `-----------------------------------------------------\n` +
      `Chúc các em hoàn thành bài làm tốt nhất và bứt phá điểm số!`;
    const blob = new Blob([sampleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asn.attachmentName.includes('.') ? asn.attachmentName : `${asn.attachmentName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      return true;
    }
    return false;
  },

  closeModal(modalId) {
    if (modalId === 'submitHomeworkModal' && window.AntiCheat && AntiCheat.isMonitoring) {
      AntiCheat.stopMonitoring();
    }
    if (modalId === 'quizTakingModal') {
      if (window.Quiz && Quiz.activeQuiz && Quiz.activeQuiz.timerInterval) {
        clearInterval(Quiz.activeQuiz.timerInterval);
      }
      if (window.AntiCheat && AntiCheat.isMonitoring) {
        AntiCheat.stopMonitoring();
      }
    }
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  saveNewAssignment() {
    const title = document.getElementById('newAsnTitle').value.trim();
    const description = document.getElementById('newAsnDesc').value.trim();
    const targetType = document.getElementById('newAsnTargetType').value;
    const deadline = document.getElementById('newAsnDeadline').value;
    const submissionType = document.getElementById('newAsnType').value;

    if (!title) {
      this.showToast('Vui lòng nhập tiêu đề bài tập!', 'error');
      return;
    }

    const tutor = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = tutor ? tutor.id : '';
    const availableStudents = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    // Lấy danh sách học sinh được chọn
    let targetStudentIds = [];
    let classId = null;
    let className = '';

    if (targetType === 'class') {
      const classSelect = document.getElementById('newAsnClassSelect');
      classId = classSelect ? classSelect.value : null;
      if (!classId) {
        this.showToast('Vui lòng chọn Lớp học nhận bài tập!', 'error');
        return;
      }
      const cls = Store.getClassById(classId);
      if (!cls) {
        this.showToast('Không tìm thấy lớp học đã chọn!', 'error');
        return;
      }
      className = cls.name;
      targetStudentIds = Array.isArray(cls.studentIds) ? [...cls.studentIds] : [];
      if (targetStudentIds.length === 0) {
        this.showToast(`Lớp "${cls.name}" hiện chưa có học sinh nào! Hãy thêm học sinh vào lớp trước khi giao bài.`, 'warning');
        return;
      }
    } else if (targetType === 'individual') {
      const checkedBoxes = document.querySelectorAll('input[name="targetStudent"]:checked');
      targetStudentIds = Array.from(checkedBoxes).map(cb => cb.value);
      if (targetStudentIds.length === 0) {
        this.showToast('Vui lòng chọn ít nhất 1 học sinh nhận bài tập!', 'error');
        return;
      }
    } else {
      // Giao cho toàn bộ học sinh do giáo viên này phụ trách
      targetStudentIds = availableStudents.map(s => s.id);
      if (targetStudentIds.length === 0) {
        this.showToast('Chưa có học sinh nào thuộc phụ trách của giáo viên này để giao bài!', 'error');
        return;
      }
    }

    const topic = document.getElementById('newAsnTopic')?.value.trim() || 'Chuyên đề ôn tập';
    const difficulty = document.getElementById('newAsnDifficulty')?.value || 'Thông hiểu - Vận dụng';

    const newAssignment = {
      id: 'asn_' + Date.now(),
      title,
      description: description || 'Hoàn thành bài tập đúng hạn.',
      topic,
      difficulty,
      attachmentName: this.currentAssignmentAttachment ? this.currentAssignmentAttachment.name : null,
      attachmentSize: this.currentAssignmentAttachment ? this.currentAssignmentAttachment.size : null,
      attachmentType: this.currentAssignmentAttachment ? this.currentAssignmentAttachment.type : null,
      attachmentDataUrl: this.currentAssignmentAttachment ? this.currentAssignmentAttachment.dataUrl : null,
      tutorId: currentTutorId,
      tutorName: tutor ? tutor.name : 'Gia Sư Phụ Trách',
      subject: (tutor && tutor.subjects && tutor.subjects[0]) || 'Toán Học',
      targetType,
      classId: classId,
      targetStudentIds,
      deadline,
      createdAt: new Date().toISOString(),
      totalPoints: 10,
      status: 'waiting_submission',
      type: submissionType,
      submissionType
    };

    if (submissionType === 'quiz' && window.Quiz) {
      newAssignment.quizData = Quiz.getBuilderData('create');
    }

    Store.addAssignment(newAssignment);

    // Tự động đăng thông báo lên bảng tin lớp học nếu có chọn
    if (targetType === 'class' && classId) {
      const shouldAnnounce = document.getElementById('newAsnAutoAnnounce')?.checked ?? true;
      if (shouldAnnounce) {
        const dFmt = deadline ? new Date(deadline).toLocaleString('vi-VN') : 'Sớm';
        const typeFmt = submissionType === 'quiz' ? 'Trắc nghiệm trực tuyến' : 'Tự luận (chụp ảnh bài làm)';
        Store.addClassAnnouncement(classId, {
          title: `📚 Bài tập mới: ${title}`,
          content: `Thầy/Cô vừa giao bài tập "${title}" cho toàn lớp.\n` +
            `• Chuyên đề: ${topic}\n` +
            `• Hình thức: ${typeFmt}\n` +
            `• Hạn chót nộp bài: ${dFmt}\n` +
            `👉 Các em học sinh đăng nhập vào hệ thống EduTask để làm và nộp bài đúng hạn nhé!`
        });
      }
    }

    const attachMsg = this.currentAssignmentAttachment ? ` (có đính kèm "${this.currentAssignmentAttachment.name}")` : '';
    const quizMsg = submissionType === 'quiz' ? ` (Trắc nghiệm Online: ${newAssignment.quizData?.questions?.length || 10} câu)` : '';
    const scopeMsg = targetType === 'class' ? `lớp ${className} (${targetStudentIds.length} em)` : `${targetStudentIds.length} học sinh`;
    
    this.closeModal('createAssignmentModal');
    this.renderCurrentView();

    // Nếu giao cho lớp và có bật thông báo Zalo, hiển thị modal tin nhắn Zalo gửi phụ huynh / nhóm lớp
    if (targetType === 'class' && classId) {
      const shouldZalo = document.getElementById('newAsnZaloNotify')?.checked ?? true;
      const targetClass = Store.getClassById(classId);
      if (shouldZalo && targetClass) {
        this.showClassAssignmentZaloSuccess(newAssignment, targetClass);
        return;
      }
    }

    this.showToast(`🎉 Đã giao bài tập thành công cho ${scopeMsg}${attachMsg}${quizMsg}!`, 'success');
  },

  showClassAssignmentZaloSuccess(asn, cls) {
    const subtitleEl = document.getElementById('classAsnSuccessSubtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `Toàn bộ ${(asn.targetStudentIds || []).length} học sinh trong lớp "${cls.name}" đã nhận được bài tập`;
    }

    const summaryCard = document.getElementById('classAsnSuccessSummaryCard');
    if (summaryCard) {
      summaryCard.innerHTML = `
        <div style="font-weight:700; font-size:14px; color:#15803d;">
          ✅ Đã giao bài: "${asn.title}"
        </div>
        <div>
          Lớp nhận bài: <strong>${cls.name}</strong> • Sĩ số nhận: <strong>${(asn.targetStudentIds || []).length} học sinh</strong>
        </div>
        <div>
          Hạn chót nộp: <strong>${asn.deadline ? new Date(asn.deadline).toLocaleString('vi-VN') : 'Không hạn'}</strong> • Hình thức: <strong>${asn.type === 'quiz' ? 'Trắc nghiệm Online' : 'Tự luận (ảnh vở viết tay)'}</strong>
        </div>
      `;
    }

    const dStr = asn.deadline ? new Date(asn.deadline).toLocaleString('vi-VN') : 'Sớm';
    const typeStr = asn.type === 'quiz' ? 'Trắc nghiệm Online' : 'Tự luận (chụp ảnh vở viết tay)';
    const attachStr = asn.attachmentName ? `\n• Tài liệu đính kèm: ${asn.attachmentName}` : '';

    const zaloMessage = `📢 THÔNG BÁO GIAO BÀI TẬP VỀ NHÀ — LỚP: ${cls.name.toUpperCase()}
Kính gửi Quý phụ huynh và các em học sinh,
Thầy/Cô vừa giao bài tập mới trên hệ thống học tập EduTask:

📚 Tên bài tập: ${asn.title}
📌 Chuyên đề: ${asn.topic || 'Ôn tập'}
📝 Hình thức: ${typeStr}${attachStr}
⏰ Hạn chót nộp bài: ${dStr}
📋 Yêu cầu: ${asn.description || 'Làm bài cẩn thận và nộp đúng hạn.'}

👉 Các em đăng nhập vào hệ thống EduTask để làm bài và nộp trước thời hạn quy định.
Chúc các em học tập hiệu quả và hoàn thành bài thật tốt!
Trân trọng.`;

    const textBox = document.getElementById('classAsnSuccessZaloText');
    if (textBox) {
      textBox.textContent = zaloMessage;
    }

    const modal = document.getElementById('classAssignmentSuccessModal');
    if (modal) modal.classList.add('active');
  },

  copyClassAssignmentZalo() {
    const textBox = document.getElementById('classAsnSuccessZaloText');
    if (!textBox) return;
    const text = textBox.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('📋 Đã sao chép tin nhắn Zalo bài tập lớp! Bạn có thể dán (Ctrl+V) vào nhóm Zalo lớp ngay.', 'success');
      }).catch(() => {
        this.fallbackCopyText(text);
      });
    } else {
      this.fallbackCopyText(text);
    }
  },

  fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.showToast('📋 Đã sao chép tin nhắn Zalo thành công!', 'success');
  },

  // ================= MODAL: HỌC SINH NỘP BÀI (HỖ TRỢ NHIỀU TRANG) =================
  currentUploadedPhotos: [],

  openSubmitModal(assignmentId) {
    this.currentSubmittingAssignmentId = assignmentId;
    this.currentUploadedPhotos = [];

    const assignment = Store.data.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    document.getElementById('submitModalTitle').textContent = `Nộp Bài: ${assignment.title}`;
    
    const camInput = document.getElementById('submitCameraInput');
    if (camInput) camInput.value = '';
    const galInput = document.getElementById('submitGalleryInput');
    if (galInput) galInput.value = '';

    this.renderSubmitPhotosGrid();

    const noteInput = document.getElementById('submitHomeworkNote');
    if (noteInput) noteInput.value = '';

    // Bắt đầu chế độ giám sát chống chuyển tab / tra cứu AI ngoài
    const student = Auth.getCurrentUser();
    if (window.AntiCheat && student) {
      AntiCheat.startMonitoring(assignmentId, student.id);
    }

    const modal = document.getElementById('submitHomeworkModal');
    if (modal) modal.classList.add('active');
  },

  handleHomeworkFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let processed = 0;

    const processFile = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1400;
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          App.currentUploadedPhotos.push(compressedDataUrl);
          processed++;
          if (processed === fileList.length) {
            App.renderSubmitPhotosGrid();
            App.showToast(`✓ Đã thêm ${fileList.length} ảnh trang bài làm!`, 'success');
          }
        };
        img.onerror = () => {
          App.currentUploadedPhotos.push(rawDataUrl);
          processed++;
          if (processed === fileList.length) {
            App.renderSubmitPhotosGrid();
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    };

    fileList.forEach(processFile);
    event.target.value = '';
  },

  renderSubmitPhotosGrid() {
    const container = document.getElementById('submitPhotosContainer');
    const grid = document.getElementById('submitPhotosGrid');
    const countEl = document.getElementById('submitPhotosCount');

    if (!container || !grid) return;

    const count = this.currentUploadedPhotos.length;
    if (countEl) countEl.textContent = count;

    if (count === 0) {
      container.style.display = 'none';
      grid.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    grid.innerHTML = this.currentUploadedPhotos.map((url, idx) => `
      <div class="submit-photo-card">
        <div class="submit-photo-thumb-wrap">
          <span class="submit-photo-page-badge">Trang ${idx + 1}</span>
          <img src="${url}" alt="Trang ${idx + 1}">
        </div>
        <div class="submit-photo-actions">
          <button type="button" onclick="App.rotateSubmitPhoto(${idx})" title="Xoay ảnh 90° nếu chụp ngang">
            🔄 Xoay
          </button>
          <button type="button" style="color:var(--danger);" onclick="App.removeSubmitPhoto(${idx})" title="Xóa trang này">
            🗑️ Xóa
          </button>
        </div>
      </div>
    `).join('');
  },

  rotateSubmitPhoto(index) {
    if (!this.currentUploadedPhotos[index]) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedUrl = canvas.toDataURL('image/jpeg', 0.85);
      App.currentUploadedPhotos[index] = rotatedUrl;
      App.renderSubmitPhotosGrid();
    };
    img.src = this.currentUploadedPhotos[index];
  },

  removeSubmitPhoto(index) {
    this.currentUploadedPhotos.splice(index, 1);
    this.renderSubmitPhotosGrid();
    this.showToast('Đã xóa 1 trang bài làm.', 'info');
  },

  clearAllSubmitPhotos() {
    this.currentUploadedPhotos = [];
    this.renderSubmitPhotosGrid();
    this.showToast('Đã xóa tất cả trang bài làm.', 'info');
  },

  confirmStudentSubmission() {
    if (!this.currentSubmittingAssignmentId) return;
    const student = Auth.getCurrentUser();
    if (!student) return;

    if (this.isSubmittingHomework) return;

    if (this.currentUploadedPhotos.length === 0) {
      App.showToast('Vui lòng chụp hoặc chọn ít nhất 1 ảnh bài làm để nộp!', 'warning');
      return;
    }

    this.isSubmittingHomework = true;
    try {
      // Kết thúc phiên giám sát và thu thập bằng chứng rời tab
      let cheatData = { violationCount: 0, totalDuration: 0, logs: [] };
      if (window.AntiCheat) {
        cheatData = AntiCheat.stopMonitoring();
      }

      const photos = this.currentUploadedPhotos;
      const photoUrl = photos[0];
      const noteInput = document.getElementById('submitHomeworkNote');
      const note = noteInput ? noteInput.value.trim() : '';

      const submission = {
        id: 'sub_' + Date.now() + '_' + student.id,
        assignmentId: this.currentSubmittingAssignmentId,
        studentId: student.id,
        studentName: student.name,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        photoUrl: photoUrl,
        photos: photos,
        studentNote: note,
        note: note,
        score: null,
        feedback: '',
        gradedAt: null,
        annotatedPhoto: null,
        annotatedPhotos: [],
        cheatCount: cheatData.violationCount,
        cheatDuration: cheatData.totalDuration,
        cheatLogs: cheatData.logs
      };

      Store.addSubmission(submission);
      
      if (cheatData.violationCount > 0) {
        this.showToast(`Đã nộp ${photos.length} trang bài! Hệ thống ghi nhận ${cheatData.violationCount} lần rời tab (${cheatData.totalDuration}s).`, 'warning');
      } else {
        this.showToast(`✓ Đã nộp thành công ${photos.length} trang bài tập! Hoàn toàn trung thực (0 lần rời tab).`, 'success');
      }

      this.closeModal('submitHomeworkModal');
      this.renderCurrentView();
    } finally {
      setTimeout(() => { this.isSubmittingHomework = false; }, 350);
    }
  },

  // ================= MODAL: XEM BÀI ĐÃ CHẤM (HỖ TRỢ NHIỀU TRANG) =================
  currentReviewZoom: 1.0,
  currentReviewSub: null,
  currentReviewPageIndex: 0,

  openReviewModal(submissionId) {
    const sub = Store.data.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    if (sub.isQuiz && window.Quiz) {
      Quiz.openResultModal(submissionId);
      return;
    }

    this.currentReviewSub = sub;
    this.currentReviewPageIndex = 0;
    this.currentReviewZoom = 1.0;

    const assignment = Store.data.assignments.find(a => a.id === sub.assignmentId);
    document.getElementById('reviewModalTitle').textContent = assignment ? assignment.title : 'Kết Quả Bài Làm';
    document.getElementById('reviewStudentName').textContent = sub.studentName;
    document.getElementById('reviewScoreBadge').textContent = sub.score !== null ? `${sub.score}/10` : 'Chờ chấm';
    document.getElementById('reviewFeedbackText').textContent = sub.feedback || 'Chưa có lời nhận xét từ gia sư.';

    this.renderReviewPage();

    const zoomLabel = document.getElementById('reviewZoomLevel');
    if (zoomLabel) zoomLabel.textContent = '100%';

    const modal = document.getElementById('reviewGradedModal');
    modal.classList.add('active');
  },

  getReviewPages() {
    if (!this.currentReviewSub) return [Store.samplePaperDataUrl];
    const sub = this.currentReviewSub;
    if (Array.isArray(sub.annotatedPhotos) && sub.annotatedPhotos.length > 0) {
      return sub.annotatedPhotos;
    }
    if (Array.isArray(sub.photos) && sub.photos.length > 0) {
      return sub.photos;
    }
    return [sub.annotatedPhoto || sub.photoUrl || Store.samplePaperDataUrl];
  },

  renderReviewPage() {
    const pages = this.getReviewPages();
    const switcher = document.getElementById('reviewPageSwitcher');
    const label = document.getElementById('reviewPageLabel');
    const img = document.getElementById('reviewPaperImg');

    if (switcher && label) {
      if (pages.length > 1) {
        switcher.style.display = 'inline-flex';
        label.textContent = `Trang ${this.currentReviewPageIndex + 1} / ${pages.length}`;
      } else {
        switcher.style.display = 'none';
      }
    }

    if (img) {
      img.src = pages[this.currentReviewPageIndex] || pages[0];
      img.style.transform = `scale(${this.currentReviewZoom})`;
    }
  },

  prevReviewPage() {
    if (this.currentReviewPageIndex > 0) {
      this.currentReviewPageIndex--;
      this.renderReviewPage();
    }
  },

  nextReviewPage() {
    const pages = this.getReviewPages();
    if (this.currentReviewPageIndex < pages.length - 1) {
      this.currentReviewPageIndex++;
      this.renderReviewPage();
    }
  },

  zoomReviewImage(delta) {
    const img = document.getElementById('reviewPaperImg');
    if (!img) return;

    if (delta === 0) {
      this.currentReviewZoom = 1.0;
    } else {
      this.currentReviewZoom = Math.min(3.0, Math.max(0.5, this.currentReviewZoom + delta));
    }

    img.style.transform = `scale(${this.currentReviewZoom})`;
    const zoomLabel = document.getElementById('reviewZoomLevel');
    if (zoomLabel) zoomLabel.textContent = `${Math.round(this.currentReviewZoom * 100)}%`;
  },

  downloadReviewPaper() {
    const img = document.getElementById('reviewPaperImg');
    if (!img || !img.src) return;

    const studentName = (document.getElementById('reviewStudentName')?.textContent || 'HocSinh').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const pageNum = this.getReviewPages().length > 1 ? `_Trang${this.currentReviewPageIndex + 1}` : '';
    const link = document.createElement('a');
    link.download = `BaiCham_${studentName}${pageNum}_${Date.now()}.png`;
    link.href = img.src;
    link.click();
    this.showToast('Đang tải ảnh bài chấm bút đỏ về thiết bị!', 'success');
  },

  // ================= TOAST THÔNG BÁO TỐI GIẢN (CHỐNG TRÙNG LẶP & KHÔNG CHE GIAO DIỆN) =================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const cleanMsg = (message || '').replace(/<[^>]*>/g, '').trim();

    // 1. Chống lặp thông báo: Nếu cùng nội dung đang hiện trên màn hình thì không tạo thêm
    const existing = Array.from(container.querySelectorAll('.toast'));
    if (existing.some(t => t.textContent.includes(cleanMsg))) {
      return;
    }

    // 2. Giới hạn tối đa 2 thông báo trên màn hình: Xóa bớt thông báo cũ nhất
    if (existing.length >= 2) {
      existing[0].remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.style.cursor = 'pointer';
    toast.title = 'Nhấp để đóng nhanh';
    toast.onclick = () => toast.remove();

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  },

  // ================= TƯƠNG TÁC ĐA THIẾT BỊ: MÃ QR CHO ĐIỆN THOẠI =================
  openQRCodeModal(assignmentId) {
    const asn = Store.data.assignments.find(a => a.id === assignmentId);
    const origin = window.location.origin + window.location.pathname;
    const targetUrl = origin;

    const qrTitle = document.getElementById('qrCodeTitle');
    if (qrTitle) qrTitle.textContent = asn ? asn.title : 'EDUTASK - PB';

    const qrInput = document.getElementById('qrCodeUrlInput');
    if (qrInput) qrInput.value = targetUrl;

    const qrImg = document.getElementById('qrCodeImg');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;
    }

    const modal = document.getElementById('qrCodeModal');
    if (modal) modal.classList.add('active');
  },

  copyQrUrl() {
    const input = document.getElementById('qrCodeUrlInput');
    if (input) {
      input.select();
      try {
        navigator.clipboard.writeText(input.value);
        this.showToast('📋 Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
      } catch (e) {
        document.execCommand('copy');
        this.showToast('📋 Đã sao chép liên kết!', 'success');
      }
    }
  },

  // ================= TƯƠNG TÁC ĐA THIẾT BỊ: ÂM THANH THÔNG BÁO TỔNG HỢP =================
  playNotificationSound(type = 'submit') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'grade') {
        // Âm thanh chúc mừng học sinh khi được chấm điểm (Hợp âm tươi sáng)
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else {
        // Âm thanh thông báo nhẹ nhàng cho gia sư khi có học sinh nộp bài
        osc.frequency.setValueAtTime(698.46, audioCtx.currentTime); // F5
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // Bỏ qua nếu trình duyệt chặn audio autoplay
    }
  },

  // ================= TOAST TƯƠNG TÁC ĐA THIẾT BỊ (ACTIONABLE TOAST) =================
  showInteractiveToast(message, actionText = '', actionCallback = null) {
    let toast = document.getElementById('interactiveToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'interactiveToast';
      toast.className = 'interactive-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div class="interactive-toast-content">
        <div class="interactive-toast-msg">${message}</div>
        ${actionText ? `<button class="interactive-toast-btn" id="interactiveToastActionBtn">${actionText}</button>` : ''}
        <button class="interactive-toast-close" onclick="document.getElementById('interactiveToast').classList.remove('active')">&times;</button>
      </div>
    `;

    if (actionText && actionCallback) {
      const btn = document.getElementById('interactiveToastActionBtn');
      if (btn) {
        btn.onclick = () => {
          toast.classList.remove('active');
          actionCallback();
        };
      }
    }

    toast.classList.add('active');
    setTimeout(() => {
      if (toast) toast.classList.remove('active');
    }, 12000);
  },

  // ================= ĐỐI SOÁT & THÔNG BÁO TỨC THÌ GIỮA GIA SƯ VÀ HỌC SINH =================
  checkCrossDeviceNotifications(prevData, newData) {
    if (!prevData || !newData || !Auth.isAuthenticated()) return;
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;

    if (currentUser.role === 'student') {
      // 1. Kiểm tra xem có bài nộp nào của học sinh này vừa được chấm điểm không
      const prevSubs = (prevData.submissions || []).filter(s => s.studentId === currentUser.id);
      const newSubs = (newData.submissions || []).filter(s => s.studentId === currentUser.id);

      newSubs.forEach(newSub => {
        const oldSub = prevSubs.find(s => s.id === newSub.id);
        if ((!oldSub || oldSub.status !== 'graded') && newSub.status === 'graded') {
          const asn = (newData.assignments || []).find(a => a.id === newSub.assignmentId);
          const title = asn ? asn.title : 'Bài tập';
          this.playNotificationSound('grade');
          this.showInteractiveToast(
            `🎉 Thầy/Cô vừa chấm xong: <strong>"${title}"</strong>! Bạn đạt <strong>${newSub.score}/10đ</strong>.`,
            '🔍 Xem Lời Phê & Bút Đỏ',
            () => App.openReviewModal(newSub.id)
          );
        }
      });

      // 2. Kiểm tra xem có bài tập mới nào vừa được giao cho học sinh này không
      const prevAsns = (prevData.assignments || []).filter(a => a.targetStudentIds && a.targetStudentIds.includes(currentUser.id));
      const newAsns = (newData.assignments || []).filter(a => a.targetStudentIds && a.targetStudentIds.includes(currentUser.id));
      newAsns.forEach(newAsn => {
        if (!prevAsns.some(a => a.id === newAsn.id)) {
          this.playNotificationSound('submit');
          this.showInteractiveToast(
            `📚 Thầy/Cô vừa giao bài mới: <strong>"${newAsn.title}"</strong>!`,
            '✍️ Xem Bài Ngay',
            () => App.renderCurrentView()
          );
        }
      });
    } else if (currentUser.role === 'tutor' || currentUser.role === 'admin') {
      // Kiểm tra xem có bài tập nào vừa được học sinh nộp từ điện thoại lên không
      const prevSubs = prevData.submissions || [];
      const newSubs = newData.submissions || [];

      newSubs.forEach(newSub => {
        const oldSub = prevSubs.find(s => s.id === newSub.id);
        if ((!oldSub || oldSub.status !== 'submitted') && newSub.status === 'submitted') {
          const asn = (newData.assignments || []).find(a => a.id === newSub.assignmentId);
          const title = asn ? asn.title : 'Bài tập';
          const std = (newData.users || []).find(u => u.id === newSub.studentId);
          const stdName = std ? std.name : (newSub.studentName || 'Học sinh');

          this.playNotificationSound('submit');
          this.showInteractiveToast(
            `🔔 <strong>${stdName}</strong> vừa nộp ảnh bài làm: <strong>"${title}"</strong>!`,
            '✍️ Mở Bàn Chấm Bút Đỏ',
            () => Grader.open(newSub.id)
          );
        }
      });
    }
  },

  // ================= ĐIỀU HƯỚNG NHANH CHO HỌC SINH TRÊN ĐIỆN THOẠI =================
  handleMobileNavClick(tab) {
    const itemAsn = document.getElementById('mNavAssignments');
    const itemScores = document.getElementById('mNavScores');
    if (tab === 'assignments') {
      if (itemAsn) itemAsn.classList.add('active');
      if (itemScores) itemScores.classList.remove('active');
      const container = document.querySelector('.assignment-grid');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (tab === 'scores') {
      if (itemScores) itemScores.classList.add('active');
      if (itemAsn) itemAsn.classList.remove('active');
      const banner = document.querySelector('.view-banner');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.App = App;
}

// Khởi chạy khi tài liệu tải xong (hỗ trợ cả trường hợp DOM đã tải trước)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}

