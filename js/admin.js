/**
 * EDUTASK PRO — ADMIN MODULE (CẤP 1: QUẢN TRỊ VIÊN)
 * Quản lý học sinh kèm với đầy đủ thông tin chuyên sâu (Thông tin cá nhân, Phụ huynh, Lỗ hổng, Học phí & Lịch học)
 */

const AdminView = {
  searchQuery: '',
  filterTutor: 'all',
  filterGrade: 'all',
  filterClass: 'all',
  classSearchQuery: '',
  classFilterGrade: 'all',
  classFilterTutor: 'all',
  currentGradebookClassId: null,
  currentMembersClassId: null,

  handleSearch(val) {
    this.searchQuery = val;
    App.renderCurrentView();
    const input = document.getElementById('adminStudentSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  handleFilterTutor(tutorId) {
    this.filterTutor = tutorId;
    App.renderCurrentView();
  },

  handleFilterGrade(grade) {
    this.filterGrade = grade;
    App.renderCurrentView();
  },

  handleFilterClass(classId) {
    this.filterClass = classId;
    App.renderCurrentView();
  },

  resetFilters() {
    this.searchQuery = '';
    this.filterTutor = 'all';
    this.filterGrade = 'all';
    this.filterClass = 'all';
    App.renderCurrentView();
  },

  handleClassSearch(val) {
    this.classSearchQuery = val;
    App.renderCurrentView();
    const input = document.getElementById('adminClassSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  handleClassFilterGrade(grade) {
    this.classFilterGrade = grade;
    App.renderCurrentView();
  },

  handleClassFilterTutor(tutorId) {
    this.classFilterTutor = tutorId;
    App.renderCurrentView();
  },

  resetClassFilters() {
    this.classSearchQuery = '';
    this.classFilterGrade = 'all';
    this.classFilterTutor = 'all';
    App.renderCurrentView();
  },

  adjustSessions(studentId, delta) {
    Store.adjustStudentSessions(studentId, delta);
    App.renderCurrentView();
    const std = Store.getUserById(studentId);
    App.showToast(`Đã cập nhật: ${std ? std.name : 'Học sinh'} hiện có ${std ? (std.totalSessions || 0) : 0} buổi học.`, 'info');
  },

  markPaid(studentId, studentName, amount) {
    if (confirm(`Xác nhận phụ huynh em "${studentName}" đã thanh toán đủ ${amount.toLocaleString('vi-VN')} đ học phí?\n\nHệ thống sẽ chốt kỳ thu phí và đặt lại số buổi học về 0.`)) {
      Store.resetStudentSessions(studentId);
      App.renderCurrentView();
      App.showToast(`✓ Đã xác nhận thu ${amount.toLocaleString('vi-VN')} đ học phí của em ${studentName}!`, 'success');
    }
  },

  exportTuitionCsv() {
    const students = Store.getStudents();
    if (students.length === 0) {
      App.showToast('Không có dữ liệu học sinh để xuất báo cáo!', 'warning');
      return;
    }
    const rows = [
      ['STT', 'Mã Học Sinh', 'Họ Và Tên', 'Giới Tính', 'Khối Lớp', 'Trường Học', 'Gia Sư Phụ Trách', 'Tài Khoản', 'Họ Tên Phụ Huynh', 'SĐT Phụ Huynh', 'Lịch Học', 'Học Phí/Buổi (VNĐ)', 'Số Buổi Đã Học', 'Tổng Học Phí Phải Thu (VNĐ)', 'Trạng Thái']
    ];
    students.forEach((s, idx) => {
      const fee = s.feePerSession || 200000;
      const sess = s.totalSessions || 0;
      const total = fee * sess;
      rows.push([
        idx + 1,
        s.id,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        s.gender || 'Nam',
        s.grade || '',
        `"${(s.school || '').replace(/"/g, '""')}"`,
        `"${(s.assignedTutorName || '').replace(/"/g, '""')}"`,
        s.username || '',
        `"${(s.parentName || '').replace(/"/g, '""')}"`,
        `'${s.parentPhone || s.phone || ''}`,
        `"${(s.schedule || '').replace(/"/g, '""')}"`,
        fee,
        sess,
        total,
        sess > 0 ? 'Chờ thu phí' : 'Đã hoàn tất'
      ]);
    });
    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_HocPhi_EduTask_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast('✓ Đã xuất bảng tính Excel/CSV học phí thành công!', 'success');
  },

  render(container) {
    const allStudents = Store.getStudents();
    const tutors = Store.getTutors();
    const assignments = Store.getAllAssignments();
    const submissions = (Store.data && Array.isArray(Store.data.submissions)) ? Store.data.submissions : [];
    const pendingGradingCount = submissions.filter(s => s.status === 'submitted').length;
    const allClasses = Store.getClasses();

    // Lọc danh sách lớp học theo tìm kiếm & bộ lọc
    const classes = allClasses.filter(cls => {
      if (this.classFilterTutor !== 'all' && cls.tutorId !== this.classFilterTutor) return false;
      if (this.classFilterGrade !== 'all' && cls.grade !== this.classFilterGrade) return false;
      if (this.classSearchQuery) {
        const q = this.classSearchQuery.toLowerCase().trim();
        const matchName = (cls.name || '').toLowerCase().includes(q);
        const matchCode = (cls.code || '').toLowerCase().includes(q);
        const matchTutor = (cls.tutorName || '').toLowerCase().includes(q);
        const matchSubj = (cls.subject || '').toLowerCase().includes(q);
        const matchRoom = (cls.room || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTutor && !matchSubj && !matchRoom) return false;
      }
      return true;
    });

    // Lọc danh sách học sinh theo tìm kiếm & bộ lọc
    const students = allStudents.filter(std => {
      if (this.filterTutor !== 'all' && std.assignedTutorId !== this.filterTutor) return false;
      if (this.filterGrade !== 'all' && std.grade !== this.filterGrade) return false;
      if (this.filterClass !== 'all') {
        const stdClass = Store.getStudentClass(std.id);
        if (this.filterClass === 'none') {
          if (stdClass) return false;
        } else {
          if (!stdClass || stdClass.id !== this.filterClass) return false;
        }
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchName = (std.name || '').toLowerCase().includes(q);
        const matchUser = (std.username || '').toLowerCase().includes(q);
        const matchPhone = (std.phone || '').toLowerCase().includes(q);
        const matchParent = (std.parentName || '').toLowerCase().includes(q) || (std.parentPhone || '').toLowerCase().includes(q);
        const matchSchool = (std.school || '').toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchPhone && !matchParent && !matchSchool) return false;
      }
      return true;
    });

    // Tính tổng học phí dự kiến trong tháng (theo toàn bộ học sinh)
    let totalTuition = 0;
    allStudents.forEach(s => {
      totalTuition += (s.feePerSession || 200000) * (s.totalSessions || 0);
    });

    container.innerHTML = `
      <!-- Banner Quản Trị Cá Nhân -->
      <div class="view-banner">
        <div class="banner-info">
          <h2>Bàn Quản Trị Hệ Thống (Admin)</h2>
          <p>Quản lý danh sách lớp học, hồ sơ học sinh, phân công giáo viên và theo dõi học phí toàn diện.</p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-white" onclick="AdminView.openCreateClassModal()">
            🏫 Thêm Lớp Học Mới
          </button>
          <button class="btn btn-secondary" onclick="AdminView.openAddStudentModal()">
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

      <!-- Thẻ Chỉ Số Quản Lý (6 Chỉ Số Tổng Thể) -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box metric-blue">🎒</div>
          <div class="metric-data">
            <h4>${allStudents.length}</h4>
            <span>Học sinh kèm</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box" style="background:#ede9fe; color:#6d28d9;">🏫</div>
          <div class="metric-data">
            <h4>${allClasses.length}</h4>
            <span>Lớp học mở</span>
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

      <!-- ================= BẢNG QUẢN LÝ TOÀN BỘ LỚP HỌC TRONG HỆ THỐNG ================= -->
      <div class="content-card">
        <div class="card-header">
          <div>
            <h3>🏫 Danh Sách Lớp Học Toàn Hệ Thống & Phân Công Giảng Dạy</h3>
            <small style="color:var(--text-muted); font-size:12px;">Đang hiển thị <strong>${classes.length}</strong> / <strong>${allClasses.length}</strong> lớp học trong trung tâm</small>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" style="border-color:#10b981; color:#047857; font-weight:700;" onclick="AdminView.exportAllClassesCsv()" title="Tải báo cáo danh sách tất cả các lớp học">
              📊 Xuất Excel / CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminView.openCreateClassModal()">
              ➕ Thêm lớp học mới
            </button>
          </div>
        </div>

        <!-- Thanh Tìm Kiếm & Bộ Lọc Lớp Học -->
        <div class="admin-search-filter-bar">
          <div class="admin-search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="adminClassSearchInput" placeholder="Tìm theo tên lớp, mã lớp, giáo viên, môn học, phòng..." value="${this.classSearchQuery}" oninput="AdminView.handleClassSearch(this.value)">
          </div>
          <select class="admin-filter-select" onchange="AdminView.handleClassFilterGrade(this.value)">
            <option value="all" ${this.classFilterGrade === 'all' ? 'selected' : ''}>🎒 Tất cả khối lớp</option>
            <option value="Lớp 12" ${this.classFilterGrade === 'Lớp 12' ? 'selected' : ''}>Khối 12</option>
            <option value="Lớp 11" ${this.classFilterGrade === 'Lớp 11' ? 'selected' : ''}>Khối 11</option>
            <option value="Lớp 10" ${this.classFilterGrade === 'Lớp 10' ? 'selected' : ''}>Khối 10</option>
            <option value="Khác" ${this.classFilterGrade === 'Khác' ? 'selected' : ''}>Khối khác</option>
          </select>
          <select class="admin-filter-select" onchange="AdminView.handleClassFilterTutor(this.value)">
            <option value="all">👨‍🏫 Tất cả gia sư phụ trách (${tutors.length})</option>
            ${tutors.map(t => `<option value="${t.id}" ${this.classFilterTutor === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
          ${(this.classSearchQuery || this.classFilterGrade !== 'all' || this.classFilterTutor !== 'all') ? `
            <button class="btn btn-xs btn-outline" onclick="AdminView.resetClassFilters()" title="Xóa bộ lọc để xem toàn bộ">✕ Xóa lọc</button>
          ` : ''}
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lớp Học & Mã Lớp</th>
                <th>Giáo Viên Phụ Trách</th>
                <th>Sĩ Số & Học Sinh</th>
                <th>Khối & Môn Học</th>
                <th>Tình Hình Học Tập</th>
                <th>Điểm TB Toàn Lớp</th>
                <th style="text-align:center;">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            <tbody>
              ${classes.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
                    🏫 Không tìm thấy lớp học nào phù hợp với bộ lọc hiện tại.
                    <div style="margin-top:8px;">
                      <button class="btn btn-sm btn-primary" onclick="AdminView.openCreateClassModal()">➕ Tạo Lớp Học Mới Ngay</button>
                    </div>
                  </td>
                </tr>
              ` : classes.map(cls => {
                const clsStudents = Store.getStudentsByClass(cls.id);
                const gradebook = Store.getClassGradebook(cls.id);
                const clsAssignments = (gradebook && gradebook.assignments) ? gradebook.assignments : [];
                const rawAvg = gradebook ? gradebook.classAvg : 0;
                const avg = typeof rawAvg === 'number' ? rawAvg : (parseFloat(rawAvg) || 0);
                let avgColor = '#10b981';
                let avgBadgeClass = 'score-pill-excellent';
                let avgLabel = 'Giỏi';
                if (avg < 5.0) { avgColor = '#ef4444'; avgBadgeClass = 'score-pill-weak'; avgLabel = 'Yếu'; }
                else if (avg < 6.5) { avgColor = '#f59e0b'; avgBadgeClass = 'score-pill-average'; avgLabel = 'TB'; }
                else if (avg < 8.0) { avgColor = '#0284c7'; avgBadgeClass = 'score-pill-good'; avgLabel = 'Khá'; }

                return `
                  <tr>
                    <td>
                      <div>
                        <strong style="font-size:14.5px; color:var(--text-main); display:block;">${cls.name}</strong>
                        <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                          <code style="font-size:12px; font-weight:800; color:#4338ca; background:#ede9fe; padding:2px 7px; border-radius:5px; font-family:var(--font-mono); letter-spacing:0.5px;">${cls.code || 'CHƯA CÓ MÃ'}</code>
                          <button class="btn btn-xs btn-outline" onclick="AdminView.copyClassCode('${cls.code}')" title="Sao chép mã lớp gửi cho học sinh" style="padding:1px 6px; font-size:10px;">📋 Sao chép</button>
                        </div>
                        <small style="color:var(--text-muted); margin-top:2px; display:block;">📍 ${cls.room || 'Phòng học trực tuyến'}</small>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex; flex-direction:column; gap:5px;">
                        <span class="badge" style="background:#ede9fe; color:#6d28d9; border:1px solid #ddd6fe; font-size:12px; font-weight:700; width:fit-content;">
                          👨‍🏫 ${cls.tutorName || 'Chưa phân công'}
                        </span>
                        <select class="quick-tutor-select" onchange="AdminView.quickAssignClassTutor('${cls.id}', this.value)" title="Đổi giáo viên phụ trách cho lớp này" style="font-size:11.5px; padding:3px 6px; border-radius:6px; border:1px solid #cbd5e1; background:#ffffff; color:#334155; max-width:165px; cursor:pointer;">
                          ${tutors.map(t => `
                            <option value="${t.id}" ${t.id === cls.tutorId ? 'selected' : ''}>${t.name}</option>
                          `).join('')}
                        </select>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span class="badge badge-primary" style="font-size:12px; font-weight:700;">
                          👥 ${clsStudents.length} học sinh
                        </span>
                        <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px; max-width:180px; white-space:normal; line-height:1.3;">
                          ${clsStudents.map(s => s.name).slice(0, 3).join(', ')}${clsStudents.length > 3 ? ` +${clsStudents.length - 3} em` : ''}
                        </div>
                        <button class="btn btn-xs btn-outline" onclick="AdminView.openAddStudentToClassModal('${cls.id}')" style="margin-top:4px; font-size:11px; padding:2px 7px;">
                          ➕ Thêm HS
                        </button>
                      </div>
                    </td>
                    <td>
                      <span class="badge" style="background:#f1f5f9; color:#475569; font-weight:700;">${cls.grade || 'Lớp 12'}</span><br>
                      <small style="color:var(--text-muted); font-weight:600;">${cls.subject || 'Toán Học'}</small>
                    </td>
                    <td>
                      <div style="font-size:12.5px;">
                        <span style="font-weight:700; color:#334155;">📋 ${clsAssignments.length} bài tập</span><br>
                        <small style="color:var(--text-muted);">📢 ${(cls.announcements || []).length} thông báo</small>
                      </div>
                    </td>
                    <td>
                      ${clsAssignments.length > 0 ? `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                          <span class="score-cell-pill ${avgBadgeClass}" style="font-size:14px; padding:4px 10px;">${avg}đ</span>
                          <small style="font-weight:700; color:${avgColor}; font-size:11px;">Học lực ${avgLabel}</small>
                        </div>
                      ` : `
                        <span style="color:var(--text-muted); font-size:12px; font-style:italic;">Chưa có bài kiểm tra</span>
                      `}
                    </td>
                    <td style="text-align:center;">
                      <div style="display:inline-flex; gap:5px; flex-wrap:wrap; justify-content:center;">
                        <button class="btn btn-sm btn-primary" title="Giao bài tập mới cho toàn lớp này" onclick="App.openCreateAssignmentModal(null, '${cls.id}')">
                          ➕ Giao Bài
                        </button>
                        <button class="btn btn-sm btn-outline" style="border-color:#10b981; color:#047857; font-weight:700;" title="Xem sổ điểm điện tử ma trận của lớp này" onclick="AdminView.openClassGradebookModal('${cls.id}')">
                          📊 Sổ Điểm
                        </button>
                        <button class="btn btn-sm btn-outline" style="border-color:#6366f1; color:#4338ca; font-weight:700;" title="Xem báo cáo đánh giá & nhận xét toàn lớp" onclick="AdminView.openClassEvaluationFromAdmin('${cls.id}')">
                          📝 Đánh Giá
                        </button>
                        <button class="btn btn-sm btn-outline" style="border-color:#0284c7; color:#0369a1; font-weight:700;" title="Xem thống kê & ghi nhận các đợt kiểm tra của lớp" onclick="AdminView.openClassHistoryFromAdmin('${cls.id}')">
                          📜 Lịch Sử KT
                        </button>
                        <button class="btn btn-sm btn-secondary" title="Xem danh sách học sinh và sĩ số lớp" onclick="AdminView.openClassMembersModal('${cls.id}')">
                          👥 Thành Viên
                        </button>
                        <button class="btn btn-sm btn-outline" title="Chỉnh sửa thông tin lớp (Tên, mã, giáo viên...)" onclick="AdminView.openEditClassModal('${cls.id}')">
                          ✏️ Sửa
                        </button>
                        <button class="btn btn-sm btn-outline" title="Toàn quyền Admin: Chuyển ngay sang góc nhìn Bàn Gia sư phụ trách lớp này" onclick="Auth.adminSupervise('${cls.tutorId}', '${cls.id}')">
                          👀 Bàn Dạy
                        </button>
                        <button class="btn btn-sm btn-danger" title="Xóa lớp học" onclick="AdminView.confirmDeleteClass('${cls.id}', '${cls.name.replace(/'/g, "\\'")}')">
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

      <!-- Bảng Quản Lý Học Sinh Kèm Chi Tiết -->
      <div class="content-card">
        <div class="card-header">
          <div>
            <h3>🎒 Danh Sách Học Sinh Kèm & Phân Công Giáo Viên</h3>
            <small style="color:var(--text-muted); font-size:12px;">Đang hiển thị <strong>${students.length}</strong> / <strong>${allStudents.length}</strong> học sinh</small>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" style="border-color:#10b981; color:#047857; font-weight:700;" onclick="AdminView.exportTuitionCsv()" title="Tải bảng tính Excel/CSV tính tiền học phí">
              📊 Xuất Excel / CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminView.openAddStudentModal()">
              ➕ Thêm học sinh
            </button>
          </div>
        </div>

        <!-- Thanh Tìm Kiếm & Bộ Lọc Thời Gian Thực -->
        <div class="admin-search-filter-bar">
          <div class="admin-search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="adminStudentSearchInput" placeholder="Tìm theo tên học sinh, tài khoản, SĐT phụ huynh, trường..." value="${this.searchQuery}" oninput="AdminView.handleSearch(this.value)">
          </div>
          <select class="admin-filter-select" onchange="AdminView.handleFilterClass(this.value)">
            <option value="all">🏫 Tất cả lớp học (${allClasses.length})</option>
            <option value="none" ${this.filterClass === 'none' ? 'selected' : ''}>Học kèm 1-1 (Chưa vào lớp)</option>
            ${allClasses.map(c => `<option value="${c.id}" ${this.filterClass === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <select class="admin-filter-select" onchange="AdminView.handleFilterTutor(this.value)">
            <option value="all">👨‍🏫 Tất cả gia sư (${tutors.length})</option>
            ${tutors.map(t => `<option value="${t.id}" ${this.filterTutor === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
          <select class="admin-filter-select" onchange="AdminView.handleFilterGrade(this.value)">
            <option value="all" ${this.filterGrade === 'all' ? 'selected' : ''}>🎒 Tất cả khối lớp</option>
            <option value="Lớp 12" ${this.filterGrade === 'Lớp 12' ? 'selected' : ''}>Lớp 12</option>
            <option value="Lớp 11" ${this.filterGrade === 'Lớp 11' ? 'selected' : ''}>Lớp 11</option>
            <option value="Lớp 10" ${this.filterGrade === 'Lớp 10' ? 'selected' : ''}>Lớp 10</option>
            <option value="Khác" ${this.filterGrade === 'Khác' ? 'selected' : ''}>Khác</option>
          </select>
          ${(this.searchQuery || this.filterTutor !== 'all' || this.filterGrade !== 'all' || this.filterClass !== 'all') ? `
            <button class="btn btn-xs btn-outline" onclick="AdminView.resetFilters()" title="Xóa bộ lọc để xem toàn bộ">✕ Xóa lọc</button>
          ` : ''}
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
                <th>Tháng Này (Số Buổi)</th>
                <th style="text-align:center;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${students.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">
                    🔍 Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ` : students.map(std => {
                const sessionFee = std.feePerSession || 200000;
                const sessions = std.totalSessions || 0;
                const total = sessionFee * sessions;
                const schoolInfo = std.school ? `${std.grade} • ${std.school}` : std.grade;
                const hasAcc = std.hasAccount === true && std.accountStatus === 'active';
                const tutors = Store.getTutors();
                const stdClass = Store.getStudentClass(std.id);

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
                          <div style="margin-top:3px;">
                            ${stdClass ? `
                              <span class="badge" style="background:#e0e7ff; color:#3730a3; border:1px solid #c7d2fe; font-size:11px; font-weight:700; cursor:pointer;" onclick="AdminView.openClassGradebookModal('${stdClass.id}')" title="Bấm để xem sổ điểm lớp ${stdClass.name}">
                                🏫 ${stdClass.name.split('—')[0].trim()}
                              </span>
                            ` : `
                              <span class="badge" style="background:#f1f5f9; color:#64748b; font-size:11px;">
                                Học kèm 1-1
                              </span>
                            `}
                          </div>
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
                      <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px;">
                        <button class="btn btn-xs btn-outline" onclick="AdminView.adjustSessions('${std.id}', -1)" title="Giảm 1 buổi" style="width:22px; height:22px; padding:0; font-weight:800; border-radius:4px;">-</button>
                        <strong style="font-size:13px; min-width:32px; text-align:center;">${sessions} buổi</strong>
                        <button class="btn btn-xs btn-primary" onclick="AdminView.adjustSessions('${std.id}', 1)" title="Tăng 1 buổi (Điểm danh)" style="width:22px; height:22px; padding:0; font-weight:800; border-radius:4px;">+</button>
                      </div>
                      <div style="display:flex; align-items:center; gap:4px; justify-content:space-between;">
                        <strong style="color:var(--primary); font-size:12px;">${total.toLocaleString('vi-VN')} đ</strong>
                        ${sessions > 0 ? `
                          <button class="btn btn-xs btn-secondary" onclick="AdminView.markPaid('${std.id}', '${std.name}', ${total})" title="Đã thu học phí tháng này (Đặt lại số buổi về 0)" style="padding:1px 5px; font-size:10px;">
                            💳 Đã thu
                          </button>
                        ` : ''}
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <div style="display:inline-flex; gap:6px; flex-wrap:wrap; justify-content:center;">
                        <button class="btn btn-sm btn-outline" title="Xem hồ sơ chi tiết" onclick="AdminView.openStudentProfileModal('${std.id}')">
                          👁️ Hồ Sơ
                        </button>
                        <button class="btn btn-sm btn-secondary" title="Chỉnh sửa thông tin học sinh (Tên, học phí, mục tiêu...)" onclick="AdminView.openEditStudentModal('${std.id}')">
                          ✏️ Sửa
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
                          <strong style="font-size:14px; color:var(--text-main);">${window.Store && Store.healString ? Store.healString(tut.name) : tut.name}</strong>
                          <span style="font-size:11.5px; color:#64748b; display:block;">${(tut.gender === 'N?' ? 'Nữ' : (window.Store && Store.healString ? Store.healString(tut.gender || 'Gia sư') : (tut.gender || 'Gia sư')))} • ${window.Store && Store.healString ? Store.healString(subjects) : subjects}</span>
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
                        ${(() => {
                          const myClasses = Store.getClassesByTutor(tut.id);
                          return myClasses.length > 0 ? `
                            <div style="margin-top:2px;">
                              <span class="badge" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; font-size:11px; font-weight:700;">
                                🏫 ${myClasses.length} lớp: ${myClasses.map(c => c.name.split('—')[0].trim()).join(', ')}
                              </span>
                            </div>
                          ` : '';
                        })()}
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
          <button class="btn btn-secondary" onclick="AdminView.exportTuitionCsv()">
            📊 Xuất Báo Cáo Học Phí (Excel/CSV)
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
      if (tutors.length === 0) {
        tutorSelect.innerHTML = '<option value="">-- Chưa có Gia sư (Chưa phân công) --</option>';
      } else {
        tutorSelect.innerHTML = tutors.map(t => `
          <option value="${t.id}">${t.name} (${t.phone || 'Gia Sư'})</option>
        `).join('');
      }
    }

    // Cập nhật danh sách lớp học
    const classSelect = document.getElementById('stdFormClass');
    if (classSelect) {
      const classes = Store.getClasses();
      classSelect.innerHTML = `
        <option value="none">-- Chưa vào lớp (Học kèm 1-1) --</option>
        ${classes.map(c => `<option value="${c.id}">${c.name} (${c.code || c.grade})</option>`).join('')}
      `;
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

    const assignedTutorId = document.getElementById('stdFormAssignedTutor')?.value || '';
    const tutor = assignedTutorId ? Store.getUserById(assignedTutorId) : null;
    const assignedTutorName = tutor ? tutor.name : 'Chưa phân công';

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
    const targetClassId = document.getElementById('stdFormClass')?.value;
    if (targetClassId && targetClassId !== 'none') {
      Store.addStudentToClass(targetClassId, newStudent.id);
    }
    if (window.CloudSync && typeof CloudSync.pushData === 'function') {
      CloudSync.pushData(Store.data, true);
    }
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
    const studentClass = Store.getStudentClass(studentId);
    const cheatSummary = Store.getStudentCheatSummary ? Store.getStudentCheatSummary(studentId) : { totalViolations: 0, totalDuration: 0, submissionsWithCheating: 0 };
    const body = document.getElementById('profContentBody');
    body.innerHTML = `
      <!-- Dải Banner Hành Động Nhanh -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 16px; border-radius:10px; border:1px solid var(--border-color); flex-wrap:wrap; gap:8px;">
        <span style="font-size:13px; color:var(--text-main);">
          👤 Hồ sơ học sinh: <strong style="color:var(--primary); font-size:14px;">${std.name}</strong> (${std.grade})
        </span>
        <button class="btn btn-sm btn-secondary" onclick="AdminView.openEditStudentModal('${std.id}')" title="Chỉnh sửa họ tên, học phí, mục tiêu...">
          ✏️ Chỉnh Sửa Thông Tin
        </button>
      </div>

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

      <!-- Khối Xếp Lớp Học Tập Trong Hệ Thống -->
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="font-size:14.5px; color:#1e40af; margin:0; display:flex; align-items:center; gap:8px;">
            🏫 Lớp Học Đang Theo Học
          </h4>
          <span class="badge" style="background:#dbeafe; color:#1e40af; font-weight:700;">
            ${studentClass ? studentClass.name : 'Chưa xếp vào lớp (Học kèm 1-1)'}
          </span>
        </div>
        <div style="font-size:13px; color:#1e3a8a; line-height:1.6; margin-bottom:10px;">
          ${studentClass 
            ? `• Đang học lớp: <strong>${studentClass.name}</strong> (Mã lớp: <code>${studentClass.code}</code>)<br>• Phòng: ${studentClass.room || 'Phòng học'} • Phụ trách: ${studentClass.tutorName || 'Gia sư'}`
            : `• Học sinh hiện đang học kèm 1-kèm-1, chưa được xếp vào lớp học tập trung nào.`}
        </div>
        ${Auth.isRealAdmin() ? `
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; background:#ffffff; padding:10px 12px; border-radius:8px; border:1px solid #93c5fd;">
            <label style="font-size:12.5px; font-weight:700; color:#1e40af;">Xếp / Đổi lớp học:</label>
            <select id="profStudentClassSelect" class="form-control" style="max-width:240px; padding:4px 8px; font-size:13px;">
              <option value="none">-- Không xếp lớp (Học kèm 1-1) --</option>
              ${Store.getClasses().map(c => `
                <option value="${c.id}" ${studentClass && studentClass.id === c.id ? 'selected' : ''}>
                  ${c.name} (${c.code || c.grade})
                </option>
              `).join('')}
            </select>
            <button class="btn btn-sm btn-primary" onclick="AdminView.submitChangeStudentClassFromModal('${std.id}')">
              ✓ Lưu Xếp Lớp
            </button>
            ${studentClass ? `
              <button class="btn btn-sm btn-outline" onclick="App.closeModal('studentProfileModal'); AdminView.openClassGradebookModal('${studentClass.id}')">
                📊 Xem Sổ Điểm Lớp Này
              </button>
            ` : ''}
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
    if (footer) {
      footer.innerHTML = `
      <button class="btn btn-outline" onclick="App.closeModal('studentProfileModal')">Đóng</button>
      <button class="btn btn-secondary" onclick="AdminView.openEditStudentModal('${std.id}')" title="Chỉnh sửa họ tên, học phí, mục tiêu, lịch học...">
        ✏️ Chỉnh Sửa Hồ Sơ
      </button>
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
      ` : `
        <button class="btn btn-danger" onclick="App.closeModal('studentProfileModal'); AdminView.confirmDeleteStudent('${std.id}', '${std.name}')" title="Xóa học sinh đã học xong hoặc không còn theo học">
          🗑️ Xóa Học Sinh
        </button>
      `}
      <button class="btn btn-primary" onclick="App.closeModal('studentProfileModal'); App.openCreateAssignmentModal('${std.id}')">
        🎯 Giao Bài Riêng Cho Em Này
      </button>
    `;
    }

    const modal = document.getElementById('studentProfileModal');
    if (modal) modal.classList.add('active');
  },

  openEditStudentModal(studentId) {
    const std = Store.getUserById(studentId);
    if (!std) {
      App.showToast('Không tìm thấy thông tin học sinh!', 'error');
      return;
    }

    // Đóng modal profile nếu đang mở
    App.closeModal('studentProfileModal');

    // Nạp danh sách gia sư vào dropdown
    const tutorSelect = document.getElementById('editStdAssignedTutor');
    if (tutorSelect) {
      const tutors = Store.getTutors();
      if (tutors.length === 0) {
        tutorSelect.innerHTML = '<option value="">-- Chưa có Gia sư (Chưa phân công) --</option>';
      } else {
        tutorSelect.innerHTML = tutors.map(t => `
          <option value="${t.id}" ${t.id === std.assignedTutorId ? 'selected' : ''}>
            ${t.name} (${t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : 'Gia Sư'})
          </option>
        `).join('');
      }
    }

    // Nạp danh sách lớp học vào dropdown
    const classSelect = document.getElementById('editStdClass');
    if (classSelect) {
      const currentClass = Store.getStudentClass(std.id);
      classSelect.innerHTML = `
        <option value="none">-- Chưa vào lớp (Học kèm 1-1) --</option>
        ${Store.getClasses().map(c => `
          <option value="${c.id}" ${currentClass && currentClass.id === c.id ? 'selected' : ''}>
            ${c.name} (${c.code || c.grade})
          </option>
        `).join('')}
      `;
    }

    // Gán dữ liệu học sinh vào form chỉnh sửa
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
    };

    setVal('editStdId', std.id);
    setVal('editStdName', std.name);
    setVal('editStdGender', std.gender || 'Nam');
    setVal('editStdDob', std.dob || '');
    setVal('editStdSchool', std.school || '');
    setVal('editStdGrade', std.grade || 'Lớp 12');
    setVal('editStdPhone', (std.phone && std.phone !== 'Chưa cập nhật') ? std.phone : '');
    setVal('editStdAddress', std.address || '');

    // Phụ huynh
    setVal('editStdParentName', std.parentName || '');
    setVal('editStdParentPhone', std.parentPhone || '');
    setVal('editStdParentJob', std.parentJob || '');

    // Mục tiêu & Học tập
    setVal('editStdSubject', std.subject || 'Toán Học');
    setVal('editStdInitialScore', std.initialScore ?? 5.0);
    setVal('editStdTargetScore', std.targetScore ?? 8.5);
    setVal('editStdCurrentScore', std.currentScore ?? std.initialScore ?? 5.0);
    setVal('editStdWeaknesses', std.weaknesses || '');
    setVal('editStdStrengths', std.strengths || '');
    setVal('editStdNotes', std.notes || '');

    // Học phí & Lịch
    setVal('editStdFee', std.feePerSession ?? 250000);
    setVal('editStdSessions', std.totalSessions ?? 0);
    setVal('editStdMode', std.learningMode || '1 kèm 1 tại nhà');
    setVal('editStdSchedule', std.schedule || '');
    setVal('editStdStartDate', std.startDate || '');

    const modal = document.getElementById('editStudentModal');
    if (modal) modal.classList.add('active');
  },

  submitEditStudent() {
    const studentId = document.getElementById('editStdId')?.value;
    const name = document.getElementById('editStdName')?.value.trim();
    const parentPhone = document.getElementById('editStdParentPhone')?.value.trim();

    if (!studentId) return;

    if (!name) {
      App.showToast('Vui lòng nhập họ và tên học sinh!', 'error');
      return;
    }
    if (!parentPhone) {
      App.showToast('Vui lòng nhập số điện thoại phụ huynh để liên hệ!', 'error');
      return;
    }

    const assignedTutorId = document.getElementById('editStdAssignedTutor')?.value || '';
    const tutor = assignedTutorId ? Store.getUserById(assignedTutorId) : null;
    const assignedTutorName = tutor ? tutor.name : 'Chưa phân công';

    const updatedData = {
      name: name,
      gender: document.getElementById('editStdGender')?.value || 'Nam',
      dob: document.getElementById('editStdDob')?.value || '',
      school: document.getElementById('editStdSchool')?.value.trim() || '',
      grade: document.getElementById('editStdGrade')?.value.trim() || 'Lớp 12',
      phone: document.getElementById('editStdPhone')?.value.trim() || 'Chưa cập nhật',
      address: document.getElementById('editStdAddress')?.value.trim() || '',
      assignedTutorId: assignedTutorId,
      assignedTutorName: assignedTutorName,

      parentName: document.getElementById('editStdParentName')?.value.trim() || '',
      parentPhone: parentPhone,
      parentJob: document.getElementById('editStdParentJob')?.value.trim() || '',

      subject: document.getElementById('editStdSubject')?.value.trim() || 'Toán Học',
      initialScore: parseFloat(document.getElementById('editStdInitialScore')?.value) || 5.0,
      targetScore: parseFloat(document.getElementById('editStdTargetScore')?.value) || 8.5,
      currentScore: parseFloat(document.getElementById('editStdCurrentScore')?.value) || 5.0,
      weaknesses: document.getElementById('editStdWeaknesses')?.value.trim() || '',
      strengths: document.getElementById('editStdStrengths')?.value.trim() || '',
      notes: document.getElementById('editStdNotes')?.value.trim() || '',

      feePerSession: parseInt(document.getElementById('editStdFee')?.value) || 250000,
      totalSessions: parseInt(document.getElementById('editStdSessions')?.value) || 0,
      learningMode: document.getElementById('editStdMode')?.value || '1 kèm 1 tại nhà',
      schedule: document.getElementById('editStdSchedule')?.value.trim() || '',
      startDate: document.getElementById('editStdStartDate')?.value || ''
    };

    Store.updateStudent(studentId, updatedData);
    const targetClassId = document.getElementById('editStdClass')?.value;
    if (targetClassId) {
      Store.setStudentClass(studentId, targetClassId);
    }

    App.closeModal('editStudentModal');
    App.updateHeaderProfile();
    App.renderCurrentView();

    App.showToast(`✓ Đã cập nhật thành công hồ sơ của học sinh "${name}"!`, 'success');
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

      // Nếu người dùng đang giả lập tài khoản học sinh này -> chuyển về Bàn Admin
      const current = Auth.getCurrentUser();
      if (current && current.id === stdId) {
        Auth.adminReturnToAdmin();
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

    // Nếu Admin đang đóng vai xem bàn gia sư này thì thoát chế độ giám sát
    if (typeof Auth !== 'undefined' && Auth.isAdminSupervising() && Auth.getCurrentUser().id === tutorId) {
      Auth.adminReturnToAdmin();
    }

    App.showToast(`✓ Đã xóa gia sư "${tutorName}" thành công!`, 'success');
    if (window.App) {
      App.updateHeaderProfile();
      App.renderCurrentView();
    } else {
      this.render(document.getElementById('viewContainer'));
    }
  },

  // ================= QUẢN LÝ LỚP HỌC (ADMIN TOÀN QUYỀN) =================
  copyClassCode(code) {
    if (!code) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        App.showToast(`📋 Đã sao chép mã lớp "${code}"!`, 'success');
      }).catch(() => {
        prompt('Sao chép mã lớp:', code);
      });
    } else {
      prompt('Sao chép mã lớp:', code);
    }
  },

  quickAssignClassTutor(classId, tutorId) {
    const tutor = Store.getUserById(tutorId);
    if (!tutor) return;
    const ok = Store.updateClass(classId, {
      tutorId: tutor.id,
      tutorName: tutor.name
    });
    if (ok) {
      if (window.CloudSync && typeof CloudSync.pushData === 'function') {
        CloudSync.pushData(Store.data, true);
      }
      if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
        GitHubSync.pushToGitHub(Store.data, false);
      }
      App.showToast(`✓ Đã phân công lớp cho ${tutor.name}!`, 'success');
      App.renderCurrentView();
    }
  },

  openCreateClassModal() {
    const idEl = document.getElementById('adminClassId');
    if (idEl) idEl.value = '';
    const nameEl = document.getElementById('adminClassName');
    if (nameEl) nameEl.value = '';
    const codeEl = document.getElementById('adminClassCode');
    if (codeEl) codeEl.value = 'LOP' + Math.floor(1000 + Math.random() * 9000);
    const gradeEl = document.getElementById('adminClassGrade');
    if (gradeEl) gradeEl.value = 'Lớp 12';
    const subjEl = document.getElementById('adminClassSubject');
    if (subjEl) subjEl.value = 'Toán Học THPT';
    const roomEl = document.getElementById('adminClassRoom');
    if (roomEl) roomEl.value = 'Phòng 302';

    const titleEl = document.getElementById('adminClassModalTitle');
    if (titleEl) titleEl.textContent = 'Tạo Lớp Học Mới (Admin)';
    const subEl = document.getElementById('adminClassModalSubtitle');
    if (subEl) subEl.textContent = 'Toàn quyền Admin: Khởi tạo lớp học, phân công giáo viên phụ trách & xếp học sinh';

    const delBtn = document.getElementById('adminClassDeleteBtn');
    if (delBtn) delBtn.style.display = 'none';

    // Populate tutors
    const tutorSelect = document.getElementById('adminClassTutorSelect');
    if (tutorSelect) {
      const tutors = Store.getTutors();
      if (tutors.length === 0) {
        tutorSelect.innerHTML = '<option value="">-- Chưa có Gia Sư --</option>';
      } else {
        tutorSelect.innerHTML = tutors.map(t => `
          <option value="${t.id}">${t.name} (${t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : 'Gia Sư'})</option>
        `).join('');
      }
    }

    // Populate student checkboxes
    const cbContainer = document.getElementById('adminClassStudentCheckboxes');
    if (cbContainer) {
      const students = Store.getStudents();
      if (students.length === 0) {
        cbContainer.innerHTML = '<div style="padding:10px; color:var(--text-muted); font-size:13px; text-align:center;">Chưa có học sinh nào trên hệ thống.</div>';
      } else {
        cbContainer.innerHTML = students.map(s => `
          <label style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; background:#ffffff; border:1px solid #e2e8f0; margin-bottom:4px; cursor:pointer; font-size:13px;">
            <input type="checkbox" value="${s.id}" class="admin-cls-std-cb" onchange="AdminView.updateClassStudentCountBadge()">
            <strong>${s.name}</strong>
            <small style="color:var(--text-muted);">(${s.grade || 'Lớp 12'} • TK: ${s.username || 'Chưa cấp'})</small>
          </label>
        `).join('');
      }
    }
    this.updateClassStudentCountBadge();

    const modal = document.getElementById('adminClassModal');
    if (modal) modal.classList.add('active');
  },

  deleteClassFromModal() {
    const classId = document.getElementById('adminClassId')?.value;
    const name = document.getElementById('adminClassName')?.value || 'Lớp học';
    if (!classId) return;
    App.closeModal('adminClassModal');
    this.confirmDeleteClass(classId, name);
  },

  openEditClassModal(classId) {
    const cls = Store.getClassById(classId);
    if (!cls) return;

    const idEl = document.getElementById('adminClassId');
    if (idEl) idEl.value = cls.id;
    const nameEl = document.getElementById('adminClassName');
    if (nameEl) nameEl.value = cls.name;
    const codeEl = document.getElementById('adminClassCode');
    if (codeEl) codeEl.value = cls.code || '';
    const gradeEl = document.getElementById('adminClassGrade');
    if (gradeEl) gradeEl.value = cls.grade || 'Lớp 12';
    const subjEl = document.getElementById('adminClassSubject');
    if (subjEl) subjEl.value = cls.subject || 'Toán Học THPT';
    const roomEl = document.getElementById('adminClassRoom');
    if (roomEl) roomEl.value = cls.room || '';

    const titleEl = document.getElementById('adminClassModalTitle');
    if (titleEl) titleEl.textContent = `Chỉnh Sửa Lớp: ${cls.name}`;
    const subEl = document.getElementById('adminClassModalSubtitle');
    if (subEl) subEl.textContent = 'Cập nhật thông tin lớp, đổi giáo viên phụ trách và danh sách học sinh';

    const delBtn = document.getElementById('adminClassDeleteBtn');
    if (delBtn) delBtn.style.display = 'inline-flex';

    // Populate tutors
    const tutorSelect = document.getElementById('adminClassTutorSelect');
    if (tutorSelect) {
      const tutors = Store.getTutors();
      if (tutors.length === 0) {
        tutorSelect.innerHTML = '<option value="">-- Chưa có Gia Sư --</option>';
      } else {
        tutorSelect.innerHTML = tutors.map(t => `
          <option value="${t.id}" ${t.id === cls.tutorId ? 'selected' : ''}>
            ${t.name} (${t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : 'Gia Sư'})
          </option>
        `).join('');
      }
    }

    // Populate student checkboxes
    const cbContainer = document.getElementById('adminClassStudentCheckboxes');
    if (cbContainer) {
      const students = Store.getStudents();
      const currentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
      cbContainer.innerHTML = students.map(s => {
        const isChecked = currentIds.includes(s.id);
        return `
          <label style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; background:${isChecked ? '#e0f2fe' : '#ffffff'}; border:1px solid ${isChecked ? '#7dd3fc' : '#e2e8f0'}; margin-bottom:4px; cursor:pointer; font-size:13px;">
            <input type="checkbox" value="${s.id}" class="admin-cls-std-cb" ${isChecked ? 'checked' : ''} onchange="AdminView.updateClassStudentCountBadge()">
            <strong>${s.name}</strong>
            <small style="color:var(--text-muted);">(${s.grade || 'Lớp 12'} • TK: ${s.username || 'Chưa cấp'})</small>
          </label>
        `;
      }).join('');
    }
    this.updateClassStudentCountBadge();

    const modal = document.getElementById('adminClassModal');
    if (modal) modal.classList.add('active');
  },

  updateClassStudentCountBadge() {
    const cbs = document.querySelectorAll('.admin-cls-std-cb:checked');
    const badge = document.getElementById('adminClassStudentCountBadge');
    if (badge) {
      badge.textContent = `Đã chọn ${cbs.length} học sinh`;
    }
  },

  submitSaveClass() {
    const classId = document.getElementById('adminClassId')?.value;
    const name = document.getElementById('adminClassName')?.value.trim();
    const code = document.getElementById('adminClassCode')?.value.trim().toUpperCase() || ('LOP' + Math.floor(1000 + Math.random() * 9000));
    const grade = document.getElementById('adminClassGrade')?.value || 'Lớp 12';
    const subject = document.getElementById('adminClassSubject')?.value.trim() || 'Toán Học';
    const room = document.getElementById('adminClassRoom')?.value.trim() || 'Phòng Học Trực Tuyến';
    const tutorId = document.getElementById('adminClassTutorSelect')?.value || '';
    const tutor = tutorId ? Store.getUserById(tutorId) : null;
    const tutorName = tutor ? tutor.name : 'Chưa phân công';

    if (!name) {
      App.showToast('Vui lòng nhập tên lớp học!', 'error');
      return;
    }

    const checkedCbs = document.querySelectorAll('.admin-cls-std-cb:checked');
    const selectedStudentIds = Array.from(checkedCbs).map(cb => cb.value);

    if (classId) {
      Store.updateClass(classId, {
        name,
        code,
        grade,
        subject,
        room,
        tutorId,
        tutorName,
        studentIds: selectedStudentIds
      });
      App.showToast(`✓ Đã cập nhật thông tin lớp "${name}"!`, 'success');
    } else {
      const newCls = {
        id: 'cls_' + Date.now(),
        name,
        code,
        grade,
        subject,
        room,
        tutorId,
        tutorName,
        studentIds: selectedStudentIds,
        announcements: [
          {
            id: 'ann_' + Date.now(),
            title: `Chào mừng các em đến với ${name}!`,
            content: `Lớp học được quản lý trên hệ thống EduTask PB. Giáo viên phụ trách: ${tutorName}. Chúc các em học tốt!`,
            authorName: 'Hệ thống Quản trị EduTask',
            createdAt: new Date().toISOString()
          }
        ]
      };
      Store.addClass(newCls);
      App.showToast(`🎉 Đã tạo thành công lớp học "${name}" (Mã: ${code}) do ${tutorName} phụ trách!`, 'success');
    }

    if (window.CloudSync && typeof CloudSync.pushData === 'function') {
      CloudSync.pushData(Store.data, true);
    }
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }

    App.closeModal('adminClassModal');
    App.renderCurrentView();
  },

  confirmDeleteClass(classId, className) {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${className}" khỏi hệ thống?\n\nLưu ý: Dữ liệu bài tập và học sinh sẽ được bảo toàn, chỉ giải tán danh mục lớp này.`)) {
      return;
    }
    Store.deleteClass(classId);
    if (typeof TutorView !== 'undefined' && TutorView.selectedClassId === classId) {
      TutorView.selectedClassId = null;
    }
    if (window.CloudSync && typeof CloudSync.pushData === 'function') {
      CloudSync.pushData(Store.data, true);
    }
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }
    App.showToast(`✓ Đã xóa vĩnh viễn lớp học "${className}"!`, 'info');
    App.renderCurrentView();
  },

  openClassGradebookModal(classId) {
    const cls = Store.getClassById(classId);
    if (!cls) return;
    this.currentGradebookClassId = classId;

    const titleEl = document.getElementById('adminGradebookModalTitle');
    if (titleEl) titleEl.textContent = `Sổ Điểm Điện Tử: ${cls.name}`;
    const subEl = document.getElementById('adminGradebookModalSubtitle');
    if (subEl) subEl.textContent = `Mã lớp: ${cls.code} • Phụ trách: ${cls.tutorName} • Khối: ${cls.grade} • Phòng: ${cls.room || 'Phòng học'}`;

    const contentEl = document.getElementById('adminClassGradebookContent');
    if (contentEl) {
      contentEl.innerHTML = this.renderClassGradebookContent(classId);
    }

    const modal = document.getElementById('adminClassGradebookModal');
    if (modal) modal.classList.add('active');
  },

  renderClassGradebookContent(classId) {
    const gradebook = Store.getClassGradebook(classId);
    if (!gradebook) {
      return '<div style="padding:30px; text-align:center; color:var(--text-muted);">Không thể tính toán sổ điểm cho lớp này.</div>';
    }

    const { students, assignments, matrix, rankings, classAvg, distribution } = gradebook;

    let html = `
      <!-- Thẻ Phổ Điểm & KPI Lớp Học -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:14px;">
        <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:10px; text-align:center;">
          <small style="color:#4338ca; font-weight:700; text-transform:uppercase; font-size:10.5px;">Điểm TB Cả Lớp</small>
          <div style="font-size:22px; font-weight:900; color:#312e81; margin-top:2px;">${classAvg !== 'Chưa có' ? classAvg + 'đ' : 'Chưa có'}</div>
        </div>
        <div style="background:#dcfce7; border:1px solid #86efac; border-radius:10px; padding:10px; text-align:center;">
          <small style="color:#15803d; font-weight:700; text-transform:uppercase; font-size:10.5px;">🟢 Giỏi (≥ 8.5)</small>
          <div style="font-size:20px; font-weight:800; color:#14532d; margin-top:2px;">${distribution.excellent.count} <span style="font-size:12px; font-weight:normal;">(${distribution.excellent.percent}%)</span></div>
        </div>
        <div style="background:#e0f2fe; border:1px solid #7dd3fc; border-radius:10px; padding:10px; text-align:center;">
          <small style="color:#0369a1; font-weight:700; text-transform:uppercase; font-size:10.5px;">🔵 Khá (7.0-8.4)</small>
          <div style="font-size:20px; font-weight:800; color:#0c4a6e; margin-top:2px;">${distribution.good.count} <span style="font-size:12px; font-weight:normal;">(${distribution.good.percent}%)</span></div>
        </div>
        <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:10px; padding:10px; text-align:center;">
          <small style="color:#b45309; font-weight:700; text-transform:uppercase; font-size:10.5px;">🟠 TB (5.0-6.9)</small>
          <div style="font-size:20px; font-weight:800; color:#78350f; margin-top:2px;">${distribution.average.count} <span style="font-size:12px; font-weight:normal;">(${distribution.average.percent}%)</span></div>
        </div>
        <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:10px; padding:10px; text-align:center;">
          <small style="color:#b91c1c; font-weight:700; text-transform:uppercase; font-size:10.5px;">🔴 Yếu (&lt; 5.0)</small>
          <div style="font-size:20px; font-weight:800; color:#7f1d1d; margin-top:2px;">${distribution.weak.count} <span style="font-size:12px; font-weight:normal;">(${distribution.weak.percent}%)</span></div>
        </div>
      </div>
    `;

    if (students.length === 0) {
      html += `
        <div style="padding:32px; text-align:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; color:var(--text-muted);">
          👥 Lớp học này hiện chưa có học sinh nào.
          <div style="margin-top:8px;">
            <button class="btn btn-sm btn-primary" onclick="App.closeModal('adminClassGradebookModal'); AdminView.openAddStudentToClassModal('${classId}')">➕ Thêm học sinh vào lớp ngay</button>
          </div>
        </div>
      `;
      return html;
    }

    // Bảng Ma Trận Điểm
    html += `
      <div class="gradebook-table-container" style="border:1px solid #e2e8f0; border-radius:10px; overflow-x:auto;">
        <table class="gradebook-matrix-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">STT</th>
              <th style="text-align:left; min-width:170px;">Học Sinh</th>
    `;

    assignments.forEach((asn, idx) => {
      const scores = matrix.map(r => r.scores[asn.id]).filter(s => typeof s === 'number');
      const asnAvg = scores.length > 0 ? (scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(1) : '—';
      html += `
        <th style="min-width:110px; text-align:center;" title="${asn.title}">
          <div style="font-size:12px; font-weight:800; color:#93c5fd;">Bài ${idx + 1}</div>
          <div style="font-size:11px; font-weight:normal; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${asn.title}</div>
          <div style="font-size:10px; color:#cbd5e1; margin-top:2px;">TB: ${asnAvg}đ</div>
        </th>
      `;
    });

    html += `
              <th style="width:70px; text-align:center; background:#1e293b; color:#fbbf24;">ĐTB</th>
              <th style="width:65px; text-align:center; background:#1e293b;">Hạng</th>
              <th style="width:75px; text-align:center; background:#1e293b;">Học Lực</th>
            </tr>
          </thead>
          <tbody>
    `;

    matrix.forEach((row, idx) => {
      const rankIdx = rankings.findIndex(r => r.student.id === row.student.id) + 1;
      let badgeClass = 'score-pill-excellent';
      if (row.classification === 'Khá') badgeClass = 'score-pill-good';
      else if (row.classification === 'Trung Bình') badgeClass = 'score-pill-average';
      else if (row.classification === 'Yếu') badgeClass = 'score-pill-weak';
      else if (row.classification === 'Chưa xếp loại') badgeClass = 'score-pill-empty';

      html += `
        <tr>
          <td style="text-align:center; font-weight:600; color:#64748b;">${idx + 1}</td>
          <td style="text-align:left;">
            <strong style="color:var(--text-main); font-size:13.5px;">${row.student.name}</strong>
            <div style="font-size:11px; color:var(--text-muted);">${row.student.grade || ''} • ${row.student.username || ''}</div>
          </td>
      `;

      assignments.forEach(asn => {
        const sc = row.scores[asn.id];
        let pillClass = 'score-pill-empty';
        let displayText = '—';
        if (typeof sc === 'number') {
          displayText = sc;
          if (sc >= 8.5) pillClass = 'score-pill-excellent';
          else if (sc >= 7.0) pillClass = 'score-pill-good';
          else if (sc >= 5.0) pillClass = 'score-pill-average';
          else pillClass = 'score-pill-weak';
        } else if (sc === 'pending') {
          displayText = '⏳';
          pillClass = 'score-pill-pending';
        }
        html += `
          <td style="text-align:center;">
            <span class="score-cell-pill ${pillClass}">${displayText}</span>
          </td>
        `;
      });

      html += `
          <td style="text-align:center; font-weight:900; font-size:14px; color:#1e40af;">
            ${row.avgScore !== null ? row.avgScore + 'đ' : '—'}
          </td>
          <td style="text-align:center; font-weight:800; color:#d97706;">
            ${rankIdx === 1 ? '🥇' : rankIdx === 2 ? '🥈' : rankIdx === 3 ? '🥉' : `#${rankIdx}`}
          </td>
          <td style="text-align:center;">
            <span class="score-cell-pill ${badgeClass}" style="font-size:11px; padding:2px 6px;">
              ${row.classification}
            </span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  },

  exportCurrentGradebookCSV() {
    if (!this.currentGradebookClassId) return;
    this.exportClassGradebookCSV(this.currentGradebookClassId);
  },

  exportClassGradebookCSV(classId) {
    const cls = Store.getClassById(classId);
    const gradebook = Store.getClassGradebook(classId);
    if (!cls || !gradebook) {
      App.showToast('Không có dữ liệu để xuất sổ điểm!', 'error');
      return;
    }

    const { students, assignments, matrix, rankings } = gradebook;
    const headerRow = ['STT', 'Họ Và Tên', 'Tài Khoản', 'Khối Lớp', 'SĐT Phụ Huynh'];
    assignments.forEach((asn, idx) => {
      headerRow.push(`Bài ${idx + 1}: ${asn.title}`);
    });
    headerRow.push('Điểm TB', 'Xếp Hạng', 'Học Lực');

    const csvRows = [headerRow];
    matrix.forEach((r, idx) => {
      const rankIdx = rankings.findIndex(item => item.student.id === r.student.id) + 1;
      const row = [
        idx + 1,
        `"${r.student.name.replace(/"/g, '""')}"`,
        r.student.username || '',
        r.student.grade || '',
        `'${r.student.parentPhone || r.student.phone || ''}`
      ];
      assignments.forEach(asn => {
        const sc = r.scores[asn.id];
        row.push(typeof sc === 'number' ? sc : (sc === 'pending' ? 'Chờ chấm' : 'Chưa nộp'));
      });
      row.push(r.avgScore !== null ? r.avgScore : '—', rankIdx, `"${r.classification}"`);
      csvRows.push(row);
    });

    const csvContent = '\uFEFF' + csvRows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoDiem_${(cls.code || 'LOP')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast(`✓ Đã xuất sổ điểm lớp "${cls.name}" ra file Excel/CSV!`, 'success');
  },

  exportAllClassesCsv() {
    const classes = Store.getClasses();
    if (classes.length === 0) {
      App.showToast('Chưa có lớp học nào trong hệ thống!', 'warning');
      return;
    }

    const header = ['STT', 'Mã Lớp', 'Tên Lớp', 'Khối', 'Môn Học', 'Phòng Học', 'Giáo Viên Phụ Trách', 'Sĩ Số', 'Số Bài Tập', 'Điểm TB Lớp'];
    const rows = [header];

    classes.forEach((cls, idx) => {
      const gradebook = Store.getClassGradebook(cls.id);
      const students = Store.getStudentsByClass(cls.id);
      const assignments = gradebook ? gradebook.assignments : [];
      const avg = gradebook ? (gradebook.classAvg || 0) : 0;

      rows.push([
        idx + 1,
        cls.code || '',
        `"${(cls.name || '').replace(/"/g, '""')}"`,
        cls.grade || '',
        `"${(cls.subject || '').replace(/"/g, '""')}"`,
        `"${(cls.room || '').replace(/"/g, '""')}"`,
        `"${(cls.tutorName || '').replace(/"/g, '""')}"`,
        students.length,
        assignments.length,
        avg
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DanhSach_LopHoc_EduTask_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast('✓ Đã xuất danh sách toàn bộ lớp học ra file Excel/CSV!', 'success');
  },

  openClassMembersModal(classId) {
    const cls = Store.getClassById(classId);
    if (!cls) return;
    this.currentMembersClassId = classId;

    const idEl = document.getElementById('adminMembersClassId');
    if (idEl) idEl.value = classId;
    const titleEl = document.getElementById('adminMembersModalTitle');
    if (titleEl) titleEl.textContent = `Thành Viên: ${cls.name}`;
    const subEl = document.getElementById('adminMembersModalSubtitle');
    if (subEl) subEl.textContent = `Mã lớp: ${cls.code} • Phụ trách: ${cls.tutorName}`;

    this.renderClassMembersList(classId);

    const modal = document.getElementById('adminClassMembersModal');
    if (modal) modal.classList.add('active');
  },

  renderClassMembersList(classId) {
    const cls = Store.getClassById(classId);
    if (!cls) return;
    const students = Store.getStudentsByClass(classId);

    const sumEl = document.getElementById('adminMembersClassSummary');
    if (sumEl) sumEl.textContent = `Sĩ số: ${students.length} học sinh trong lớp`;

    const container = document.getElementById('adminClassMembersListContainer');
    if (!container) return;

    if (students.length === 0) {
      container.innerHTML = `
        <div style="padding:24px; text-align:center; color:var(--text-muted); background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
          Lớp này chưa có học sinh nào. Bấm <strong>"➕ Thêm Học Sinh Vào Lớp"</strong> để xếp học sinh vào lớp.
        </div>
      `;
      return;
    }

    container.innerHTML = students.map((s, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#ffffff; border-radius:8px; border:1px solid #e2e8f0; transition:all 0.15s ease;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="user-avatar" style="width:34px; height:34px; font-size:12px;">${s.avatarText || s.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong style="font-size:13.5px; color:var(--text-main);">${s.name}</strong>
            <small style="color:var(--text-muted); display:block;">${s.grade || 'Lớp 12'} • TK: <code>${s.username || 'chưa cấp'}</code> • SĐT: ${s.parentPhone || s.phone || 'Chưa có'}</small>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-xs btn-outline" onclick="App.closeModal('adminClassMembersModal'); AdminView.openStudentProfileModal('${s.id}')" title="Xem hồ sơ học sinh">
            👁️ Hồ sơ
          </button>
          <button class="btn btn-xs btn-danger" onclick="AdminView.removeStudentFromClass('${classId}', '${s.id}')" title="Xóa học sinh này khỏi lớp">
            ✕ Xóa khỏi lớp
          </button>
        </div>
      </div>
    `).join('');
  },

  openAddStudentToClassModal(classId) {
    const targetClassId = classId || this.currentMembersClassId;
    if (!targetClassId) return;
    this.currentMembersClassId = targetClassId;

    const cls = Store.getClassById(targetClassId);
    if (!cls) return;

    const allStudents = Store.getStudents();
    const currentStudentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
    const availableStudents = allStudents.filter(s => !currentStudentIds.includes(s.id));

    const listEl = document.getElementById('adminAvailableStudentsForClassList');
    if (listEl) {
      if (availableStudents.length === 0) {
        listEl.innerHTML = `
          <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">
            ✓ Tất cả học sinh trong hệ thống đã có mặt trong lớp này!
          </div>
        `;
      } else {
        listEl.innerHTML = availableStudents.map(s => `
          <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; background:#ffffff; border:1px solid #e2e8f0; cursor:pointer; font-size:13px;">
            <input type="checkbox" value="${s.id}" class="admin-add-cls-cb">
            <strong>${s.name}</strong>
            <span style="color:var(--text-muted); font-size:12px;">(${s.grade || 'Lớp 12'} • ${s.assignedTutorName || 'Gia sư'})</span>
          </label>
        `).join('');
      }
    }

    const modal = document.getElementById('adminAddStudentToClassModal');
    if (modal) modal.classList.add('active');
  },

  submitAddStudentsToClass() {
    if (!this.currentMembersClassId) return;
    const cbs = document.querySelectorAll('.admin-add-cls-cb:checked');
    if (cbs.length === 0) {
      App.showToast('Vui lòng tích chọn ít nhất 1 học sinh để thêm!', 'warning');
      return;
    }

    let addedCount = 0;
    cbs.forEach(cb => {
      const ok = Store.addStudentToClass(this.currentMembersClassId, cb.value);
      if (ok) addedCount++;
    });

    if (window.CloudSync && typeof CloudSync.pushData === 'function') {
      CloudSync.pushData(Store.data, true);
    }
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }

    App.closeModal('adminAddStudentToClassModal');
    App.showToast(`✓ Đã thêm ${addedCount} học sinh vào lớp thành công!`, 'success');
    this.renderClassMembersList(this.currentMembersClassId);
    App.renderCurrentView();
  },

  removeStudentFromClass(classId, studentId) {
    const std = Store.getUserById(studentId);
    const cls = Store.getClassById(classId);
    if (!confirm(`Xác nhận xóa học sinh "${std ? std.name : 'này'}" khỏi lớp "${cls ? cls.name : ''}"?`)) {
      return;
    }

    Store.removeStudentFromClass(classId, studentId);
    if (window.CloudSync && typeof CloudSync.pushData === 'function') {
      CloudSync.pushData(Store.data, true);
    }
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }

    App.showToast(`✓ Đã xóa học sinh khỏi lớp!`, 'info');
    this.renderClassMembersList(classId);
    App.renderCurrentView();
  },

  submitChangeStudentClassFromModal(studentId) {
    const select = document.getElementById('profStudentClassSelect');
    if (!select) return;
    const targetClassId = select.value;

    Store.setStudentClass(studentId, targetClassId);
    if (window.CloudSync && typeof CloudSync.pushData === 'function') {
      CloudSync.pushData(Store.data, true);
    }
    if (window.GitHubSync && typeof GitHubSync.pushToGitHub === 'function') {
      GitHubSync.pushToGitHub(Store.data, false);
    }

    const cls = Store.getClassById(targetClassId);
    const std = Store.getUserById(studentId);
    App.showToast(`✓ Đã xếp học sinh "${std ? std.name : ''}" vào ${cls ? cls.name : 'học kèm 1-1'}!`, 'success');
    this.openStudentProfileModal(studentId);
    App.renderCurrentView();
  },

  openClassEvaluationFromAdmin(classId = null) {
    const targetClassId = classId || this.currentGradebookClassId;
    const cls = Store.getClassById(targetClassId);
    if (!cls) {
      App.showToast('Không tìm thấy lớp học!', 'error');
      return;
    }

    App.closeModal('adminClassGradebookModal');
    // Admin chuyển ngay sang góc nhìn Bàn Giáo Viên phụ trách lớp và mở tab Đánh Giá Toàn Lớp
    Auth.adminSupervise(cls.tutorId, cls.id);
    if (typeof TutorView !== 'undefined') {
      TutorView.setClassTab('evaluation');
    }
  },

  openClassHistoryFromAdmin(classId = null) {
    const targetClassId = classId || this.currentGradebookClassId;
    const cls = Store.getClassById(targetClassId);
    if (!cls) {
      App.showToast('Không tìm thấy lớp học!', 'error');
      return;
    }

    App.closeModal('adminClassGradebookModal');
    // Admin chuyển ngay sang góc nhìn Bàn Giáo Viên phụ trách lớp và mở tab Lịch Sử & Thống Kê
    Auth.adminSupervise(cls.tutorId, cls.id);
    if (typeof TutorView !== 'undefined') {
      TutorView.setClassTab('history');
    }
  },

  createAssignmentForCurrentClass() {
    if (!this.currentGradebookClassId) return;
    const clsId = this.currentGradebookClassId;
    App.closeModal('adminClassGradebookModal');
    App.openCreateAssignmentModal(null, clsId);
  }
};

if (typeof window !== 'undefined') {
  window.AdminView = AdminView;
}

