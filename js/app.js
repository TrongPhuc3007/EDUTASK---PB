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
        actionsEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge" style="background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; font-size:12px; padding:5px 12px; font-weight:700;">
              🔒 Hệ Thống Bảo Mật
            </span>
          </div>
        `;
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
        const isTutActive = activeUser.id === 'u_tutor';
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
  },

  renderCurrentView() {
    try {
      const container = document.getElementById('viewContainer');
      if (!container) return;

      if (!Auth.isAuthenticated()) {
        // Hiển thị Màn Hình 3 Cổng Đăng Nhập Phân Quyền
        GatewayView.render(container);
        return;
      }

      const activeUser = Auth.getCurrentUser();
      if (!activeUser) {
        GatewayView.render(container);
        return;
      }

      if (activeUser.role === 'admin') {
        AdminView.render(container);
      } else if (activeUser.role === 'tutor') {
        TutorView.render(container);
      } else if (activeUser.role === 'student') {
        StudentView.render(container);
      } else if (activeUser.role === 'parent') {
        ParentView.render(container);
      }
    } catch (err) {
      console.error("Lỗi khi hiển thị trang:", err);
      const container = document.getElementById('viewContainer');
      if (container) {
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

  // ================= MODAL: TẠO BÀI TẬP CÁ NHÂN HÓA =================
  currentAssignmentAttachment: null,

  openCreateAssignmentModal(targetStudentId = null) {
    const modal = document.getElementById('createAssignmentModal');
    if (!modal) return;

    const user = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = user ? user.id : 'u_tutor';
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

    const targetTypeSelect = document.getElementById('newAsnTargetType');
    if (targetStudentId) {
      targetTypeSelect.value = 'individual';
      document.getElementById('studentPickerContainer').style.display = 'block';
    } else {
      targetTypeSelect.value = 'individual';
      document.getElementById('studentPickerContainer').style.display = 'block';
    }

    // Đặt hạn nộp mặc định là 2 ngày sau lúc 21h
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(21, 0, 0, 0);
    const deadlineString = now.toISOString().slice(0, 16);
    document.getElementById('newAsnDeadline').value = deadlineString;

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

    if (!prompt || !card) return;

    if (this.currentAssignmentAttachment) {
      prompt.style.display = 'none';
      card.style.display = 'flex';
      if (nameEl) nameEl.textContent = this.currentAssignmentAttachment.name;
      if (sizeEl) sizeEl.textContent = this.currentAssignmentAttachment.size;
      if (iconEl) {
        const ext = this.currentAssignmentAttachment.name.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) iconEl.textContent = '📕';
        else if (['doc', 'docx'].includes(ext)) iconEl.textContent = '📘';
        else if (['xls', 'xlsx'].includes(ext)) iconEl.textContent = '📗';
        else if (['png', 'jpg', 'jpeg'].includes(ext)) iconEl.textContent = '🖼️';
        else if (['zip', 'rar'].includes(ext)) iconEl.textContent = '📦';
        else iconEl.textContent = '📄';
      }
    } else {
      prompt.style.display = 'flex';
      card.style.display = 'none';
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

  closeModal(modalId) {
    if (modalId === 'submitHomeworkModal' && window.AntiCheat && AntiCheat.isMonitoring) {
      AntiCheat.stopMonitoring();
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
    const currentTutorId = tutor ? tutor.id : 'u_tutor';
    const availableStudents = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    // Lấy danh sách học sinh được chọn
    let targetStudentIds = [];
    if (targetType === 'individual') {
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
      targetStudentIds,
      deadline,
      createdAt: new Date().toISOString(),
      totalPoints: 10,
      status: 'waiting_submission',
      submissionType
    };

    Store.addAssignment(newAssignment);
    const attachMsg = this.currentAssignmentAttachment ? ` (có đính kèm "${this.currentAssignmentAttachment.name}")` : '';
    this.showToast(`Đã giao bài tập thành công cho ${targetStudentIds.length} học sinh${attachMsg}!`, 'success');
    this.closeModal('createAssignmentModal');
    this.renderCurrentView();
  },

  // ================= MODAL: HỌC SINH NỘP BÀI =================
  currentUploadedPhotoUrl: null,

  openSubmitModal(assignmentId) {
    this.currentSubmittingAssignmentId = assignmentId;
    this.currentUploadedPhotoUrl = null;

    const assignment = Store.data.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    document.getElementById('submitModalTitle').textContent = `Nộp Bài: ${assignment.title}`;
    
    const fileInput = document.getElementById('submitFileInput');
    if (fileInput) fileInput.value = '';

    const previewBox = document.getElementById('submitFilePreview');
    if (previewBox) previewBox.style.display = 'none';

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
    const file = event.target.files && event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        // Tối ưu hóa dung lượng ảnh chụp từ điện thoại để đồng bộ Realtime siêu tốc
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

          App.currentUploadedPhotoUrl = compressedDataUrl;
          const previewBox = document.getElementById('submitFilePreview');
          const previewImg = document.getElementById('submitPreviewImg');
          if (previewBox && previewImg) {
            previewImg.src = compressedDataUrl;
            previewBox.style.display = 'block';
          }
        };
        img.onerror = () => {
          App.currentUploadedPhotoUrl = rawDataUrl;
          const previewBox = document.getElementById('submitFilePreview');
          const previewImg = document.getElementById('submitPreviewImg');
          if (previewBox && previewImg) {
            previewImg.src = rawDataUrl;
            previewBox.style.display = 'block';
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  },

  confirmStudentSubmission() {
    if (!this.currentSubmittingAssignmentId) return;
    const student = Auth.getCurrentUser();
    if (!student) return;

    // Kết thúc phiên giám sát và thu thập bằng chứng rời tab
    let cheatData = { violationCount: 0, totalDuration: 0, logs: [] };
    if (window.AntiCheat) {
      cheatData = AntiCheat.stopMonitoring();
    }

    const photoUrl = this.currentUploadedPhotoUrl || Store.samplePaperDataUrl;
    const noteInput = document.getElementById('submitHomeworkNote');
    const note = noteInput ? noteInput.value.trim() : '';

    const submission = {
      id: 'sub_' + Date.now(),
      assignmentId: this.currentSubmittingAssignmentId,
      studentId: student.id,
      studentName: student.name,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      photoUrl: photoUrl,
      studentNote: note,
      score: null,
      feedback: '',
      gradedAt: null,
      annotatedPhoto: null,
      cheatCount: cheatData.violationCount,
      cheatDuration: cheatData.totalDuration,
      cheatLogs: cheatData.logs
    };

    Store.addSubmission(submission);
    
    if (cheatData.violationCount > 0) {
      this.showToast(`Đã nộp bài! Hệ thống ghi nhận ${cheatData.violationCount} lần rời tab (${cheatData.totalDuration}s) và đã báo cho gia sư.`, 'warning');
    } else {
      this.showToast('Đã nộp bài tập thành công! Bài làm hoàn toàn trung thực (0 lần rời tab).', 'success');
    }

    this.closeModal('submitHomeworkModal');
    this.renderCurrentView();
  },

  // ================= MODAL: XEM BÀI ĐÃ CHẤM =================
  currentReviewZoom: 1.0,

  openReviewModal(submissionId) {
    const sub = Store.data.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    this.currentReviewZoom = 1.0;
    const assignment = Store.data.assignments.find(a => a.id === sub.assignmentId);
    document.getElementById('reviewModalTitle').textContent = assignment ? assignment.title : 'Kết Quả Bài Làm';
    document.getElementById('reviewStudentName').textContent = sub.studentName;
    document.getElementById('reviewScoreBadge').textContent = sub.score !== null ? `${sub.score}/10` : 'Chờ chấm';
    document.getElementById('reviewFeedbackText').textContent = sub.feedback || 'Chưa có lời nhận xét từ gia sư.';
    
    const img = document.getElementById('reviewPaperImg');
    if (img) {
      img.src = sub.annotatedPhoto || sub.photoUrl || Store.samplePaperDataUrl;
      img.style.transform = 'scale(1)';
    }

    const zoomLabel = document.getElementById('reviewZoomLevel');
    if (zoomLabel) zoomLabel.textContent = '100%';

    const modal = document.getElementById('reviewGradedModal');
    modal.classList.add('active');
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
    const link = document.createElement('a');
    link.download = `BaiCham_${studentName}_${Date.now()}.png`;
    link.href = img.src;
    link.click();
    this.showToast('Đang tải ảnh bài chấm bút đỏ về thiết bị!', 'success');
  },

  // ================= TOAST THÔNG BÁO =================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Khởi chạy khi tài liệu tải xong
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
