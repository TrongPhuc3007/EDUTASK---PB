/**
 * EDUTASK PRO — TUTOR MODULE (CẤP 2: GIA SƯ PHỤ TRÁCH)
 * Bàn làm việc chuyên môn cao cấp: Giao bài 1-1, lọc theo từng học sinh,
 * chấm bài bút đỏ trực quan, và tự động tạo tin nhắn Zalo gửi Phụ huynh.
 */

const TutorView = {
  currentFilter: 'all',          // 'all', 'pending_grading', 'waiting_submission', 'completed'
  selectedStudentId: null,       // null = tất cả, hoặc 'u_std_quang',...
  searchKeyword: '',

  /**
   * Phân loại trạng thái duy nhất, không trùng lặp cho mỗi đề bài tập:
   * - 'pending_grading': Có bài nộp của học sinh (trong phạm vi đang xem) đang chờ gia sư chấm điểm.
   * - 'waiting_submission': Chưa nộp đủ bài và không có bài nào đang chờ chấm (học sinh đang làm bài).
   * - 'completed': 100% học sinh được giao đã nộp và toàn bộ đã được chấm xong.
   * Đảm bảo bất biến toán học: Tổng đề = Chờ chấm + Đang làm + Đã hoàn thành (100% chuẩn xác).
   */
  getAsnStatus(asn, selectedStudentId = null) {
    const targetIds = selectedStudentId 
      ? [selectedStudentId] 
      : (asn.targetStudentIds || []);

    if (targetIds.length === 0) {
      return {
        status: 'waiting_submission',
        label: 'Chưa có HS',
        badgeStyle: 'background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;',
        icon: '⚪',
        pendingCount: 0,
        gradedCount: 0,
        totalTargets: 0,
        submittedCount: 0
      };
    }

    const allSubs = Store.getSubmissionsByAssignment(asn.id);
    const relevantSubs = allSubs.filter(s => targetIds.includes(s.studentId));
    const pendingSubs = relevantSubs.filter(s => s.status === 'submitted');
    const gradedSubs = relevantSubs.filter(s => s.status === 'graded');

    // 1. Nếu có bài nộp đang chờ chấm -> Cần giáo viên chấm ngay
    if (pendingSubs.length > 0) {
      return {
        status: 'pending_grading',
        label: `Chờ chấm (${pendingSubs.length})`,
        badgeStyle: 'background:#fef3c7; color:#b45309; border:1px solid #fde68a;',
        icon: '⏳',
        pendingCount: pendingSubs.length,
        gradedCount: gradedSubs.length,
        totalTargets: targetIds.length,
        submittedCount: relevantSubs.length
      };
    }

    // 2. Nếu tất cả học sinh mục tiêu đều ĐÃ nộp và TẤT CẢ đã được chấm điểm -> Hoàn thành
    const allGraded = targetIds.every(sid => gradedSubs.some(s => s.studentId === sid));
    if (allGraded) {
      return {
        status: 'completed',
        label: 'Đã hoàn thành',
        badgeStyle: 'background:#dcfce7; color:#15803d; border:1px solid #86efac;',
        icon: '✅',
        pendingCount: 0,
        gradedCount: gradedSubs.length,
        totalTargets: targetIds.length,
        submittedCount: relevantSubs.length
      };
    }

    // 3. Ngược lại: Học sinh đang làm bài / Chưa nộp bài
    return {
      status: 'waiting_submission',
      label: `Đang làm (${relevantSubs.length}/${targetIds.length})`,
      badgeStyle: 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;',
      icon: '✍️',
      pendingCount: 0,
      gradedCount: gradedSubs.length,
      totalTargets: targetIds.length,
      submittedCount: relevantSubs.length
    };
  },

  render(container) {
    const currentUser = Auth.getCurrentUser();
    const isSupervising = Auth.isAdminSupervising();
    const isMasterAdmin = Auth.isRealAdmin() && !isSupervising;
    const currentTutorId = currentUser ? currentUser.id : 'u_tutor';

    // Lấy học sinh thuộc quyền phụ trách của gia sư này (hoặc tất cả nếu là Master Admin)
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    // Lấy bài tập thuộc phạm vi giảng dạy của gia sư này
    const allAssignments = Store.getAllAssignments().filter(asn => {
      if (isMasterAdmin) return true;
      if (asn.tutorId && asn.tutorId === currentTutorId) return true;
      return asn.targetStudentIds && asn.targetStudentIds.some(sid => students.some(std => std.id === sid));
    });

    // Đồng bộ an toàn: Nếu học sinh đang chọn đã học xong hoặc bị Admin xóa thì reset bộ lọc
    if (this.selectedStudentId && !students.some(s => s.id === this.selectedStudentId)) {
      this.selectedStudentId = null;
    }

    // Phạm vi bài tập đang xét (đã tính theo học sinh được chọn nếu có)
    const scopedAssignments = this.selectedStudentId 
      ? allAssignments.filter(asn => asn.targetStudentIds && asn.targetStudentIds.includes(this.selectedStudentId))
      : allAssignments;

    // Phân loại toàn bộ scopedAssignments theo 3 trạng thái loại trừ nhau 100%:
    // 1. Chờ chấm bài: Có ít nhất 1 bài nộp của học sinh đang ở trạng thái 'submitted' (cần giáo viên chấm)
    // 2. Đang làm bài: Chưa nộp bài (hoặc chưa nộp đủ và không có bài nào đang chờ chấm)
    // 3. Đã hoàn thành: 100% học sinh được giao đã nộp và tất cả bài nộp đã được chấm điểm ('graded')
    const pendingGradingAsns = [];
    const waitingSubmissionAsns = [];
    const completedAsns = [];

    scopedAssignments.forEach(asn => {
      const st = this.getAsnStatus(asn, this.selectedStudentId);
      if (st.status === 'pending_grading') {
        pendingGradingAsns.push(asn);
      } else if (st.status === 'completed') {
        completedAsns.push(asn);
      } else {
        waitingSubmissionAsns.push(asn);
      }
    });

    // Đếm tổng số bài nộp thực tế của học sinh đang chờ chấm bút đỏ
    let totalPendingSubmissions = 0;
    scopedAssignments.forEach(asn => {
      const targetIds = this.selectedStudentId ? [this.selectedStudentId] : (asn.targetStudentIds || []);
      const subs = Store.getSubmissionsByAssignment(asn.id).filter(s => targetIds.includes(s.studentId) && s.status === 'submitted');
      totalPendingSubmissions += subs.length;
    });

    container.innerHTML = `
      <!-- Banner Gia Sư Chuyên Nghiệp -->
      <div class="view-banner" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4f46e5 100%);">
        <div class="banner-info">
          <h2>Bàn Làm Việc Gia Sư Trực Tiếp</h2>
          <div style="font-size:13.5px; color:rgba(255,255,255,0.95); margin-bottom:4px;">
            Gia sư phụ trách: <strong>${currentUser ? currentUser.name : 'Gia Sư'}</strong> <span style="font-family:var(--font-mono); font-weight:700; color:#fde68a;">(TK: ${currentUser ? currentUser.username : 'giasu'})</span>
          </div>
          <p>Quản lý học sinh phân công dạy kèm, theo dõi lộ trình từng em, chấm bài bút đỏ và gửi báo cáo Zalo.</p>
        </div>
        <div class="banner-actions" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-white" id="btnTutorCreateAssignment" onclick="App.openCreateAssignmentModal()">
            ➕ Giao Bài (1-1)
          </button>
          <button class="btn btn-secondary" onclick="GatewayView.openRegisterModal('student')" title="Tạo tài khoản học sinh mới vào lớp kèm 1-1">
            🎒 ➕ Thêm Học Sinh
          </button>
          <button class="btn btn-secondary" onclick="TutorView.openZaloModal()" title="Tạo báo cáo chi tiết gửi Zalo phụ huynh">
            💬 Báo Cáo Zalo
          </button>
          <button class="btn btn-secondary" onclick="TutorView.exportGradesCSV()" title="Xuất toàn bộ bảng điểm lớp ra file Excel/CSV">
            📊 Xuất Bảng Điểm CSV
          </button>
          <button class="btn btn-secondary" onclick="TutorView.remindAllStudents()" title="Gom danh sách học sinh chưa nộp bài và tạo tin nhắn Zalo">
            🔔 Nhắc Nộp Bài
          </button>
        </div>
      </div>

      <!-- Thẻ Thống Kê Nhanh (KPI Gia Sư) — Đồng Bộ Nhất Quán 100% -->
      <div class="metrics-grid">
        <div class="metric-card ${this.currentFilter === 'all' ? 'active-metric-card' : ''}" style="cursor:pointer;" onclick="TutorView.setFilter('all');" title="Xem tất cả bài tập">
          <div class="metric-icon-box metric-blue">📋</div>
          <div class="metric-data">
            <h4>${scopedAssignments.length} đề</h4>
            <span>${this.selectedStudentId ? 'Tổng bài tập của em' : 'Tổng số đề bài tập'}</span>
          </div>
        </div>

        <div class="metric-card ${this.currentFilter === 'pending_grading' ? 'active-metric-card' : ''}" style="cursor:pointer; border:2px solid ${pendingGradingAsns.length > 0 ? '#f59e0b' : 'var(--border-color)'};" onclick="TutorView.setFilter('pending_grading')" title="Xem các đề có bài nộp chờ chấm">
          <div class="metric-icon-box metric-yellow">⏳</div>
          <div class="metric-data">
            <h4 style="color:#d97706;">${pendingGradingAsns.length} đề</h4>
            <span>Chờ chấm ngay (${totalPendingSubmissions} bài nộp)</span>
          </div>
        </div>

        <div class="metric-card ${this.currentFilter === 'waiting_submission' ? 'active-metric-card' : ''}" style="cursor:pointer;" onclick="TutorView.setFilter('waiting_submission')" title="Xem các đề học sinh đang làm bài">
          <div class="metric-icon-box" style="background:#e0f2fe; color:#0284c7;">✍️</div>
          <div class="metric-data">
            <h4 style="color:#0284c7;">${waitingSubmissionAsns.length} đề</h4>
            <span>Học sinh đang làm bài</span>
          </div>
        </div>

        <div class="metric-card ${this.currentFilter === 'completed' ? 'active-metric-card' : ''}" style="cursor:pointer;" onclick="TutorView.setFilter('completed')" title="Xem các đề đã chấm xong">
          <div class="metric-icon-box metric-green">✅</div>
          <div class="metric-data">
            <h4 style="color:#16a34a;">${completedAsns.length} đề</h4>
            <span>Đã chấm hoàn thành</span>
          </div>
        </div>

        <div class="metric-card" style="cursor:pointer;" onclick="TutorView.setStudentFilter(null); TutorView.setFilter('all');" title="Nhấp để hiển thị toàn bộ danh sách">
          <div class="metric-icon-box metric-purple">🎒</div>
          <div class="metric-data">
            <h4>${students.length} em</h4>
            <span>Học sinh theo học 1-1</span>
          </div>
        </div>
      </div>

      <!-- Thẻ Học Sinh Đang Dạy Kèm -->
      <div class="content-card">
        <div class="card-header">
          <h3>🎒 Danh Sách Học Sinh (${students.length} em)</h3>
          <span class="badge badge-primary">Phân công kèm 1-1</span>
        </div>
        <div class="card-body" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(290px, 1fr)); gap:16px; padding:20px;">
          ${students.map(std => {
            const studentAsns = allAssignments.filter(a => a.targetStudentIds && a.targetStudentIds.includes(std.id));
            const isFilterActive = this.selectedStudentId === std.id;
            const stdPending = studentAsns.filter(a => this.getAsnStatus(a, std.id).status === 'pending_grading').length;
            const stdWaiting = studentAsns.filter(a => this.getAsnStatus(a, std.id).status === 'waiting_submission').length;
            const stdCompleted = studentAsns.filter(a => this.getAsnStatus(a, std.id).status === 'completed').length;

            return `
              <div style="border:1.5px solid ${isFilterActive ? 'var(--primary)' : 'var(--border-color)'}; border-radius:12px; padding:16px; background:${isFilterActive ? '#f5f3ff' : '#ffffff'}; display:flex; flex-direction:column; gap:10px; box-shadow:var(--shadow-sm); transition:all 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="user-avatar" style="width:32px; height:32px; font-size:12px;">
                      ${std.avatarText || std.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong style="font-size:14.5px; color:var(--text-main);">${std.name}</strong>
                      <div style="font-size:12px; color:var(--primary); font-family:var(--font-mono); font-weight:700; margin-top:2px;">
                        TK: ${std.username || 'Chưa cấp'}
                      </div>
                      ${std.school ? `<small style="color:var(--text-muted);">${std.school}</small>` : ''}
                    </div>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span class="badge badge-primary">${std.grade}</span>
                    <span class="badge ${std.hasAccount ? 'badge-success' : 'badge-danger'}" style="font-size:10.5px;">
                      ${std.hasAccount ? '✓ Đã có TK' : '🔒 Chưa có TK'}
                    </span>
                  </div>
                </div>

                <div style="font-size:13px; color:var(--text-muted);">
                  Mục tiêu: <strong style="color:var(--primary); font-size:14px;">${std.currentScore} ➔ ${std.targetScore}đ</strong>
                </div>

                ${std.weaknesses ? `
                  <div style="font-size:12px; color:var(--danger); background:#fef2f2; border:1px solid #fecaca; padding:6px 10px; border-radius:6px; line-height:1.4;">
                    ⚠️ <strong>Lỗ hổng:</strong> ${std.weaknesses}
                  </div>
                ` : ''}

                <div style="font-size:12.5px; color:var(--text-muted); display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Tổng bài tập: <strong style="color:var(--text-main); font-size:13.5px;">${studentAsns.length} đề</strong></span>
                    <span>Lịch: <strong>${std.schedule ? std.schedule.split('(')[0] : 'Chưa xếp'}</strong></span>
                  </div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; font-size:11px;">
                    <span class="badge" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;" title="${stdPending} đề có bài nộp chờ chấm">
                      ⏳ ${stdPending} chờ chấm
                    </span>
                    <span class="badge" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe;" title="${stdWaiting} đề đang làm / chưa nộp">
                      ✍️ ${stdWaiting} đang làm
                    </span>
                    <span class="badge" style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0;" title="${stdCompleted} đề đã hoàn thành">
                      ✅ ${stdCompleted} xong
                    </span>
                  </div>
                </div>

                <div style="display:flex; gap:6px; margin-top:auto; padding-top:6px; align-items:center; flex-wrap:wrap;">
                  <button class="btn btn-outline btn-sm" onclick="AdminView.openStudentProfileModal('${std.id}')" title="Xem hồ sơ chi tiết">
                    👁️ Hồ Sơ
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="AdminView.openEditStudentModal('${std.id}')" title="Chỉnh sửa thông tin học sinh (Tên, học phí, mục tiêu...)">
                    ✏️ Sửa
                  </button>
                  <button class="btn ${isFilterActive ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TutorView.setStudentFilter('${std.id}')" title="Lọc xem riêng bài tập em này" style="flex:1;">
                    ${isFilterActive ? '✓ Đang xem bài' : '🔍 Xem bài em này'}
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="App.openCreateAssignmentModal('${std.id}')" title="Giao bài riêng 1-1">
                    🎯 Giao bài
                  </button>
                  <button class="btn btn-danger btn-sm" style="padding:6px 9px;" onclick="AdminView.confirmDeleteStudent('${std.id}', '${std.name}')" title="Xóa học sinh này">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Khu vực Danh Sách Bài Tập (Với Bộ Lọc Thông Minh) -->
      <div class="content-card">
        <div class="card-header">
          <h3>📋 Quản Lý Bài Tập & Chấm Điểm</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-outline" onclick="TutorView.remindAllStudents()">
              🔔 Nhắc nộp bài
            </button>
            <button class="btn btn-sm btn-secondary" onclick="TutorView.openZaloModal()">
              💬 Tạo tin Zalo
            </button>
          </div>
        </div>

        <!-- Thanh Chọn Nhanh Học Sinh (Chips Bar) -->
        <div class="student-filter-chips">
          <span style="font-size:12.5px; font-weight:700; color:var(--text-muted); margin-right:4px;">Lọc theo học sinh:</span>
          <div class="student-chip ${this.selectedStudentId === null ? 'active' : ''}" onclick="TutorView.setStudentFilter(null)">
            ⭐ Tất cả học sinh
            <span class="chip-badge">${allAssignments.length}</span>
          </div>
          ${students.map(std => {
            const studentAsns = allAssignments.filter(a => a.targetStudentIds && a.targetStudentIds.includes(std.id));
            const count = studentAsns.length;
            const active = this.selectedStudentId === std.id;
            const pendingForStd = studentAsns.filter(a => this.getAsnStatus(a, std.id).status === 'pending_grading').length;
            return `
              <div class="student-chip ${active ? 'active' : ''}" onclick="TutorView.setStudentFilter('${std.id}')" title="Tài khoản: ${std.username} • Đang có ${count} bài tập">
                <span>👤 ${std.name} <small style="font-family:var(--font-mono); font-size:11px; opacity:0.85;">(${std.username})</small></span>
                <span class="chip-badge" ${pendingForStd > 0 ? 'style="background:#f59e0b; color:#ffffff;" title="' + pendingForStd + ' bài chờ chấm"' : ''}>${count}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Filter Tabs & Ô Tìm Kiếm Bài Tập Thời Gian Thực -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:0 20px 10px 20px; border-bottom:1px solid #e2e8f0;">
          <div class="filter-tabs" style="margin:0; border:none; padding:0;">
            <div class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" onclick="TutorView.setFilter('all')">
              📋 Tất cả (${scopedAssignments.length})
            </div>
            <div class="filter-tab ${this.currentFilter === 'pending_grading' ? 'active' : ''}" onclick="TutorView.setFilter('pending_grading')">
              ⏳ Chờ chấm (${pendingGradingAsns.length})
            </div>
            <div class="filter-tab ${this.currentFilter === 'waiting_submission' ? 'active' : ''}" onclick="TutorView.setFilter('waiting_submission')">
              ✍️ Đang làm (${waitingSubmissionAsns.length})
            </div>
            <div class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" onclick="TutorView.setFilter('completed')">
              ✅ Đã xong (${completedAsns.length})
            </div>
          </div>
          <div style="position:relative; min-width:200px; flex:1; max-width:320px;">
            <input type="text" id="tutorAsnSearchInput" class="form-control" style="font-size:13px; padding:6px 12px 6px 30px; height:34px;" placeholder="Tìm bài tập theo tiêu đề, chuyên đề..." value="${this.searchKeyword}" oninput="TutorView.handleSearch(this.value)">
            <span style="position:absolute; left:9px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:13px;">🔍</span>
          </div>
        </div>

        <div class="card-body">
          <div class="assignment-grid">
            ${this.renderAssignmentCards(allAssignments)}
          </div>
        </div>
      </div>
    `;
  },

  handleSearch(val) {
    this.searchKeyword = val;
    App.renderCurrentView();
    const input = document.getElementById('tutorAsnSearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  setFilter(filter) {
    this.currentFilter = filter;
    App.renderCurrentView();
  },

  setStudentFilter(studentId) {
    this.selectedStudentId = (this.selectedStudentId === studentId && studentId !== null) ? null : studentId;
    App.renderCurrentView();
  },

  renderAssignmentCards(assignments) {
    let filtered = assignments;

    // Lọc theo học sinh đã chọn
    if (this.selectedStudentId) {
      filtered = filtered.filter(asn => asn.targetStudentIds && asn.targetStudentIds.includes(this.selectedStudentId));
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase().trim();
      filtered = filtered.filter(asn => {
        const titleMatch = (asn.title || '').toLowerCase().includes(kw);
        const descMatch = (asn.description || '').toLowerCase().includes(kw);
        const topicMatch = (asn.topic || '').toLowerCase().includes(kw);
        const subjectMatch = (asn.subject || '').toLowerCase().includes(kw);
        return titleMatch || descMatch || topicMatch || subjectMatch;
      });
    }

    // Lọc theo trạng thái bài tập dựa trên phân loại nhất quán
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(asn => {
        const st = this.getAsnStatus(asn, this.selectedStudentId);
        return st.status === this.currentFilter;
      });
    }

    // Loại bỏ bài tập không còn học sinh nào theo học
    filtered = filtered.filter(asn => asn.targetStudentIds && asn.targetStudentIds.length > 0);

    if (filtered.length === 0) {
      let emptyMsg = "Không có bài tập nào phù hợp với bộ lọc này.";
      if (this.currentFilter === 'pending_grading') {
        emptyMsg = "Hiện không có bài tập nào đang chờ chấm điểm. Toàn bộ bài nộp đã được chấm xong!";
      } else if (this.currentFilter === 'waiting_submission') {
        emptyMsg = "Không có bài tập nào đang chờ học sinh làm. Các em đã nộp đủ bài!";
      } else if (this.currentFilter === 'completed') {
        emptyMsg = "Chưa có bài tập nào hoàn thành 100%.";
      }

      return `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted); background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; margin:10px 0;">
          <div style="font-size:36px; margin-bottom:8px;">📭</div>
          <h4 style="color:#334155; margin-bottom:6px;">${emptyMsg}</h4>
          <p style="font-size:13px; color:var(--text-muted);">Bạn có thể đổi bộ lọc trạng thái hoặc chọn học sinh khác để xem bài.</p>
          <div style="display:flex; justify-content:center; gap:8px; margin-top:14px;">
            <button class="btn btn-primary btn-sm" onclick="TutorView.setFilter('all');">
              📋 Xem tất cả bài tập (${assignments.length})
            </button>
            ${this.selectedStudentId ? `
              <button class="btn btn-outline btn-sm" onclick="TutorView.setStudentFilter(null); TutorView.setFilter('all');">
                ⭐ Xem toàn bộ học sinh
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }

    return filtered.map(asn => {
      const subs = Store.getSubmissionsByAssignment(asn.id);
      const isIndividual = asn.targetType === 'individual';
      const statusInfo = this.getAsnStatus(asn, this.selectedStudentId);
      
      const targetNames = (asn.targetStudentIds || [])
        .map(id => Store.getUserById(id)?.name || id)
        .join(', ');

      const safeDeadlineStr = (asn.deadline && asn.deadline.includes('T') && asn.deadline.length === 16) 
        ? asn.deadline + ':00' 
        : (asn.deadline || '');
      const parsedDeadline = safeDeadlineStr ? new Date(safeDeadlineStr) : new Date();
      const isOverdue = parsedDeadline < new Date();
      const deadlineFormatted = isNaN(parsedDeadline.getTime()) ? 'Chưa ấn định' : parsedDeadline.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
      });

      const targetCount = (asn.targetStudentIds && asn.targetStudentIds.length) || 1;
      const submissionRate = Math.round((subs.length / targetCount) * 100);

              const isQuiz = asn.type === 'quiz' || asn.submissionType === 'quiz';
              return `
                <div class="assignment-card">
                  <div class="card-top">
                    <span class="target-student-pill ${isIndividual ? 'individual' : ''}">
                      ${isIndividual ? '🎯 Giao riêng:' : '👥 Cả lớp:'} ${targetNames}
                    </span>
                    <div style="display:flex; gap:6px; align-items:center;">
                      <span class="badge" style="${statusInfo.badgeStyle}; font-weight:700; font-size:11.5px;">
                        ${statusInfo.icon} ${statusInfo.label}
                      </span>
                      <span class="badge ${isQuiz ? 'badge-warning' : (isOverdue ? 'badge-danger' : 'badge-primary')}" style="font-size:11px;">
                        ${isQuiz ? '⚡ Trắc nghiệm' : (isOverdue ? '⚠️ Quá hạn' : '📸 Tự luận')}
                      </span>
                      <button class="btn btn-xs btn-outline" style="padding:2px 7px; font-size:11px;" onclick="TutorView.openEditAssignmentModal('${asn.id}')" title="Chỉnh sửa bài tập này">
                        ✏️ Sửa
                      </button>
                      <button class="btn btn-xs btn-danger" style="padding:2px 6px; font-size:11px;" onclick="TutorView.deleteAssignment('${asn.id}')" title="Xóa bài tập này">
                        🗑️
                      </button>
                    </div>
                  </div>

          <h4>${asn.title}</h4>
          <p style="font-size:13.5px; color:var(--text-muted);">${asn.description}</p>
          ${asn.attachmentName ? `
            <div class="assignment-attachment-card">
              <div class="attachment-file-info">
                <span class="attachment-icon">📎</span>
                <div class="attachment-names">
                  <strong title="${asn.attachmentName}">${asn.attachmentName}</strong>
                  <small>${asn.attachmentSize || 'Tệp đề bài đã đính kèm'}</small>
                </div>
              </div>
              <a href="${asn.attachmentDataUrl || 'javascript:void(0)'}" download="${asn.attachmentName}" class="btn-download-attachment" onclick="App.handleDownloadAttachment(event, '${asn.id}')">
                📥 Xem / Tải đề
              </a>
            </div>
          ` : ''}

          <!-- Tiến độ nộp bài -->
          <div style="margin: 4px 0;">
            <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-muted); margin-bottom:2px;">
              <span>Tiến độ nộp: <strong>${subs.length}/${(asn.targetStudentIds && asn.targetStudentIds.length) || 0} em (${submissionRate}%)</strong></span>
              <span style="color:${isOverdue ? 'var(--danger)' : 'var(--text-muted)'}; font-weight:600;">
                ⏰ ${deadlineFormatted}
              </span>
            </div>
            <div class="progress-container">
              <div class="progress-bar-fill ${submissionRate === 100 ? 'complete' : ''}" style="width:${submissionRate}%;"></div>
            </div>
          </div>

          <!-- Chi tiết từng bài nộp & Các nút hành động -->
          <div class="card-actions" style="flex-direction:column; gap:8px;">
            ${this.renderSubmissionDetails(asn, subs)}
          </div>
        </div>
      `;
    }).join('');
  },

  renderSubmissionDetails(assignment, submissions) {
    if (submissions.length === 0) {
      const targetNames = (assignment.targetStudentIds || []).map(id => Store.getUserById(id)?.name || id).join(', ');
      return `
        <div style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:8px; padding:12px; margin-bottom:4px; display:flex; align-items:center; gap:10px;">
          <div style="font-size:20px;">✍️</div>
          <div style="flex:1;">
            <strong style="color:#334155; font-size:13px;">Học sinh chưa nộp bài</strong>
            <div style="font-size:11.5px; color:#64748b; margin-top:2px;">
              Đang chờ ${targetNames} làm bài và nộp ảnh trước hạn chót.
            </div>
          </div>
        </div>
        <div style="display:flex; gap:8px; width:100%;">
          <button class="btn btn-sm btn-outline" style="flex:1;" onclick="App.showToast('🔔 Đã gửi thông báo nhắc học sinh nộp bài!', 'info')">
            🔔 Nhắc nộp bài
          </button>
          <button class="btn btn-sm btn-outline" style="flex:1; border-color:#38bdf8; color:#0284c7;" onclick="App.openQRCodeModal('${assignment.id}')" title="Mở mã QR cho học sinh quét bằng camera điện thoại">
            📱 QR Điện Thoại
          </button>
          <button class="btn btn-sm btn-danger" style="padding:6px 10px;" onclick="TutorView.deleteAssignment('${assignment.id}')" title="Xóa bài tập này">
            🗑️
          </button>
        </div>
      `;
    }

    const pendingStudents = (assignment.targetStudentIds || [])
      .filter(sid => !submissions.some(s => s.studentId === sid))
      .map(sid => Store.getUserById(sid)?.name || sid);

    const submissionRows = submissions.map(sub => {
      const student = Store.getUserById(sub.studentId);
      const studentName = student ? student.name : sub.studentName;
      const cheatCount = sub.cheatCount || 0;
      const cheatDuration = sub.cheatDuration || 0;

      const cheatBadge = cheatCount > 0
        ? `<div style="margin-top:4px;">
             <button class="cheat-pill cheat-pill-danger" onclick="event.stopPropagation(); AntiCheat.openLogModal('${sub.id}')" title="Nhấp để xem chi tiết các lần học sinh rời màn hình tra cứu ngoài">
               🚨 ${cheatCount} lần rời tab (${cheatDuration}s) • Xem log
             </button>
           </div>`
        : `<div style="margin-top:4px;">
             <span class="cheat-pill cheat-pill-clean" title="Học sinh làm bài trung thực tuyệt đối, không rời tab">
               🛡️ Trung thực (0 rời tab)
             </span>
           </div>`;

      if (sub.status === 'submitted') {
        return `
          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-size:13.5px; color:#92400e;">📥 ${studentName}</strong>
              <div style="font-size:11.5px; color:#b45309; font-family:var(--font-mono); font-weight:600; margin-top:1px;">
                TK: ${student ? student.username : ''} • Chờ bạn chấm bút đỏ
              </div>
              ${cheatBadge}
            </div>
            <button class="btn btn-sm btn-primary" onclick="Grader.open('${sub.id}')">
              ✍️ Chấm ngay
            </button>
          </div>
        `;
      } else {
        return `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-size:13.5px; color:#166534;">✅ ${studentName}</strong>
              <span class="badge badge-success" style="margin-left:6px;">${sub.score}/10đ</span>
              <div style="font-size:11.5px; color:#15803d; font-family:var(--font-mono); font-weight:600; margin-top:1px;">
                TK: ${student ? student.username : ''}
              </div>
              <small style="color:#15803d; max-width:180px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${sub.feedback || 'Đã chấm xong'}
              </small>
              ${cheatBadge}
            </div>
            <div style="display:flex; gap:4px;">
              ${sub.isQuiz ? `
                <button class="btn btn-sm btn-primary" onclick="Quiz.openResultModal('${sub.id}')" title="Xem kết quả trắc nghiệm và bảng phân tích">
                  📊 Kết quả (${sub.score}đ)
                </button>
              ` : `
                <button class="btn btn-sm btn-secondary" onclick="App.openReviewModal('${sub.id}')" title="Xem lại bài đã chấm">
                  🔍 Xem
                </button>
              `}
              <button class="btn btn-sm btn-outline" onclick="TutorView.openZaloModal('${sub.studentId}', '${assignment.id}')" title="Gửi Zalo báo phụ huynh">
                💬 Zalo
              </button>
            </div>
          </div>
        `;
      }
    }).join('');

    const notSubmittedNotice = pendingStudents.length > 0 ? `
      <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; padding:6px 10px; font-size:11.5px; color:#64748b; margin-top:4px;">
        ✍️ Còn ${pendingStudents.length} học sinh chưa nộp: <strong>${pendingStudents.join(', ')}</strong>
      </div>
    ` : '';

    const qrActionRow = `
      <div style="display:flex; justify-content:flex-end; margin-top:6px;">
        <button class="btn btn-xs btn-outline" style="border-color:#38bdf8; color:#0284c7; font-weight:600;" onclick="App.openQRCodeModal('${assignment.id}')" title="Mở mã QR cho học sinh quét bằng camera điện thoại">
          📱 Mã QR Mở Trên Điện Thoại
        </button>
      </div>
    `;

    return submissionRows + notSubmittedNotice + qrActionRow;
  },

  deleteAssignment(assignmentId) {
    const asn = Store.data.assignments.find(a => a.id === assignmentId);
    const title = asn ? asn.title : 'bài tập này';
    const subs = Store.getSubmissionsByAssignment(assignmentId);
    let confirmMsg = `Bạn có chắc chắn muốn xóa "${title}"?`;
    if (subs.length > 0) {
      confirmMsg += `\n\n⚠️ Lưu ý: Bài tập này đã có ${subs.length} bài nộp của học sinh. Xóa bài tập sẽ đồng thời xóa toàn bộ bài làm và điểm số liên quan!`;
    }
    if (confirm(confirmMsg)) {
      Store.deleteAssignment(assignmentId);
      App.showToast("Đã xóa bài tập!", "info");
      App.renderCurrentView();
    }
  },

  handleEditTargetTypeChange(val) {
    const container = document.getElementById('editStudentPickerContainer');
    if (container) {
      container.style.display = val === 'individual' ? 'block' : 'none';
    }
  },

  openEditAssignmentModal(assignmentId) {
    const asn = Store.data.assignments.find(a => a.id === assignmentId);
    if (!asn) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('editAsnId', asn.id);
    setVal('editAsnTitle', asn.title);
    setVal('editAsnDesc', asn.description || '');
    setVal('editAsnTopic', asn.topic || '');
    setVal('editAsnDifficulty', asn.difficulty || 'Thông hiểu - Vận dụng');
    setVal('editAsnDeadline', asn.deadline || '');
    const currentType = asn.type || asn.submissionType || 'photo';
    setVal('editAsnType', currentType);
    setVal('editAsnTargetType', asn.targetType || 'individual');

    if (window.Quiz) {
      if (currentType === 'quiz') {
        Quiz.loadExistingQuiz('edit', asn.quizData);
        Quiz.toggleBuilder('edit', 'quiz');
      } else {
        Quiz.toggleBuilder('edit', 'photo');
      }
    }

    const currentUser = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = currentUser ? currentUser.id : 'u_tutor';
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    const picker = document.getElementById('editStudentPickerContainer');
    if (picker) {
      picker.style.display = (asn.targetType === 'group') ? 'none' : 'block';
    }

    const listEl = document.getElementById('editStudentCheckboxesList');
    if (listEl) {
      listEl.innerHTML = students.map(std => {
        const isChecked = (asn.targetStudentIds || []).includes(std.id);
        return `
          <label class="student-checkbox-item" style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:4px; cursor:pointer;">
            <input type="checkbox" name="editTargetStudents" value="${std.id}" ${isChecked ? 'checked' : ''}>
            <span><strong>${std.name}</strong> (${std.grade})</span>
          </label>
        `;
      }).join('');
    }

    const modal = document.getElementById('editAssignmentModal');
    if (modal) modal.classList.add('active');
  },

  submitEditAssignment() {
    const id = document.getElementById('editAsnId')?.value;
    const title = document.getElementById('editAsnTitle')?.value.trim();
    const deadline = document.getElementById('editAsnDeadline')?.value;
    if (!id) return;
    if (!title) {
      App.showToast('Vui lòng nhập tiêu đề bài tập!', 'error');
      return;
    }

    const targetType = document.getElementById('editAsnTargetType')?.value || 'individual';
    let targetStudentIds = [];
    if (targetType === 'individual') {
      const checkedBoxes = document.querySelectorAll('input[name="editTargetStudents"]:checked');
      targetStudentIds = Array.from(checkedBoxes).map(cb => cb.value);
      if (targetStudentIds.length === 0) {
        App.showToast('Vui lòng chọn ít nhất một học sinh nhận bài tập!', 'warning');
        return;
      }
    } else {
      const currentUser = Auth.getCurrentUser();
      const currentTutorId = currentUser ? currentUser.id : 'u_tutor';
      const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
      const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);
      targetStudentIds = students.map(s => s.id);
    }

    const asnType = document.getElementById('editAsnType')?.value || 'photo';
    const updatedData = {
      title: title,
      description: document.getElementById('editAsnDesc')?.value.trim() || '',
      topic: document.getElementById('editAsnTopic')?.value.trim() || '',
      difficulty: document.getElementById('editAsnDifficulty')?.value || 'Thông hiểu - Vận dụng',
      deadline: deadline || '',
      type: asnType,
      submissionType: asnType,
      targetType: targetType,
      targetStudentIds: targetStudentIds
    };

    if (asnType === 'quiz' && window.Quiz) {
      updatedData.quizData = Quiz.getBuilderData('edit');
    }

    Store.updateAssignment(id, updatedData);
    App.closeModal('editAssignmentModal');
    App.renderCurrentView();
    App.showToast(`✓ Đã cập nhật thành công bài tập "${title}"!`, 'success');
  },

  // Xuất bảng điểm chi tiết toàn bộ học sinh và bài tập ra file Excel/CSV
  exportGradesCSV() {
    const currentUser = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = currentUser ? currentUser.id : 'u_tutor';
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    const assignments = Store.getAllAssignments().filter(asn => {
      if (isMasterAdmin) return true;
      if (asn.tutorId && asn.tutorId === currentTutorId) return true;
      return asn.targetStudentIds && asn.targetStudentIds.some(sid => students.some(std => std.id === sid));
    });

    if (assignments.length === 0) {
      App.showToast('Chưa có bài tập nào để xuất bảng điểm!', 'warning');
      return;
    }

    const rows = [
      ['STT', 'Mã Bài Tập', 'Tên Bài Tập', 'Hình Thức', 'Học Sinh', 'Lớp', 'Tài Khoản', 'Hạn Nộp', 'Trạng Thái', 'Điểm Số', 'Lời Phê / Nhận Xét', 'Giám Sát (Rời tab)', 'Thời Gian Nộp']
    ];

    let stt = 1;
    assignments.forEach(asn => {
      const isQuiz = asn.type === 'quiz' || asn.submissionType === 'quiz';
      const asnTypeStr = isQuiz ? 'Trắc nghiệm' : 'Tự luận (ảnh)';
      const targetIds = asn.targetStudentIds || [];

      targetIds.forEach(sid => {
        const std = students.find(s => s.id === sid) || Store.getUserById(sid);
        const sub = Store.getSubmission(asn.id, sid);

        let statusStr = 'Chưa nộp';
        let scoreStr = '—';
        let feedbackStr = '';
        let cheatStr = '0 lần';
        let submitTimeStr = '';

        if (sub) {
          if (sub.status === 'submitted') {
            statusStr = 'Chờ gia sư chấm';
          } else if (sub.status === 'graded') {
            statusStr = 'Đã chấm điểm';
            scoreStr = sub.score !== null ? `${sub.score}` : '—';
            feedbackStr = sub.feedback || '';
          }
          if (sub.cheatCount > 0) {
            cheatStr = `${sub.cheatCount} lần (${sub.cheatDuration || 0}s)`;
          } else {
            cheatStr = '0 lần (Trung thực)';
          }
          if (sub.submittedAt) {
            submitTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
          }
        }

        rows.push([
          stt++,
          asn.id,
          `"${(asn.title || '').replace(/"/g, '""')}"`,
          asnTypeStr,
          `"${(std ? std.name : sid).replace(/"/g, '""')}"`,
          std ? (std.grade || '') : '',
          std ? (std.username || '') : '',
          asn.deadline ? new Date(asn.deadline).toLocaleString('vi-VN') : 'Không hạn',
          statusStr,
          scoreStr,
          `"${feedbackStr.replace(/"/g, '""')}"`,
          cheatStr,
          submitTimeStr
        ]);
      });
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BangDiem_EduTask_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.showToast('✓ Đã xuất bảng điểm toàn lớp ra file Excel/CSV thành công!', 'success');
  },

  // Nhắc nộp bài thông minh: Gom danh sách học sinh chưa nộp và tạo tin nhắn Zalo
  remindAllStudents() {
    const currentUser = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = currentUser ? currentUser.id : 'u_tutor';
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    const assignments = Store.getAllAssignments().filter(asn => {
      if (isMasterAdmin) return true;
      if (asn.tutorId && asn.tutorId === currentTutorId) return true;
      return asn.targetStudentIds && asn.targetStudentIds.some(sid => students.some(std => std.id === sid));
    });

    const pendingList = [];
    assignments.forEach(asn => {
      const targetIds = asn.targetStudentIds || [];
      targetIds.forEach(sid => {
        const sub = Store.getSubmission(asn.id, sid);
        if (!sub) {
          const std = students.find(s => s.id === sid);
          if (std) {
            pendingList.push({
              studentName: std.name,
              asnTitle: asn.title,
              deadline: asn.deadline ? new Date(asn.deadline).toLocaleString('vi-VN') : 'Sớm'
            });
          }
        }
      });
    });

    if (pendingList.length === 0) {
      App.showToast('🎉 Tuyệt vời! Tất cả học sinh đều đã nộp bài đầy đủ, không có bài tập nào bị trễ hạn.', 'success');
      return;
    }

    let msg = `🔔 THÔNG BÁO NHẮC NỘP BÀI TẬP VỀ NHÀ (${new Date().toLocaleDateString('vi-VN')}):\n`;
    msg += `Kính gửi Quý phụ huynh và các em học sinh,\nThầy/Cô xin gửi danh sách các bạn còn bài tập chưa nộp trên hệ thống EduTask:\n\n`;

    pendingList.forEach((item, idx) => {
      msg += `${idx + 1}. Em ${item.studentName}: "${item.asnTitle}" (Hạn nộp: ${item.deadline})\n`;
    });

    msg += `\nCác em hãy tranh thủ vào hệ thống làm và gửi bài để Thầy/Cô kịp chấm điểm và nhận xét nhé!\nTrân trọng.`;

    this.fallbackCopy(msg);
    alert(`📋 ĐÃ SAO CHÉP NỘI DUNG NHẮC NỘP BÀI!\n\nBạn có thể dán (Ctrl+V) ngay vào nhóm Zalo lớp học:\n\n${msg}`);
  },

  // ================= MODAL BÁO CÁO ZALO GỬI PHỤ HUYNH =================
  openZaloModal(preselectedStudentId = null, preselectedAssignmentId = null) {
    const currentUser = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = currentUser ? currentUser.id : 'u_tutor';

    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);
    const assignments = Store.getAllAssignments().filter(asn => {
      if (isMasterAdmin) return true;
      if (asn.tutorId && asn.tutorId === currentTutorId) return true;
      return asn.targetStudentIds && asn.targetStudentIds.some(sid => students.some(std => std.id === sid));
    });

    const stdSelect = document.getElementById('zaloStudentSelect');
    const asnSelect = document.getElementById('zaloAssignmentSelect');

    if (!stdSelect || !asnSelect) return;

    if (students.length === 0) {
      stdSelect.innerHTML = '<option value="">(Không có học sinh theo học)</option>';
      asnSelect.innerHTML = '<option value="">(Không có bài tập)</option>';
      const box = document.getElementById('zaloPreviewContent');
      if (box) box.textContent = 'Hiện tại không có học sinh nào đang theo học để tạo báo cáo.';
      const modal = document.getElementById('zaloReportModal');
      if (modal) modal.classList.add('active');
      return;
    }

    // Điền danh sách học sinh
    stdSelect.innerHTML = students.map(s => `
      <option value="${s.id}" ${preselectedStudentId === s.id ? 'selected' : ''}>
        ${s.name} (TK: ${s.username}) - ${s.grade}
      </option>
    `).join('');

    // Điền danh sách bài tập
    asnSelect.innerHTML = assignments.map(a => `
      <option value="${a.id}" ${preselectedAssignmentId === a.id ? 'selected' : ''}>
        ${a.title}
      </option>
    `).join('');

    this.updateZaloPreview();

    const modal = document.getElementById('zaloReportModal');
    if (modal) modal.classList.add('active');
  },

  updateZaloPreview() {
    const stdId = document.getElementById('zaloStudentSelect')?.value;
    const asnlId = document.getElementById('zaloAssignmentSelect')?.value;
    const attitude = document.getElementById('zaloAttitudeSelect')?.value || 'Rất tập trung, tiếp thu bài tốt.';
    const homework = document.getElementById('zaloHomeworkInput')?.value || 'Hoàn thành bài tập về nhà đúng hạn.';

    const student = Store.getUserById(stdId);
    if (!student) {
      const box = document.getElementById('zaloPreviewContent');
      if (box) box.textContent = 'Vui lòng chọn học sinh để tạo tin nhắn Zalo.';
      return;
    }
    const assignment = Store.data.assignments.find(a => a.id === asnlId);
    const submission = (student && assignment) ? Store.getSubmission(assignment.id, student.id) : null;

    const todayStr = new Date().toLocaleDateString('vi-VN');
    const scoreStr = submission && submission.score !== null ? `${submission.score}/10` : 'Đang trong quá trình hoàn thành';
    const feedbackStr = submission && submission.feedback ? `"${submission.feedback}"` : 'Em làm bài cẩn thận, đã nắm chắc kiến thức cơ bản.';

    let cheatNote = '';
    if (submission) {
      if (submission.cheatCount && submission.cheatCount > 0) {
        cheatNote = `\n   • Giám sát trung thực: ⚠️ Ghi nhận ${submission.cheatCount} lần rời tab bài làm (tổng ${submission.cheatDuration || 0}s). Thầy/Cô đã nhắc nhở em làm bài độc lập, không tra cứu AI hay tài liệu ngoài.`;
      } else {
        cheatNote = `\n   • Giám sát trung thực: 🛡️ Rất tốt, làm bài nghiêm túc & tập trung cao, không chuyển tab ngoài.`;
      }
    }

    const message = `Kính gửi Quý phụ huynh em: ${student ? student.name.toUpperCase() : 'HỌC SINH'}
Thầy/Cô xin gửi báo cáo tóm tắt tình hình học tập ngày ${todayStr}:

1. BÀI TẬP VỪA HOÀN THÀNH:
   • Bài: ${assignment ? assignment.title : 'Phiếu bài tập'}
   • Điểm số: ${scoreStr}
   • Nhận xét của gia sư: ${feedbackStr}${cheatNote}
   • Bài giải đã được thầy/cô chấm bút đỏ chi tiết trên hệ thống.

2. THÁI ĐỘ VÀ MỨC ĐỘ TIẾP THU:
   • ${attitude}
   ${student && student.weaknesses ? `• Điểm cần lưu ý thêm: ${student.weaknesses}` : ''}

3. BÀI TẬP VỀ NHÀ GIAO THÊM:
   • ${homework}

Thầy/Cô Gia Sư — Trân trọng cảm ơn Quý phụ huynh đã đồng hành cùng con!`;

    const box = document.getElementById('zaloPreviewContent');
    if (box) box.textContent = message;
  },

  copyZaloMessage() {
    const box = document.getElementById('zaloPreviewContent');
    if (!box) return;

    const text = box.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        App.showToast('📋 Đã sao chép tin nhắn Zalo! Bạn có thể dán (Ctrl+V) gửi ngay cho phụ huynh.', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  },

  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    App.showToast('📋 Đã sao chép tin nhắn Zalo thành công!', 'success');
  }
};

if (typeof window !== 'undefined') {
  window.TutorView = TutorView;
}

