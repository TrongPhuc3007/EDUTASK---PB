/**
 * EDUTASK PRO — ADMIN MODULE (CẤP 1: QUẢN TRỊ VIÊN)
 * Quản lý học sinh kèm với đầy đủ thông tin chuyên sâu (Thông tin cá nhân, Phụ huynh, Lỗ hổng, Học phí & Lịch học)
 */

const AdminView = {
  render(container) {
    const students = Store.getStudents();
    const tutors = Store.getTutors();
    const assignments = Store.getAllAssignments();
    const submissions = Store.data.submissions;
    const pendingGradingCount = submissions.filter(s => s.status === 'submitted').length;

    // Tính tổng học phí dự kiến trong tháng
    let totalTuition = 0;
    students.forEach(s => {
      totalTuition += (s.feePerSession || 200000) * (s.totalSessions || 0);
    });

    container.innerHTML = `
      <!-- Banner Quản Trị Cá Nhân -->
      <div class="view-banner">
        <div class="banner-info">
          <h2>Bàn Quản Trị Hệ Thống (Admin)</h2>
          <p>Quản lý danh sách học sinh kèm với hồ sơ chi tiết, theo dõi học phí & lịch học kèm.</p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-white" onclick="AdminView.openAddStudentModal()">
            ➕ Thêm Học Sinh Mới
          </button>
          <button class="btn btn-secondary" onclick="AdminView.openAddTutorModal()">
            👨‍🏫 Thêm Gia Sư Mới
          </button>
          <button class="btn btn-secondary" onclick="App.openAdminPickTutorModal()" title="Toàn quyền Admin: Chọn và xem trực tiếp bàn làm việc của Gia sư">
            👀 Giám Sát Bàn Gia Sư ▾
          </button>
        </div>
      </div>

      <!-- Thẻ Chỉ Số Quản Lý -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box metric-blue">🎒</div>
          <div class="metric-data">
            <h4>${students.length}</h4>
            <span>Học sinh kèm</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box" style="background:#e0e7ff; color:#4338ca;">👨‍🏫</div>
          <div class="metric-data">
            <h4>${tutors.length}</h4>
            <span>Gia sư trực tiếp</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box metric-purple">📋</div>
          <div class="metric-data">
            <h4>${assignments.length}</h4>
            <span>Bài tập đã giao</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box metric-yellow">⏳</div>
          <div class="metric-data">
            <h4>${pendingGradingCount}</h4>
            <span>Bài nộp chờ chấm</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box metric-green">💰</div>
          <div class="metric-data">
            <h4 style="font-size:${totalTuition >= 10000000 ? '22px' : '26px'};">${totalTuition.toLocaleString('vi-VN')} đ</h4>
            <span>Học phí tháng này</span>
          </div>
        </div>
      </div>

      <!-- Bảng Quản Lý Học Sinh Kèm Chi Tiết -->
      <div class="content-card">
        <div class="card-header">
          <h3>🎒 Danh Sách Học Sinh Kèm & Phân Công Giáo Viên (${students.length} em)</h3>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddStudentModal()">
            ➕ Thêm học sinh
          </button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Học Sinh & Trường Lớp</th>
                <th>Giáo Viên Phụ Trách</th>
                <th>Tài Khoản Đăng Nhập</th>
                <th>Phụ Huynh & SĐT</th>
                <th>Mục Tiêu & Học Lực</th>
                <th>Lịch Học Kèm</th>
                <th>Học Phí / Buổi</th>
                <th>Tháng Này</th>
                <th style="text-align:center;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(std => {
                const sessionFee = std.feePerSession || 200000;
                const sessions = std.totalSessions || 0;
                const total = sessionFee * sessions;
                const schoolInfo = std.school ? `${std.grade} • ${std.school}` : std.grade;
                const hasAcc = std.hasAccount === true && std.accountStatus === 'active';
                const tutors = Store.getTutors();

                return `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <div class="user-avatar" style="width:34px; height:34px; font-size:12px; flex-shrink:0;">
                          ${std.avatarText || std.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style="font-size:14px; color:var(--text-main);">${std.name}</strong>
                          ${std.gender ? `<small style="color:var(--text-muted);"> (${std.gender})</small>` : ''}
                          <div style="font-size:11.5px; color:var(--primary); font-family:var(--font-mono); font-weight:700; margin-top:1px;">
                            TK: ${std.username || 'Chưa cấp'}
                          </div>
                          <small style="color:var(--text-muted); font-weight:600;">${schoolInfo}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex; flex-direction:column; gap:6px;">
                        <span class="badge" style="background:#ede9fe; color:#6d28d9; border:1px solid #ddd6fe; font-size:12px; font-weight:700; width:fit-content;">
                          👨‍🏫 ${std.assignedTutorName || 'Chưa phân công'}
                        </span>
                        <select class="quick-tutor-select" onchange="AdminView.handleQuickAssignTutor('${std.id}', this.value)" title="Đổi giáo viên phụ trách cho học sinh này" style="font-size:11.5px; padding:3px 6px; border-radius:6px; border:1px solid #cbd5e1; background:#ffffff; color:#334155; max-width:165px; cursor:pointer;">
                          ${tutors.map(t => `
                            <option value="${t.id}" ${t.id === std.assignedTutorId ? 'selected' : ''}>
                              ${t.name}
                            </option>
                          `).join('')}
                        </select>
                      </div>
                    </td>
                    <td>
                      ${hasAcc ? `
                        <span class="badge badge-success" style="display:inline-flex; align-items:center; gap:4px; font-weight:600;">
                          ✓ Đã cấp TK
                        </span>
                        <div style="margin-top:4px; display:flex; align-items:center; gap:6px;">
                          <code style="font-size:12px; font-weight:700; color:#1e40af; background:#dbeafe; padding:2px 6px; border-radius:4px;">${std.username}</code>
                          <button class="btn btn-xs btn-outline" onclick="AdminView.openManageAccountModal('${std.id}')" title="Quản lý tài khoản / Đổi mật khẩu" style="padding:2px 6px; font-size:11px;">
                            🔑 Đổi MK
                          </button>
                        </div>
                      ` : `
                        <span class="badge" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
                          🔒 Chưa cấp TK
                        </span>
                        <div style="margin-top:4px;">
                          <button class="btn btn-xs btn-primary" onclick="AdminView.openManageAccountModal('${std.id}')" style="padding:3px 8px; font-size:11.5px;">
                            ➕ Cấp TK ngay
                          </button>
                        </div>
                      `}
                    </td>
                    <td>
                      <strong>${std.parentName || 'Chưa cập nhật'}</strong><br>
                      <small style="color:var(--text-muted);">${std.parentPhone || std.phone}</small>
                    </td>
                    <td>
                      <span class="badge badge-success">${std.currentScore} ➔ ${std.targetScore}đ</span><br>
                      <small style="color:var(--text-muted);">${std.subject || 'Toán THPT'}</small>
                    </td>
                    <td>
                      <span style="font-size:12.5px; color:#334155;">${std.schedule || 'Chưa xếp lịch'}</span><br>
                      <small style="color:var(--text-muted);">${std.learningMode || '1 kèm 1'}</small>
                    </td>
                    <td>${sessionFee.toLocaleString('vi-VN')} đ</td>
                    <td>
                      <strong>${sessions} buổi</strong><br>
                      <strong style="color:var(--primary);">${total.toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td style="text-align:center;">
                      <div style="display:inline-flex; gap:6px;">
                        <button class="btn btn-sm btn-outline" title="Xem hồ sơ chi tiết" onclick="AdminView.openStudentProfileModal('${std.id}')">
                          👁️ Hồ Sơ
                        </button>
                        <button class="btn btn-sm btn-primary" title="Toàn quyền Admin: Xem trực tiếp bàn học sinh này" onclick="Auth.adminSupervise('${std.id}')">
                          🎒 Bàn Học
                        </button>
                        <button class="btn btn-sm btn-outline" title="Quản lý tài khoản đăng nhập" onclick="AdminView.openManageAccountModal('${std.id}')">
                          🔑 TK
                        </button>
                        <button class="btn btn-sm btn-danger" title="Xóa học sinh" onclick="AdminView.confirmDeleteStudent('${std.id}', '${std.name}')">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bảng Quản Lý Đội Ngũ Gia Sư & Tài Khoản Giảng Dạy -->
      <div class="content-card">
        <div class="card-header">
          <h3>👨‍🏫 Đội Ngũ Gia Sư & Tài Khoản Giảng Dạy (${tutors.length} thầy cô)</h3>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddTutorModal()">
            ➕ Thêm gia sư mới
          </button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thầy Cô & Môn Dạy</th>
                <th>Tài Khoản Đăng Nhập</th>
                <th>Liên Hệ (SĐT / Email)</th>
                <th>Trình Độ / Bằng Cấp</th>
                <th>Học Sinh Phụ Trách</th>
                <th style="text-align:center;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${tutors.map(tut => {
                const myStudents = Store.getStudentsByTutor(tut.id);
                const myAssignments = Store.getAllAssignments().filter(a => a.tutorId === tut.id || (a.targetStudentIds && a.targetStudentIds.some(sid => myStudents.some(s => s.id === sid))));
                const subjects = Array.isArray(tut.subjects) ? tut.subjects.join(', ') : (tut.subjects || 'Toán THPT');
                return `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <div class="user-avatar" style="width:36px; height:36px; font-size:13px; background:linear-gradient(135deg, #6366f1, #4f46e5);">${tut.avatarText || 'GS'}</div>
                        <div>
                          <strong style="font-size:14px; color:var(--text-main);">${tut.name}</strong>
                          <span style="font-size:11.5px; color:#64748b; display:block;">${tut.gender || 'Gia sư'} • ${subjects}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <code style="font-size:12px; font-weight:700; color:#4338ca; background:#e0e7ff; padding:2px 8px; border-radius:4px;">${tut.username}</code>
                        <button class="btn btn-xs btn-outline" onclick="AdminView.openManageTutorAccountModal('${tut.id}')" title="Đổi mật khẩu tài khoản gia sư" style="padding:2px 6px; font-size:11px;">
                          🔑 Đổi MK
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style="font-weight:600; color:#334155;">📞 ${tut.phone || 'Chưa cập nhật'}</span><br>
                      <small style="color:var(--text-muted);">${tut.email || 'Chưa có email'}</small>
                    </td>
                    <td>
                      <span style="font-size:12.5px; color:#475569;">${tut.degree || 'Giáo viên giàu kinh nghiệm'}</span>
                    </td>
                    <td>
                      <div style="display:flex; flex-direction:column; gap:4px;">
                        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                          <span class="badge badge-primary" style="font-size:11.5px;">
                            🎒 ${myStudents.length} học sinh
                          </span>
                          <span class="badge" style="background:#e0e7ff; color:#4338ca; font-size:11.5px;">
                            📋 ${myAssignments.length} đề bài
                          </span>
                        </div>
                        <small style="display:block; color:var(--text-muted); font-size:11px;">
                          ${myStudents.map(s => s.name).slice(0, 2).join(', ')}${myStudents.length > 2 ? '...' : ''}
                        </small>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <div style="display:inline-flex; gap:6px;">
                        <button class="btn btn-sm btn-primary" title="Toàn quyền Admin: Xem trực tiếp bàn làm việc gia sư này" onclick="Auth.adminSupervise('${tut.id}')">
                          👀 Bàn Dạy
                        </button>
                        <button class="btn btn-sm btn-danger" title="Xóa gia sư" onclick="AdminView.confirmDeleteTutor('${tut.id}', '${tut.name}')">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Khu vực Công Cụ Quản Trị Hệ Thống -->
      <div class="content-card">
        <div class="card-header">
          <h3>⚙️ Quản Trị & Sao Lưu Dữ Liệu</h3>
        </div>
        <div class="card-body" style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-primary" onclick="CloudSync.openModal()" style="font-weight:700;">
            ☁️ Đồng Bộ Đám Mây (Kết Nối Điện Thoại & PC)
          </button>
          <button class="btn btn-outline" onclick="AdminView.exportBackup()">
            💾 Sao Lưu Dữ Liệu Ra File (Backup JSON)
          </button>
          <button class="btn btn-danger" onclick="AdminView.resetToDefault()">
            🔄 Đặt Lại Dữ Liệu Hệ Thống
          </button>
        </div>
      </div>
    `;
  },

  openAddStudentModal() {
    // Reset form fields
    const nameInput = document.getElementById('stdFormName');
    nameInput.value = '';
    document.getElementById('stdFormGender').value = 'Nam';
    document.getElementById('stdFormDob').value = '2008-01-01';
    document.getElementById('stdFormSchool').value = '';
    document.getElementById('stdFormGrade').value = 'Lớp 12';
    document.getElementById('stdFormPhone').value = '';
    document.getElementById('stdFormAddress').value = '';
    document.getElementById('stdFormParentName').value = '';
    document.getElementById('stdFormParentPhone').value = '';
    document.getElementById('stdFormParentJob').value = '';
    document.getElementById('stdFormSubject').value = 'Toán Học 12';
    document.getElementById('stdFormInitialScore').value = '5.5';
    document.getElementById('stdFormTargetScore').value = '8.5';
    document.getElementById('stdFormWeaknesses').value = '';
    document.getElementById('stdFormStrengths').value = '';
    document.getElementById('stdFormNotes').value = '';
    document.getElementById('stdFormFee').value = '250000';
    document.getElementById('stdFormMode').value = '1 kèm 1 tại nhà';
    document.getElementById('stdFormSchedule').value = '';
    document.getElementById('stdFormStartDate').value = new Date().toISOString().slice(0, 10);

    // Cập nhật danh sách giáo viên / gia sư phụ trách
    const tutorSelect = document.getElementById('stdFormAssignedTutor');
    if (tutorSelect) {
      const tutors = Store.getTutors();
      tutorSelect.innerHTML = tutors.map(t => `
        <option value="${t.id}">${t.name} (${t.phone || 'Gia Sư'})</option>
      `).join('');
    }

    // Reset thông tin cấp tài khoản
    const hasAccCheck = document.getElementById('stdFormHasAccount');
    if (hasAccCheck) hasAccCheck.checked = true;
    const uInput = document.getElementById('stdFormUsername');
    if (uInput) uInput.value = '';
    const pInput = document.getElementById('stdFormPassword');
    if (pInput) pInput.value = '123456';
    this.toggleAccountFormSection();

    // Tự sinh username khi gõ tên học sinh
    nameInput.oninput = () => {
      if (hasAccCheck && hasAccCheck.checked && uInput) {
        uInput.value = this.generateUsernameFromName(nameInput.value);
      }
    };

    const modal = document.getElementById('addStudentModal');
    if (modal) modal.classList.add('active');
  },

  toggleAccountFormSection() {
    const check = document.getElementById('stdFormHasAccount');
    const fields = document.getElementById('stdFormAccountFields');
    if (fields && check) {
      fields.style.display = check.checked ? 'grid' : 'none';
    }
  },

  generateUsernameFromName(fullName) {
    if (!fullName || !fullName.trim()) return 'std_' + Math.floor(Math.random() * 900 + 100);
    // Chuẩn hóa loại bỏ dấu tiếng Việt
    const clean = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
    const words = clean.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'std_' + Date.now().toString().slice(-4);
    if (words.length === 1) return 'std_' + words[0];
    const lastName = words[words.length - 1];
    const initials = words.slice(0, -1).map(w => w[0]).join('');
    return 'std_' + initials + lastName;
  },

  submitAddStudent() {
    const name = document.getElementById('stdFormName').value.trim();
    const parentPhone = document.getElementById('stdFormParentPhone').value.trim();

    if (!name) {
      App.showToast('Vui lòng nhập họ và tên học sinh!', 'error');
      return;
    }
    if (!parentPhone) {
      App.showToast('Vui lòng nhập số điện thoại phụ huynh để liên hệ!', 'error');
      return;
    }

    const hasAccount = document.getElementById('stdFormHasAccount') ? document.getElementById('stdFormHasAccount').checked : true;
    let username = '';
    let password = '';
    if (hasAccount) {
      const uField = document.getElementById('stdFormUsername');
      username = (uField && uField.value.trim()) || this.generateUsernameFromName(name);
      const pField = document.getElementById('stdFormPassword');
      password = (pField && pField.value.trim()) || '123456';
    }

    const assignedTutorId = document.getElementById('stdFormAssignedTutor')?.value || 'u_tutor';
    const tutor = Store.getUserById(assignedTutorId);
    const assignedTutorName = tutor ? tutor.name : 'Thầy Minh Đức';

    const newStudent = {
      id: 'u_std_' + Date.now(),
      hasAccount: hasAccount,
      accountStatus: hasAccount ? 'active' : 'none',
      username: username,
      password: password,
      accountCreatedAt: hasAccount ? new Date().toISOString() : null,
      name: name,
      role: 'student',
      roleName: 'Học Sinh',
      assignedTutorId: assignedTutorId,
      assignedTutorName: assignedTutorName,
      gender: document.getElementById('stdFormGender').value,
      dob: document.getElementById('stdFormDob').value,
      school: document.getElementById('stdFormSchool').value.trim(),
      grade: document.getElementById('stdFormGrade').value.trim() || 'Lớp 12',
      phone: document.getElementById('stdFormPhone').value.trim() || 'Chưa cập nhật',
      address: document.getElementById('stdFormAddress').value.trim(),
      parentName: document.getElementById('stdFormParentName').value.trim(),
      parentPhone: parentPhone,
      parentJob: document.getElementById('stdFormParentJob').value.trim(),
      subject: document.getElementById('stdFormSubject').value.trim() || 'Toán Học',
      initialScore: parseFloat(document.getElementById('stdFormInitialScore').value) || 5.0,
      targetScore: parseFloat(document.getElementById('stdFormTargetScore').value) || 8.5,
      currentScore: parseFloat(document.getElementById('stdFormInitialScore').value) || 5.0,
      weaknesses: document.getElementById('stdFormWeaknesses').value.trim(),
      strengths: document.getElementById('stdFormStrengths').value.trim(),
      notes: document.getElementById('stdFormNotes').value.trim(),
      feePerSession: parseInt(document.getElementById('stdFormFee').value) || 250000,
      learningMode: document.getElementById('stdFormMode').value,
      schedule: document.getElementById('stdFormSchedule').value.trim(),
      startDate: document.getElementById('stdFormStartDate').value,
      totalSessions: 0,
      avatarText: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    };

    Store.addStudent(newStudent);
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }
    App.closeModal('addStudentModal');
    App.updateHeaderProfile();
    App.renderCurrentView();

    if (hasAccount) {
      App.showToast(`🎉 Đã thêm học sinh ${newStudent.name} (phụ trách bởi ${assignedTutorName}) & cấp TK "${username}" thành công (Đã đồng bộ Cloud)!`, 'success');
    } else {
      App.showToast(`Đã thêm học sinh ${newStudent.name} (phụ trách bởi ${assignedTutorName}) vào danh sách quản lý.`, 'info');
    }
  },

  openStudentProfileModal(studentId) {
    const std = Store.getUserById(studentId);
    if (!std) return;

    document.getElementById('profAvatar').textContent = std.avatarText || std.name.slice(0, 2).toUpperCase();
    document.getElementById('profName').textContent = std.name;
    const profUserEl = document.getElementById('profUsernameSub');
    if (profUserEl) {
      profUserEl.textContent = std.hasAccount ? `Tài khoản đăng nhập: ${std.username}` : 'Chưa cấp tài khoản';
    }
    document.getElementById('profSubTitle').textContent = `${std.grade} • ${std.school || 'Chưa cập nhật trường'}`;

    const hasAcc = std.hasAccount === true && std.accountStatus === 'active';
    const cheatSummary = Store.getStudentCheatSummary ? Store.getStudentCheatSummary(studentId) : { totalViolations: 0, totalDuration: 0, submissionsWithCheating: 0 };
    const body = document.getElementById('profContentBody');
    body.innerHTML = `
      <!-- Thẻ Tóm Tắt Nhanh -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
        <div style="background:#eef2ff; border-radius:10px; padding:12px; border:1px solid #c7d2fe;">
          <small style="color:#4338ca; font-weight:700; text-transform:uppercase; font-size:11px;">Mục Tiêu Điểm Số</small>
          <div style="font-size:20px; font-weight:800; color:#312e81; margin-top:2px;">
            ${std.currentScore || std.initialScore} ➔ ${std.targetScore}
          </div>
        </div>
        <div style="background:#ecfdf5; border-radius:10px; padding:12px; border:1px solid #a7f3d0;">
          <small style="color:#065f46; font-weight:700; text-transform:uppercase; font-size:11px;">Học Phí Mỗi Buổi</small>
          <div style="font-size:20px; font-weight:800; color:#064e3b; margin-top:2px;">
            ${(std.feePerSession || 250000).toLocaleString('vi-VN')} đ
          </div>
        </div>
        <div style="background:#fffbeb; border-radius:10px; padding:12px; border:1px solid #fde68a;">
          <small style="color:#92400e; font-weight:700; text-transform:uppercase; font-size:11px;">Số Buổi Tháng Này</small>
          <div style="font-size:20px; font-weight:800; color:#78350f; margin-top:2px;">
            ${std.totalSessions || 0} buổi (${((std.feePerSession || 250000) * (std.totalSessions || 0)).toLocaleString('vi-VN')} đ)
          </div>
        </div>
      </div>

      <!-- Khối Giám Sát Chống Gian Lận & Độ Trung Thực (Anti-Cheat) -->
      <div style="background:${cheatSummary.totalViolations > 0 ? '#fff1f2' : '#f0fdf4'}; border:1px solid ${cheatSummary.totalViolations > 0 ? '#fecdd3' : '#bbf7d0'}; border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="font-size:14.5px; color:${cheatSummary.totalViolations > 0 ? '#9f1239' : '#166534'}; margin:0; display:flex; align-items:center; gap:8px;">
            🛡️ Báo Cáo Kỷ Luật & Giám Sát Rời Màn Hình (Task Ngoài)
          </h4>
          <span class="badge ${cheatSummary.totalViolations > 0 ? 'badge-danger' : 'badge-success'}">
            ${cheatSummary.totalViolations > 0 ? `⚠️ ${cheatSummary.totalViolations} lần vi phạm` : '🛡️ Chuẩn mực (100% trung thực)'}
          </span>
        </div>
        <div style="font-size:13px; color:${cheatSummary.totalViolations > 0 ? '#881337' : '#14532d'}; line-height:1.6;">
          ${cheatSummary.totalViolations > 0 
            ? `• Đã phát hiện <strong>${cheatSummary.totalViolations} lần</strong> rời bài làm sang tab khác hoặc ứng dụng ngoài (tổng cộng <strong>${cheatSummary.totalDuration}s</strong>) trong <strong>${cheatSummary.submissionsWithCheating} bài nộp</strong>.<br>• Gia sư có thể xem chi tiết từng lần vi phạm tại danh sách bài tập hoặc trong bàn chấm bút đỏ.`
            : `• Học sinh chưa từng có hành vi rời tab làm bài để tra cứu AI hoặc tài liệu ngoài không cho phép.<br>• Đánh giá ý thức tự giác làm bài: Rất tốt & Nghiêm túc.`}
        </div>
      </div>

      <!-- Khối Phân Công Giáo Viên / Gia Sư Phụ Trách -->
      <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="font-size:14.5px; color:#5b21b6; margin:0; display:flex; align-items:center; gap:8px;">
            👨‍🏫 Phân Công Giáo Viên / Gia Sư Phụ Trách
          </h4>
          <span class="badge" style="background:#ede9fe; color:#6d28d9; font-weight:700;">
            ${std.assignedTutorName || 'Chưa phân công'}
          </span>
        </div>
        <div style="font-size:13px; color:#4c1d95; line-height:1.6; margin-bottom:10px;">
          • Giáo viên hiện tại: <strong>${std.assignedTutorName || 'Chưa phân công'}</strong><br>
          • Học sinh sẽ thuộc bàn làm việc của giáo viên này để giao bài 1–1 và chấm bài Canvas bút đỏ.
        </div>
        ${Auth.isRealAdmin() ? `
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:#ffffff; padding:10px 12px; border-radius:8px; border:1px solid #c4b5fd;">
            <label style="font-size:12.5px; font-weight:700; color:#5b21b6;">Đổi giáo viên phụ trách:</label>
            <select id="profReassignTutorSelect" class="form-control" style="max-width:200px; padding:4px 8px; font-size:13px;">
              ${Store.getTutors().map(t => `
                <option value="${t.id}" ${t.id === std.assignedTutorId ? 'selected' : ''}>${t.name}</option>
              `).join('')}
            </select>
            <button class="btn btn-sm btn-primary" onclick="AdminView.submitReassignTutorFromModal('${std.id}')">
              ✓ Lưu Chuyển Giáo Viên
            </button>
            <button class="btn btn-sm btn-outline" onclick="App.closeModal('studentProfileModal'); Auth.adminSupervise('${std.assignedTutorId || 'u_tutor'}')">
              👁️ Xem Bàn Gia Sư Này
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Khối Quyền Lợi: Tài Khoản Đăng Nhập Chính Thức (Chỉ Admin Toàn Quyền Mới Thấy) -->
      ${Auth.isRealAdmin() ? `
        <div style="background:${hasAcc ? '#f0fdf4' : '#fff1f2'}; border:1px solid ${hasAcc ? '#bbf7d0' : '#fecdd3'}; border-radius:12px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="font-size:14.5px; color:${hasAcc ? '#166534' : '#9f1239'}; margin:0; display:flex; align-items:center; gap:8px;">
              🔐 Tài Khoản Đăng Nhập & Giao Diện Học Sinh
            </h4>
            <span class="badge ${hasAcc ? 'badge-success' : 'badge-danger'}">
              ${hasAcc ? '✅ Đã kích hoạt chính thức' : '🔒 Chưa cấp tài khoản'}
            </span>
          </div>
          ${hasAcc ? `
            <div style="font-size:13px; color:#14532d; line-height:1.6;">
              • Tên đăng nhập: <strong style="font-family:monospace; font-size:14px; color:#1e40af; background:#dbeafe; padding:2px 8px; border-radius:4px;">${std.username}</strong><br>
              • Mật khẩu: <span style="font-family:monospace; background:#ffffff; padding:2px 8px; border-radius:4px; border:1px solid #cbd5e1;">${std.password || '123456'}</span><br>
              • Trạng thái: Học sinh có quyền đăng nhập vào bàn làm bài.
            </div>
            <div style="margin-top:10px;">
              <button class="btn btn-outline btn-sm" onclick="App.closeModal('studentProfileModal'); AdminView.openManageAccountModal('${std.id}')">
                🔑 Đổi Mật Khẩu / Quản Lý Tài Khoản
              </button>
            </div>
          ` : `
            <div style="font-size:13px; color:#881337; line-height:1.5;">
              Học sinh này chưa có tài khoản chính thức. Học sinh chưa thể đăng nhập vào bàn học.
            </div>
            <div style="margin-top:10px;">
              <button class="btn btn-primary btn-sm" onclick="App.closeModal('studentProfileModal'); AdminView.openManageAccountModal('${std.id}')">
                ➕ Cấp Tài Khoản Chính Thức Ngay
              </button>
            </div>
          `}
        </div>
      ` : ''}

      <!-- Khối 1: Thông tin cá nhân & Liên hệ -->
      <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:16px;">
        <h4 style="font-size:14.5px; color:var(--primary); margin-bottom:10px;">👤 Thông Tin Cá Nhân & Liên Hệ</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13.5px;">
          <div>• <strong>Giới tính:</strong> ${std.gender || 'Chưa cập nhật'}</div>
          <div>• <strong>Ngày sinh:</strong> ${std.dob || 'Chưa cập nhật'}</div>
          <div>• <strong>SĐT Học sinh:</strong> ${std.phone || 'Chưa cập nhật'}</div>
          <div>• <strong>Trường học:</strong> ${std.school || 'Chưa cập nhật'}</div>
          <div style="grid-column:1/-1;">• <strong>Địa chỉ nhà:</strong> ${std.address || 'Chưa cập nhật'}</div>
        </div>
      </div>

      <!-- Khối 2: Thông tin Phụ huynh -->
      <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:16px;">
        <h4 style="font-size:14.5px; color:var(--primary); margin-bottom:10px;">👨‍👩‍👧 Thông Tin Phụ Huynh</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13.5px;">
          <div>• <strong>Họ tên:</strong> ${std.parentName || 'Chưa cập nhật'}</div>
          <div>• <strong>SĐT (nhận Zalo):</strong> <strong style="color:var(--primary);">${std.parentPhone || 'Chưa cập nhật'}</strong></div>
          <div style="grid-column:1/-1;">• <strong>Nghề nghiệp / Ghi chú:</strong> ${std.parentJob || 'Chưa cập nhật'}</div>
        </div>
      </div>

      <!-- Khối 3: Chuyên môn & Lỗ hổng kiến thức -->
      <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:16px;">
        <h4 style="font-size:14.5px; color:var(--primary); margin-bottom:10px;">🎯 Chuyên Môn & Chẩn Đoán Lỗ Hổng Kiến Thức</h4>
        <div style="display:flex; flex-direction:column; gap:8px; font-size:13.5px;">
          <div>• <strong>Môn học kèm:</strong> <span class="badge badge-primary">${std.subject || 'Toán THPT'}</span></div>
          <div>• <strong>Lỗ hổng kiến thức:</strong> <span style="color:var(--danger); font-weight:600;">${std.weaknesses || 'Chưa phát hiện lỗ hổng'}</span></div>
          <div>• <strong>Điểm mạnh:</strong> <span style="color:var(--success); font-weight:600;">${std.strengths || 'Chưa cập nhật'}</span></div>
          <div>• <strong>Ghi chú định hướng:</strong> ${std.notes || 'Không có'}</div>
        </div>
      </div>

      <!-- Khối 4: Lịch học & Hình thức -->
      <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:16px;">
        <h4 style="font-size:14.5px; color:var(--primary); margin-bottom:10px;">📅 Lịch Học & Hình Thức Dạy Kèm</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13.5px;">
          <div>• <strong>Hình thức:</strong> ${std.learningMode || '1 kèm 1'}</div>
          <div>• <strong>Lịch học cố định:</strong> <strong>${std.schedule || 'Chưa xếp lịch'}</strong></div>
          <div>• <strong>Ngày bắt đầu học:</strong> ${std.startDate || 'Chưa cập nhật'}</div>
        </div>
      </div>
    `;

    const isRealAdmin = Auth.isRealAdmin();
    const footer = document.getElementById('profFooterActions');
    footer.innerHTML = `
      <button class="btn btn-outline" onclick="App.closeModal('studentProfileModal')">Đóng</button>
      ${isRealAdmin ? `
        <button class="btn btn-outline" onclick="App.closeModal('studentProfileModal'); AdminView.openManageAccountModal('${std.id}')">
          🔑 Quản Lý Tài Khoản
        </button>
        <button class="btn btn-secondary" onclick="App.closeModal('studentProfileModal'); Auth.adminSupervise('${std.id}')" title="Toàn quyền Admin: Xem trực tiếp bàn học sinh này">
          🎒 Xem Bàn Học Em Này
        </button>
        <button class="btn btn-danger" onclick="App.closeModal('studentProfileModal'); AdminView.confirmDeleteStudent('${std.id}', '${std.name}')" title="Xóa học sinh đã học xong hoặc không còn theo học">
          🗑️ Xóa Học Sinh
        </button>
      ` : ''}
      <button class="btn btn-primary" onclick="App.closeModal('studentProfileModal'); App.openCreateAssignmentModal('${std.id}')">
        🎯 Giao Bài Riêng Cho Em Này
      </button>
    `;

    const modal = document.getElementById('studentProfileModal');
    if (modal) modal.classList.add('active');
  },

  openManageAccountModal(studentId) {
    const std = Store.getUserById(studentId);
    if (!std) return;

    document.getElementById('manageAccountStdId').value = std.id;
    document.getElementById('manageAccountStdName').textContent = `Tài Khoản: ${std.name}`;
    document.getElementById('manageAccountStdSub').textContent = `${std.grade} • ${std.school || 'Học sinh kèm'}`;

    const banner = document.getElementById('manageAccountStatusBanner');
    const revokeBtn = document.getElementById('btnRevokeAccount');
    const uInput = document.getElementById('manageAccountUsername');
    const pInput = document.getElementById('manageAccountPassword');

    const hasAcc = std.hasAccount === true && std.accountStatus === 'active';
    if (hasAcc) {
      banner.style.background = '#ecfdf5';
      banner.style.color = '#065f46';
      banner.style.border = '1px solid #a7f3d0';
      banner.innerHTML = `
        <strong>✅ Học sinh đang có tài khoản chính thức:</strong><br>
        Tên đăng nhập: <code>${std.username}</code> — Đã kích hoạt quyền vào Giao diện Học sinh và nộp bài.
      `;
      uInput.value = std.username || '';
      pInput.value = std.password || '123456';
      if (revokeBtn) revokeBtn.style.display = 'inline-flex';
    } else {
      banner.style.background = '#fff1f2';
      banner.style.color = '#9f1239';
      banner.style.border = '1px solid #fecdd3';
      banner.innerHTML = `
        <strong>🔒 Học sinh chưa được cấp tài khoản:</strong><br>
        Chưa có quyền đăng nhập và chưa hiển thị nút trên thanh chuyển vai trò. Nhấn "Lưu & Kích Hoạt" để cấp quyền.
      `;
      uInput.value = std.username || this.generateUsernameFromName(std.name);
      pInput.value = std.password || '123456';
      if (revokeBtn) revokeBtn.style.display = 'none';
    }

    const modal = document.getElementById('manageAccountModal');
    if (modal) modal.classList.add('active');
  },

  autoGenerateUsername() {
    const stdId = document.getElementById('manageAccountStdId').value;
    const std = Store.getUserById(stdId);
    if (std) {
      document.getElementById('manageAccountUsername').value = this.generateUsernameFromName(std.name);
    }
  },

  autoGeneratePassword() {
    const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
    document.getElementById('manageAccountPassword').value = randomPass;
    App.showToast(`Đã sinh mật khẩu mới: ${randomPass}`, 'info');
  },

  saveStudentAccount() {
    const stdId = document.getElementById('manageAccountStdId').value;
    const std = Store.getUserById(stdId);
    if (!std) return;

    const username = document.getElementById('manageAccountUsername').value.trim();
    const password = document.getElementById('manageAccountPassword').value.trim();

    if (!username) {
      App.showToast('Vui lòng nhập tên đăng nhập cho học sinh!', 'error');
      return;
    }
    if (!password) {
      App.showToast('Vui lòng nhập mật khẩu cho học sinh!', 'error');
      return;
    }

    Store.provisionStudentAccount(stdId, { username, password });
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }
    App.closeModal('manageAccountModal');
    App.updateHeaderProfile();
    App.renderCurrentView();
    App.showToast(`🎉 Đã cấp tài khoản chính thức thành công cho "${std.name}"! Nút HS đã xuất hiện trên thanh vai trò (Đã lưu Cloud).`, 'success');
  },

  revokeStudentAccount() {
    const stdId = document.getElementById('manageAccountStdId').value;
    const std = Store.getUserById(stdId);
    if (!std) return;

    if (confirm(`Bạn có chắc muốn THU HỒI tài khoản của học sinh "${std.name}"? Học sinh này sẽ mất quyền vào giao diện học sinh.`)) {
      Store.revokeStudentAccount(stdId);

      // Nếu người dùng đang giả lập tài khoản học sinh này -> chuyển về Gia Sư
      const current = Auth.getCurrentUser();
      if (current && current.id === stdId) {
        Auth.switchUser('u_tutor');
      }

      App.closeModal('manageAccountModal');
      App.updateHeaderProfile();
      App.renderCurrentView();
      App.showToast(`Đã thu hồi tài khoản của học sinh ${std.name}!`, 'info');
    }
  },

  confirmDeleteStudent(studentId, studentName) {
    if (confirm(`Xác nhận xóa học sinh "${studentName}" (học sinh đã học xong hoặc không còn theo học)?\n\nHọc sinh này và các bài tập riêng sẽ được xóa hoàn toàn khỏi cả bàn Quản trị và bàn làm việc của Gia sư.`)) {
      Store.deleteStudent(studentId);

      // Nếu Admin đang đóng vai xem bàn học sinh này thì thoát chế độ giám sát
      if (Auth.isAdminSupervising() && Auth.getCurrentUser().id === studentId) {
        Auth.adminReturnToAdmin();
      }

      // Reset bộ lọc học sinh của Gia sư nếu đang chọn học sinh này
      if (typeof TutorView !== 'undefined' && TutorView.selectedStudentId === studentId) {
        TutorView.selectedStudentId = null;
      }

      App.showToast(`Đã xóa học sinh "${studentName}"! Bàn làm việc của Gia sư đã tự động cập nhật đồng bộ.`, 'success');
      App.updateHeaderProfile();
      App.renderCurrentView();
    }
  },

  handleQuickAssignTutor(studentId, tutorId) {
    Store.assignStudentTutor(studentId, tutorId);
    const tutor = Store.getUserById(tutorId);
    App.showToast(`✓ Đã chuyển học sinh sang giáo viên ${tutor ? tutor.name : ''} thành công!`, 'success');
    App.renderCurrentView();
  },

  submitReassignTutorFromModal(studentId) {
    const sel = document.getElementById('profReassignTutorSelect');
    if (!sel) return;
    const newTutorId = sel.value;
    Store.assignStudentTutor(studentId, newTutorId);
    const tutor = Store.getUserById(newTutorId);
    App.showToast(`✓ Đã phân công học sinh cho ${tutor ? tutor.name : ''} thành công!`, 'success');
    this.openStudentProfileModal(studentId);
    App.renderCurrentView();
  },

  exportBackup() {
    const jsonStr = JSON.stringify(Store.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduTask_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    App.showToast('Đã tải xuống file sao lưu dữ liệu!', 'success');
  },

  resetToDefault() {
    if (confirm("Bạn có chắc chắn muốn đặt lại dữ liệu hệ thống về ban đầu?")) {
      Store.resetDefault();
      App.showToast('Đã đặt lại dữ liệu hệ thống!', 'info');
      App.updateHeaderProfile();
      App.renderCurrentView();
    }
  },

  // ================= QUẢN LÝ TÀI KHOẢN GIA SƯ =================
  openAddTutorModal() {
    const nameInput = document.getElementById('tutorFormName');
    if (nameInput) nameInput.value = '';
    const phoneInput = document.getElementById('tutorFormPhone');
    if (phoneInput) phoneInput.value = '';
    const emailInput = document.getElementById('tutorFormEmail');
    if (emailInput) emailInput.value = '';
    const subjectInput = document.getElementById('tutorFormSubject');
    if (subjectInput) subjectInput.value = 'Toán Học THPT';
    const degreeInput = document.getElementById('tutorFormDegree');
    if (degreeInput) degreeInput.value = '';
    const uInput = document.getElementById('tutorFormUsername');
    if (uInput) uInput.value = '';
    const pInput = document.getElementById('tutorFormPassword');
    if (pInput) pInput.value = '123456';

    if (nameInput) {
      nameInput.oninput = () => {
        if (uInput) uInput.value = this.generateTutorUsernameFromName(nameInput.value);
      };
    }

    const modal = document.getElementById('addTutorModal');
    if (modal) modal.classList.add('active');
  },

  generateTutorUsernameFromName(fullName) {
    if (!fullName || !fullName.trim()) return 'giasu_' + Math.floor(Math.random() * 900 + 100);
    const clean = fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
    const words = clean.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'giasu_' + Date.now().toString().slice(-4);
    const lastName = words[words.length - 1];
    return 'giasu_' + lastName;
  },

  autoGenerateTutorUsername() {
    const name = document.getElementById('tutorFormName')?.value || '';
    const uInput = document.getElementById('tutorFormUsername');
    if (uInput) {
      uInput.value = this.generateTutorUsernameFromName(name) + Math.floor(Math.random() * 90 + 10);
    }
  },

  autoGenerateTutorPassword() {
    const pInput = document.getElementById('tutorFormPassword');
    if (pInput) pInput.value = Math.random().toString(36).slice(-6);
  },

  submitAddTutor() {
    const name = document.getElementById('tutorFormName')?.value.trim();
    const phone = document.getElementById('tutorFormPhone')?.value.trim();
    const subject = document.getElementById('tutorFormSubject')?.value.trim() || 'Toán Học THPT';
    const email = document.getElementById('tutorFormEmail')?.value.trim();
    const degree = document.getElementById('tutorFormDegree')?.value.trim();
    const gender = document.getElementById('tutorFormGender')?.value || 'Nam';
    let username = document.getElementById('tutorFormUsername')?.value.trim();
    const password = document.getElementById('tutorFormPassword')?.value.trim() || '123456';

    if (!name) {
      App.showToast('Vui lòng nhập họ và tên gia sư!', 'error');
      return;
    }
    if (!phone) {
      App.showToast('Vui lòng nhập số điện thoại / Zalo của gia sư!', 'error');
      return;
    }

    if (!username) {
      username = this.generateTutorUsernameFromName(name);
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
      email: email,
      role: 'tutor',
      roleName: 'Gia Sư Phụ Trách',
      subjects: [subject],
      degree: degree || 'Giáo viên dạy kèm chuyên môn'
    };

    Store.addTutor(newTutor);
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }
    App.closeModal('addTutorModal');
    App.showToast(`✓ Đã tạo tài khoản Gia sư cho "${name}" (TK: ${username}) và đồng bộ Cloud!`, 'success');
    this.render(document.getElementById('viewContainer'));
  },

  openManageTutorAccountModal(tutorId) {
    const tutor = Store.getUserById(tutorId);
    if (!tutor) return;
    document.getElementById('manageTutorId').value = tutor.id;
    document.getElementById('manageTutorUsernameInput').value = tutor.username;
    document.getElementById('manageTutorPasswordInput').value = tutor.password || '123456';
    document.getElementById('manageTutorNameHeading').textContent = `Tài Khoản: ${tutor.name}`;
    const modal = document.getElementById('manageTutorAccountModal');
    if (modal) modal.classList.add('active');
  },

  saveTutorAccountPassword() {
    const tutorId = document.getElementById('manageTutorId')?.value;
    const newPassword = document.getElementById('manageTutorPasswordInput')?.value.trim();
    if (!newPassword || newPassword.length < 4) {
      App.showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
      return;
    }
    Store.updateTutorPassword(tutorId, newPassword);
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }
    App.closeModal('manageTutorAccountModal');
    App.showToast('✓ Đã cập nhật mật khẩu cho gia sư và đồng bộ Cloud!', 'success');
    this.render(document.getElementById('viewContainer'));
  },

  confirmDeleteTutor(tutorId, tutorName) {
    if (!confirm(`Bạn có chắc chắn muốn xóa Gia sư "${tutorName}" khỏi hệ thống không?\n\nLưu ý: Các học sinh đang do thầy/cô này phụ trách sẽ được tự động chuyển giao sang gia sư khác.`)) {
      return;
    }
    const res = Store.deleteTutor(tutorId);
    if (!res.success) {
      App.showToast(res.message || 'Không thể xóa gia sư này!', 'error');
      return;
    }
    App.showToast(`✓ Đã xóa gia sư "${tutorName}" thành công!`, 'success');
    this.render(document.getElementById('viewContainer'));
  }
};
