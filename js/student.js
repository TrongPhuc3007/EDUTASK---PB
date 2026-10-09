/**
 * EDUTASK PRO — STUDENT MODULE (CẤP 3: HỌC SINH)
 * To-Do List bài tập của riêng em, bộ lọc trạng thái, tìm kiếm nhanh,
 * tính hạn nộp thông minh, chụp ảnh nộp bài và xem lời phê của gia sư.
 */

const StudentView = {
  currentFilter: 'all', // 'all', 'pending', 'waiting', 'graded'
  searchQuery: '',

  setFilter(filter) {
    this.currentFilter = filter;
    App.renderCurrentView();
  },

  setSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    App.renderCurrentView();
    const searchInput = document.getElementById('studentAssignmentSearchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  },

  render(container) {
    const student = Auth.getCurrentUser();
    
    // Kiểm tra chặt chẽ: Chỉ khi học sinh được tạo & cấp tài khoản chính thức mới hiển thị giao diện học sinh
    if (!student || student.role !== 'student' || !student.hasAccount || student.accountStatus !== 'active') {
      container.innerHTML = `
        <div class="content-card" style="text-align:center; padding:60px 20px; max-width:620px; margin:40px auto;">
          <div style="font-size:52px; margin-bottom:16px;">🔒</div>
          <h3 style="color:#b91c1c; margin-bottom:10px;">Chưa Có Quyền Truy Cập Giao Diện Học Sinh</h3>
          <p style="color:var(--text-muted); font-size:14.5px; line-height:1.6; margin-bottom:24px;">
            Học sinh chỉ có giao diện học tập khi đã được Admin hoặc Gia Sư <strong>tạo tài khoản chính thức</strong>.
            Vui lòng liên hệ Admin/Gia sư để được cấp tên đăng nhập và mật khẩu kích hoạt.
          </p>
          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="Auth.logout()">🚪 Đăng Nhập Tài Khoản Khác</button>
          </div>
        </div>
      `;
      return;
    }

    const allAssignments = Store.getAssignmentsForStudent(student.id);

    // Tính toán các nhóm trạng thái
    const pendingList = [];
    const waitingList = [];
    const gradedList = [];

    allAssignments.forEach(asn => {
      const sub = Store.getSubmission(asn.id, student.id);
      if (!sub) {
        pendingList.push(asn);
      } else if (sub.status === 'submitted') {
        waitingList.push(asn);
      } else if (sub.status === 'graded') {
        gradedList.push(asn);
      }
    });

    // Thống kê tiến độ & điểm số
    const totalCount = allAssignments.length;
    const completedCount = gradedList.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
    const avgScore = completedCount > 0 
      ? (gradedList.reduce((acc, asn) => {
          const sub = Store.getSubmission(asn.id, student.id);
          return acc + (sub ? sub.score : 0);
        }, 0) / completedCount).toFixed(1)
      : 'Chưa có';

    // Áp dụng bộ lọc
    let filteredList = allAssignments;
    if (this.currentFilter === 'pending') filteredList = pendingList;
    else if (this.currentFilter === 'waiting') filteredList = waitingList;
    else if (this.currentFilter === 'graded') filteredList = gradedList;

    // Áp dụng tìm kiếm
    if (this.searchQuery) {
      filteredList = filteredList.filter(asn => {
        const titleMatch = (asn.title || '').toLowerCase().includes(this.searchQuery);
        const descMatch = (asn.description || '').toLowerCase().includes(this.searchQuery);
        const topicMatch = (asn.topic || '').toLowerCase().includes(this.searchQuery);
        return titleMatch || descMatch || topicMatch;
      });
    }

    const studentClass = Store.getStudentClass(student.id);
    let classRankBadge = '';
    let classAnnouncementsHtml = '';

    if (studentClass) {
      const gradebook = Store.getClassGradebook(studentClass.id);
      if (gradebook) {
        const myRank = gradebook.rankings.findIndex(r => r.student.id === student.id) + 1;
        let rankIcon = `#${myRank}`;
        if (myRank === 1) rankIcon = '🥇 Hạng 1';
        else if (myRank === 2) rankIcon = '🥈 Hạng 2';
        else if (myRank === 3) rankIcon = '🥉 Hạng 3';
        classRankBadge = `
          <div style="background:rgba(255,255,255,0.2); backdrop-filter:blur(6px); padding:8px 16px; border-radius:12px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Xếp hạng lớp</div>
            <div style="font-size:20px; font-weight:800; color:#fde68a;">${rankIcon} <small style="font-size:12px; font-weight:normal; opacity:0.9;">/${gradebook.students.length}</small></div>
          </div>
        `;
      }

      if (Array.isArray(studentClass.announcements) && studentClass.announcements.length > 0) {
        const latestAnn = studentClass.announcements[0];
        classAnnouncementsHtml = `
          <div class="content-card" style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:1.5px solid #86efac; margin-bottom:16px;">
            <div style="padding:14px 18px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span class="badge badge-success" style="font-size:11px;">📢 Thông Báo Lớp ${studentClass.name}</span>
                  <small style="color:#15803d; font-size:11.5px;">${new Date(latestAnn.createdAt).toLocaleString('vi-VN')}</small>
                </div>
                <strong style="font-size:14px; color:#14532d;">📌 ${latestAnn.title}</strong>
                <p style="margin:4px 0 0 0; font-size:13px; color:#166534; line-height:1.5;">${latestAnn.content}</p>
              </div>
              <span class="badge" style="background:#ffffff; color:#15803d; border:1px solid #86efac; font-size:11.5px; font-weight:700;">
                Từ: ${latestAnn.authorName || 'GV Phụ trách'}
              </span>
            </div>
          </div>
        `;
      }
    }

    // Tạo khối Quản lý Lớp & Nhập Mã Lớp Học
    let classSectionHtml = '';
    const allClasses = (typeof Store.getClasses === 'function') ? Store.getClasses() : [];

    if (studentClass) {
      const classAssignments = (typeof Store.getAssignmentsByClass === 'function') ? Store.getAssignmentsByClass(studentClass.id) : [];
      const classmateCount = Array.isArray(studentClass.studentIds) ? studentClass.studentIds.length : 1;

      classSectionHtml = `
        <div class="content-card" style="margin-bottom:16px; border-left:4.5px solid #10b981; background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);">
          <div style="padding:16px 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <div style="width:42px; height:42px; border-radius:12px; background:#dcfce7; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
                  🏫
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <h4 style="margin:0; font-size:16.5px; color:#065f46; font-weight:800;">
                      ${studentClass.name}
                    </h4>
                    <span class="badge badge-success" style="font-size:11px; font-weight:700;">Đang Theo Học</span>
                  </div>
                  <span style="font-size:12.5px; color:#64748b; margin-top:2px; display:block;">
                    Gia sư phụ trách: <strong style="color:#0f172a;">${studentClass.tutorName}</strong> • Phòng học: <strong style="color:#0f172a;">${studentClass.room || 'Phòng học trực tuyến'}</strong>
                  </span>
                </div>
              </div>

              <!-- Thao tác với mã lớp -->
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:6px; background:#ffffff; border:1.5px dashed #22c55e; border-radius:8px; padding:5px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                  <span style="font-size:11.5px; font-weight:700; color:#166534; text-transform:uppercase;">Mã Lớp:</span>
                  <strong style="font-family:var(--font-mono); font-size:14px; color:#15803d; letter-spacing:1px;">${studentClass.code}</strong>
                  <button type="button" onclick="StudentView.copyClassCode('${studentClass.code}')" style="background:transparent; border:none; cursor:pointer; font-size:14px; padding:0 2px;" title="Sao chép mã lớp">📋</button>
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="StudentView.openJoinClassModal()" style="font-size:12px; font-weight:700; border-radius:8px; background:#ffffff;">
                  ➕ Nhập Mã Khác
                </button>
                <button type="button" class="btn btn-sm btn-outline" onclick="StudentView.handleLeaveClass('${studentClass.id}', '${studentClass.name}')" style="font-size:12px; font-weight:600; color:#dc2626; border-color:#fca5a5; border-radius:8px; background:#ffffff;" title="Rời lớp này">
                  🚪 Rời Lớp
                </button>
              </div>
            </div>

            <!-- Thống kê lớp -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-top:8px;">
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; text-align:center;">
                <span style="font-size:11px; color:#64748b; display:block;">👥 Sĩ số lớp</span>
                <strong style="font-size:15px; color:#0f172a;">${classmateCount} học sinh</strong>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; text-align:center;">
                <span style="font-size:11px; color:#64748b; display:block;">📚 Bài tập của lớp</span>
                <strong style="font-size:15px; color:#059669;">${classAssignments.length} bài</strong>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; text-align:center;">
                <span style="font-size:11px; color:#64748b; display:block;">📍 Khối lớp</span>
                <strong style="font-size:15px; color:#0284c7;">${studentClass.grade}</strong>
              </div>
              <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; text-align:center;">
                <span style="font-size:11px; color:#64748b; display:block;">📖 Môn học</span>
                <strong style="font-size:15px; color:#7c3aed;">${studentClass.subject || 'Toán'}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Học sinh chưa vào lớp: Hiển thị khối nhập mã lớp nổi bật
      const availableClasses = allClasses.filter(c => !Array.isArray(c.studentIds) || !c.studentIds.includes(student.id));

      classSectionHtml = `
        <div class="content-card" style="margin-bottom:16px; border:2px solid #86efac; background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); box-shadow:0 4px 16px rgba(16,185,129,0.08);">
          <div style="padding:18px 22px;">
            <div style="display:flex; align-items:flex-start; gap:14px; flex-wrap:wrap;">
              <div style="width:48px; height:48px; border-radius:14px; background:#dcfce7; display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0; box-shadow:0 2px 8px rgba(16,185,129,0.15);">
                🏫
              </div>
              <div style="flex:1; min-width:260px;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                  <h4 style="margin:0; font-size:17px; font-weight:800; color:#14532d;">
                    Tham Gia Lớp Học Bằng Mã (Class Code)
                  </h4>
                  <span class="badge badge-success" style="font-size:11px; font-weight:700;">Nhập 1 Lần • Kết Nối Ngay</span>
                </div>
                <p style="margin:0 0 12px 0; font-size:13px; color:#166534; line-height:1.5;">
                  Nhập mã lớp do Thầy/Cô hoặc Gia sư cung cấp để nhận bài tập chung của lớp, xem bảng xếp hạng và các thông báo chuyên môn.
                </p>

                <!-- Form nhập mã lớp trực tiếp -->
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                  <div style="position:relative; flex:1; min-width:200px; max-width:360px;">
                    <input 
                      type="text" 
                      id="studentDirectJoinCodeInput" 
                      placeholder="Mã lớp (Ví dụ: TOAN12A1)..." 
                      class="form-control" 
                      style="text-transform:uppercase; font-family:var(--font-mono); font-weight:800; letter-spacing:1.5px; font-size:15px; padding:10px 14px; border:2px solid #10b981; border-radius:10px; background:#ffffff; box-shadow:inset 0 1px 3px rgba(0,0,0,0.04);"
                      onkeydown="if(event.key==='Enter'){event.preventDefault(); StudentView.handleJoinClassDirect();}"
                    >
                  </div>
                  <button 
                    type="button" 
                    class="btn btn-primary" 
                    onclick="StudentView.handleJoinClassDirect()"
                    style="background:#059669; border-color:#059669; font-weight:800; font-size:13.5px; padding:10px 22px; border-radius:10px; box-shadow:0 4px 12px rgba(5,150,105,0.25); display:inline-flex; align-items:center; gap:6px; cursor:pointer;"
                  >
                    <span>🚀</span> <span>Vào Lớp Ngay</span>
                  </button>
                </div>

                ${availableClasses.length > 0 ? `
                  <div style="margin-top:12px; font-size:12px; color:#15803d; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-weight:700;">💡 Lớp học đang mở:</span>
                    ${availableClasses.map(c => `
                      <button type="button" onclick="StudentView.fillAndJoin('${c.code}')" style="background:#ffffff; color:#166534; border:1px solid #86efac; border-radius:6px; padding:3px 9px; font-size:11.5px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:all 0.15s ease; box-shadow:0 1px 2px rgba(0,0,0,0.03);" title="Chạm để tự điền mã lớp ${c.name}">
                        <span>${c.name}</span> <span style="font-family:var(--font-mono); font-size:10.5px; color:#059669; font-weight:800;">[${c.code}]</span>
                      </button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Banner Học Sinh & Tiến Độ Mục Tiêu -->
      <div class="view-banner" style="background: linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%);">
        <div class="banner-info">
          <h2>Xin Chào, ${student.name}!</h2>
          <div style="font-size:13px; color:rgba(255,255,255,0.95); margin-bottom:4px;">
            Tên tài khoản: <strong style="font-family:var(--font-mono); color:#a7f3d0;">${student.username}</strong>
          </div>
          <p>Giáo viên phụ trách: <strong>${student.assignedTutorName || 'Gia Sư Phụ Trách'}</strong> | Lớp: <strong>${studentClass ? `${studentClass.name} (Mã: ${studentClass.code})` : (student.grade || 'Chưa tham gia lớp')}</strong></p>
        </div>
        <div class="banner-actions" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <button type="button" class="btn btn-sm" style="background:#ffffff; color:#065f46; font-weight:800; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.15); display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:none; cursor:pointer;" onclick="StudentView.openJoinClassModal()">
            <span>🏫</span> <span>${studentClass ? 'Đổi Lớp / Vào Lớp Khác' : '➕ Nhập Mã Vào Lớp'}</span>
          </button>
          ${classRankBadge}
          <div style="background:rgba(255,255,255,0.2); backdrop-filter:blur(6px); padding:8px 16px; border-radius:12px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Tiến độ bài tập</div>
            <div style="font-size:20px; font-weight:800;">${completedCount}/${totalCount} (${completionRate}%)</div>
          </div>
          <div style="background:rgba(255,255,255,0.2); backdrop-filter:blur(6px); padding:8px 16px; border-radius:12px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Mục tiêu điểm số</div>
            <div style="font-size:20px; font-weight:800;">${student.currentScore} ➔ ${student.targetScore}</div>
          </div>
        </div>
      </div>

      ${classSectionHtml}

      ${classAnnouncementsHtml}

      <!-- To-Do List Bài Tập Cá Nhân -->
      <div class="content-card">
        <div class="card-header" style="flex-wrap:wrap; gap:12px; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0;">📚 Bàn Học & Bài Tập Của Riêng Bạn (${allAssignments.length} bài)</h3>
            <small style="color:var(--text-muted); font-size:12.5px;">Điểm trung bình các bài đã chấm: <strong style="color:#059669;">${avgScore}/10</strong></small>
          </div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <input 
              type="text" 
              id="studentAssignmentSearchInput" 
              placeholder="🔍 Tìm bài tập theo tên..." 
              value="${this.searchQuery}" 
              oninput="StudentView.setSearch(this.value)" 
              class="form-control" 
              style="width:240px; font-size:13px; padding:6px 12px; border-radius:8px;"
            >
          </div>
        </div>

        <!-- Thanh Tabs Lọc Trạng Thái -->
        <div style="display:flex; gap:8px; padding:12px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; overflow-x:auto; flex-wrap:wrap;">
          <button 
            type="button" 
            class="btn btn-sm ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-outline'}" 
            style="font-size:12.5px; border-radius:20px; font-weight:600;" 
            onclick="StudentView.setFilter('all')"
          >
            📋 Tất Cả (${allAssignments.length})
          </button>
          <button 
            type="button" 
            class="btn btn-sm ${this.currentFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" 
            style="font-size:12.5px; border-radius:20px; font-weight:600;" 
            onclick="StudentView.setFilter('pending')"
          >
            ⚡ Cần Làm Ngay (${pendingList.length})
          </button>
          <button 
            type="button" 
            class="btn btn-sm ${this.currentFilter === 'waiting' ? 'btn-primary' : 'btn-outline'}" 
            style="font-size:12.5px; border-radius:20px; font-weight:600;" 
            onclick="StudentView.setFilter('waiting')"
          >
            ⏳ Chờ Gia Sư Chấm (${waitingList.length})
          </button>
          <button 
            type="button" 
            class="btn btn-sm ${this.currentFilter === 'graded' ? 'btn-primary' : 'btn-outline'}" 
            style="font-size:12.5px; border-radius:20px; font-weight:600;" 
            onclick="StudentView.setFilter('graded')"
          >
            ✅ Đã Có Điểm (${gradedList.length})
          </button>
        </div>

        <div class="card-body">
          <div class="assignment-grid">
            ${this.renderStudentAssignmentCards(filteredList, student.id)}
          </div>
        </div>
      </div>
    `;
  },

  renderStudentAssignmentCards(assignments, studentId) {
    if (assignments.length === 0) {
      const isFiltered = this.currentFilter !== 'all' || this.searchQuery;
      return `
        <div style="grid-column: 1 / -1; text-align:center; padding:48px 20px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:16px;">
          <div style="font-size:42px; margin-bottom:12px;">🎒</div>
          <h4 style="color:#1e293b; margin-bottom:6px; font-weight:700;">
            ${isFiltered ? 'Không tìm thấy bài tập phù hợp với bộ lọc!' : 'Bàn học cá nhân đã sẵn sàng!'}
          </h4>
          <p style="color:#64748b; font-size:14px; max-width:440px; margin:0 auto 16px auto;">
            ${isFiltered ? 'Hãy thử đổi từ khóa tìm kiếm hoặc chọn tab "Tất Cả" để xem toàn bộ bài tập.' : 'Hiện tại Gia sư chưa giao bài tập mới hoặc bạn đã hoàn thành tất cả bài tập. Hãy đợi thông báo từ gia sư phụ trách nhé!'}
          </p>
          ${isFiltered ? `
            <button class="btn btn-outline btn-sm" onclick="StudentView.setFilter('all'); StudentView.setSearch('');">
              🔄 Xem Tất Cả Bài Tập
            </button>
          ` : `
            <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:20px; color:#065f46; font-size:12.5px; font-weight:600;">
              <span>✨</span> <span>Tài khoản đã kích hoạt & đồng bộ tự động đa thiết bị</span>
            </div>
          `}
        </div>
      `;
    }

    return assignments.map(asn => {
      const sub = Store.getSubmission(asn.id, studentId);
      const isIndividual = asn.targetType === 'individual';
      const safeDeadlineStr = (asn.deadline && asn.deadline.includes('T') && asn.deadline.length === 16) 
        ? asn.deadline + ':00' 
        : (asn.deadline || '');
      const parsedDeadline = safeDeadlineStr ? new Date(safeDeadlineStr) : new Date();
      const deadline = isNaN(parsedDeadline.getTime()) ? 'Chưa ấn định' : parsedDeadline.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
      });

      // Tính toán mức độ khẩn cấp của hạn nộp
      let urgencyBadge = '';
      if (!sub && !isNaN(parsedDeadline.getTime())) {
        const now = Date.now();
        const diffMs = parsedDeadline.getTime() - now;
        if (diffMs < 0) {
          urgencyBadge = `<span class="badge badge-danger" style="font-size:10.5px;">🚨 Quá hạn</span>`;
        } else if (diffMs < 24 * 3600 * 1000) {
          const hoursLeft = Math.max(1, Math.round(diffMs / (3600 * 1000)));
          urgencyBadge = `<span class="badge badge-danger" style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-size:10.5px;">⏰ Còn ${hoursLeft}h</span>`;
        } else {
          const daysLeft = Math.round(diffMs / (24 * 3600 * 1000));
          urgencyBadge = `<span class="badge badge-success" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-size:10.5px;">📅 Còn ${daysLeft} ngày</span>`;
        }
      }

      const isQuiz = asn.type === 'quiz' || asn.submissionType === 'quiz';
      let statusBadge = '';
      let actionBtn = '';
      const pageCount = (sub && Array.isArray(sub.photos) && sub.photos.length > 1) 
        ? ` (${sub.photos.length} trang)` 
        : '';

      if (isQuiz) {
        if (!sub) {
          statusBadge = `<span class="badge badge-warning">⚡ Trắc nghiệm</span>`;
          const qCount = (asn.quizData && asn.quizData.questions) ? asn.quizData.questions.length : 10;
          const durationStr = (asn.quizData && asn.quizData.durationMinutes) ? `${asn.quizData.durationMinutes} phút` : 'Tự do';
          actionBtn = `
            <button class="btn btn-primary btn-sm" style="width:100%; font-weight:700; background:linear-gradient(135deg, #2563eb, #1d4ed8); border:none; box-shadow:0 4px 12px rgba(37,99,235,0.28);" onclick="Quiz.startQuiz('${asn.id}')">
              ⚡ Làm Bài Trắc Nghiệm Ngay (${qCount} câu • ${durationStr})
            </button>
          `;
        } else {
          statusBadge = `<span class="badge badge-success">✅ Điểm: ${sub.score}/10</span>`;
          actionBtn = `
            <button class="btn btn-primary btn-sm" style="width:100%; font-weight:700; background:linear-gradient(135deg, #059669, #10b981); border:none; box-shadow:0 4px 12px rgba(5,150,105,0.25);" onclick="Quiz.openResultModal('${sub.id}')">
              📊 Xem Kết Quả & Lời Giải (${sub.score}đ)
            </button>
          `;
        }
      } else {
        if (!sub) {
          statusBadge = `<span class="badge badge-warning">⏳ Chưa nộp</span>`;
          actionBtn = `
            <button class="btn btn-primary btn-sm" style="width:100%;" onclick="App.openSubmitModal('${asn.id}')">
              📸 Chụp ảnh nộp bài ngay
            </button>
          `;
        } else if (sub.status === 'submitted') {
          statusBadge = `<span class="badge badge-primary">⏳ Chờ gia sư chấm${pageCount}</span>`;
          actionBtn = `
            <button class="btn btn-outline btn-sm" style="width:100%;" onclick="App.openReviewModal('${sub.id}')">
              🔍 Xem bài đã nộp${pageCount}
            </button>
          `;
        } else if (sub.status === 'graded') {
          statusBadge = `<span class="badge badge-success">✅ Điểm: ${sub.score}/10${pageCount}</span>`;
          actionBtn = `
            <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="App.openReviewModal('${sub.id}')">
              🔍 Xem lời phê & bút đỏ (${sub.score}đ)${pageCount}
            </button>
          `;
        }
      }

      let honestyRow = '';
      if (sub) {
        const cCount = sub.cheatCount || 0;
        const cDur = sub.cheatDuration || 0;
        if (cCount > 0) {
          honestyRow = `
            <div class="meta-row">
              <span>🛡️ Giám sát:</span>
              <button class="cheat-pill cheat-pill-danger" style="border:none; cursor:pointer;" onclick="event.stopPropagation(); AntiCheat.openLogModal('${sub.id}')">
                ⚠️ ${cCount} lần rời tab (${cDur}s) • Xem
              </button>
            </div>
          `;
        } else {
          honestyRow = `
            <div class="meta-row">
              <span>🛡️ Giám sát:</span>
              <span class="cheat-pill cheat-pill-clean">✓ Trung thực (0 rời tab)</span>
            </div>
          `;
        }
      } else {
        honestyRow = `
          <div class="meta-row">
            <span>🛡️ Chống gian lận:</span>
            <span style="font-size:11.5px; color:#059669; display:inline-flex; align-items:center; gap:5px;">
              <span class="pulse-indicator safe" style="width:7px; height:7px;"></span> Giám sát mở tab ngoài / AI
            </span>
          </div>
        `;
      }

      let attachmentBox = '';
      if (asn.attachmentName) {
        const ext = asn.attachmentName.split('.').pop().toLowerCase();
        let fileIcon = '📄';
        if (['pdf'].includes(ext)) fileIcon = '📕';
        else if (['doc', 'docx'].includes(ext)) fileIcon = '📘';
        else if (['xls', 'xlsx'].includes(ext)) fileIcon = '📗';
        else if (['png', 'jpg', 'jpeg'].includes(ext)) fileIcon = '🖼️';
        else if (['zip', 'rar'].includes(ext)) fileIcon = '📦';

        attachmentBox = `
          <div class="assignment-attachment-card">
            <div class="attachment-file-info">
              <span class="attachment-icon">${fileIcon}</span>
              <div class="attachment-names">
                <strong title="${asn.attachmentName}">${asn.attachmentName}</strong>
                <small>${asn.attachmentSize || 'Đề bài đính kèm'}</small>
              </div>
            </div>
            <a href="${asn.attachmentDataUrl || 'javascript:void(0)'}" download="${asn.attachmentName}" class="btn-download-attachment" onclick="App.handleDownloadAttachment(event, '${asn.id}')">
              📥 Tải về làm
            </a>
          </div>
        `;
      }

      let feedbackSnippet = '';
      if (sub && sub.status === 'graded' && sub.feedback) {
        feedbackSnippet = `
          <div style="background:#ecfdf5; border-left:3.5px solid #10b981; padding:8px 10px; border-radius:6px; margin:8px 0; font-size:12.5px; color:#065f46; line-height:1.45;">
            <strong>💬 Lời phê của Thầy/Cô:</strong> ${sub.feedback}
          </div>
        `;
      }

      let studentNoteSnippet = '';
      if (sub && (sub.studentNote || sub.note)) {
        const nText = sub.studentNote || sub.note;
        studentNoteSnippet = `
          <div style="font-size:11.5px; color:#64748b; font-style:italic; margin:4px 0;">
            💬 Lời nhắn của bạn: "${nText}"
          </div>
        `;
      }

      let classBadge = '';
      if (asn.classId) {
        const cls = (typeof Store.getClassById === 'function') ? Store.getClassById(asn.classId) : null;
        const clsName = cls ? cls.name : 'Cả lớp';
        classBadge = `<span class="badge" style="background:#e0e7ff; color:#3730a3; font-weight:700; font-size:11px; border:1px solid #c7d2fe;">🏫 ${clsName}</span>`;
      }

      return `
        <div class="assignment-card">
          <div class="card-top" style="flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="target-student-pill ${isIndividual ? 'individual' : ''}">
                ${isIndividual ? '🎯 Giao riêng cho bạn' : '👥 Bài tập cả lớp'}
              </span>
              ${classBadge}
            </div>
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <span class="badge ${isQuiz ? 'badge-warning' : 'badge-primary'}" style="font-size:11px;">
                ${isQuiz ? '⚡ Trắc nghiệm' : '📸 Tự luận'}
              </span>
              ${statusBadge}
            </div>
          </div>

          <h4>${asn.title}</h4>
          <p style="font-size:13.5px; color:var(--text-muted);">${asn.description}</p>
          ${attachmentBox}
          ${feedbackSnippet}
          ${studentNoteSnippet}

          <div class="assignment-meta">
            <div class="meta-row">
              <span>⏰ Hạn nộp:</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="color:var(--danger);">${deadline}</strong>
                ${urgencyBadge}
              </div>
            </div>
            ${honestyRow}
          </div>

          <div class="card-actions">
            ${actionBtn}
          </div>
        </div>
      `;
    }).join('');
  },

  // ================= THAM GIA LỚP HỌC BẰNG MÃ =================
  handleJoinClassDirect() {
    const input = document.getElementById('studentDirectJoinCodeInput');
    const code = input ? input.value.trim() : '';
    if (!code) {
      if (window.App && App.showToast) App.showToast('Vui lòng nhập mã lớp học (Ví dụ: TOAN12A1)!', 'warning');
      return;
    }
    const student = Auth.getCurrentUser();
    if (!student) return;

    if (this.isJoiningClass) return;
    this.isJoiningClass = true;

    try {
      const res = Store.joinClassByCode(student.id, code);
      if (res.success) {
        if (input) input.value = '';
        if (window.App && App.showToast) App.showToast(res.message, 'success');
        if (window.App && typeof App.renderCurrentView === 'function') {
          App.renderCurrentView();
        }
      } else {
        if (window.App && App.showToast) App.showToast(res.message, 'warning');
      }
    } finally {
      setTimeout(() => { this.isJoiningClass = false; }, 350);
    }
  },

  fillAndJoin(code) {
    const input = document.getElementById('studentDirectJoinCodeInput');
    if (input) {
      input.value = code;
    }
    this.openJoinClassModal(code);
  },

  openJoinClassModal(prefillCode = '') {
    let modal = document.getElementById('studentJoinClassModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'studentJoinClassModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const currentStudent = Auth.getCurrentUser();
    const currentClass = currentStudent ? Store.getStudentClass(currentStudent.id) : null;
    const allClasses = Store.getClasses ? Store.getClasses() : [];

    modal.innerHTML = `
      <div class="modal-box" style="max-width:520px; border-radius:18px; overflow:hidden; box-shadow:0 20px 48px rgba(0,0,0,0.25);">
        <div class="modal-header" style="background:linear-gradient(135deg, #065f46 0%, #059669 100%); color:#ffffff; padding:18px 22px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">🏫</span>
            <div>
              <h3 style="margin:0; font-size:17.5px; font-weight:800; color:#ffffff;">Vào Lớp Học Bằng Mã (Class Code)</h3>
              <span style="font-size:12px; color:rgba(255,255,255,0.85); display:block;">Hệ thống lớp học thông minh EduTask</span>
            </div>
          </div>
          <button type="button" class="modal-close-btn" onclick="StudentView.closeJoinClassModal()" style="color:#ffffff; font-size:20px; background:none; border:none; cursor:pointer;">✕</button>
        </div>
        <div class="modal-body" style="padding:22px;">
          ${currentClass ? `
            <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:#166534; display:flex; align-items:center; gap:8px;">
              <span>📌</span>
              <div>
                Hiện tại bạn đang ở lớp: <strong>${currentClass.name}</strong> (Mã: <code style="font-family:var(--font-mono); font-weight:800; color:#059669;">${currentClass.code}</code>).
                <small style="display:block; color:#15803d; margin-top:2px;">Nếu nhập mã mới thành công, bạn sẽ được tự động chuyển sang lớp mới!</small>
              </div>
            </div>
          ` : `
            <p style="margin:0 0 16px 0; font-size:13.5px; color:#64748b; line-height:1.5;">
              Vui lòng nhập chính xác mã lớp học do Thầy/Cô hoặc Gia sư cung cấp để nhận bài tập chung của lớp và thi đua điểm số.
            </p>
          `}

          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-weight:700; font-size:13.5px; color:#1e293b; margin-bottom:6px; display:block;">
              🔑 Nhập Mã Lớp Học:
            </label>
            <input 
              type="text" 
              id="modalJoinClassCodeInput" 
              placeholder="Ví dụ: TOAN12A1" 
              value="${prefillCode}"
              class="form-control" 
              style="text-transform:uppercase; font-family:var(--font-mono); font-weight:800; letter-spacing:2px; font-size:18px; padding:12px 16px; border:2px solid #059669; border-radius:10px; text-align:center; background:#f0fdf4;"
              oninput="StudentView.previewClassFromModal(this.value)"
              onkeydown="if(event.key==='Enter'){event.preventDefault(); StudentView.submitJoinClassFromModal();}"
              autofocus
            >
          </div>

          <!-- Khối xem trước thông tin lớp học theo thời gian thực -->
          <div id="modalClassPreviewBox" style="display:none; background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:12px; padding:12px 16px; margin-bottom:16px;">
          </div>

          ${allClasses.length > 0 ? `
            <div style="margin-bottom:16px;">
              <span style="font-size:12px; font-weight:700; color:#64748b; display:block; margin-bottom:6px;">Danh sách lớp học mở trên hệ thống:</span>
              <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:105px; overflow-y:auto; padding:2px;">
                ${allClasses.map(c => `
                  <button type="button" onclick="StudentView.selectClassInModal('${c.code}')" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:5px 10px; font-size:11.5px; cursor:pointer; color:#0f172a; font-weight:600; display:flex; align-items:center; gap:5px; box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:all 0.15s ease;" title="Chạm để chọn mã ${c.code}">
                    <span>🏫</span> <span>${c.name}</span> <span style="font-family:var(--font-mono); color:#059669; font-weight:700;">(${c.code})</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-outline" onclick="StudentView.closeJoinClassModal()" style="border-radius:8px; font-weight:600;">Hủy Bỏ</button>
            <button type="button" class="btn btn-primary" onclick="StudentView.submitJoinClassFromModal()" style="background:#059669; border-color:#059669; font-weight:700; padding:10px 22px; border-radius:8px; box-shadow:0 3px 10px rgba(5,150,105,0.25);">
              🚀 Xác Nhận Vào Lớp
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    modal.onclick = (e) => {
      if (e.target === modal) StudentView.closeJoinClassModal();
    };
    setTimeout(() => {
      const input = document.getElementById('modalJoinClassCodeInput');
      if (input) {
        input.focus();
        if (prefillCode) StudentView.previewClassFromModal(prefillCode);
      }
    }, 100);
  },

  closeJoinClassModal() {
    const modal = document.getElementById('studentJoinClassModal');
    if (modal) modal.classList.remove('active');
  },

  selectClassInModal(code) {
    const input = document.getElementById('modalJoinClassCodeInput');
    if (input) {
      input.value = code;
      this.previewClassFromModal(code);
    }
  },

  previewClassFromModal(code) {
    const previewBox = document.getElementById('modalClassPreviewBox');
    if (!previewBox) return;

    const clean = (code || '').trim().toUpperCase();
    if (!clean) {
      previewBox.style.display = 'none';
      return;
    }

    const cls = Store.getClassById(clean);
    if (cls) {
      const sCount = Array.isArray(cls.studentIds) ? cls.studentIds.length : 0;
      previewBox.style.display = 'block';
      previewBox.style.borderColor = '#86efac';
      previewBox.style.background = '#f0fdf4';
      previewBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:24px;">🟢</span>
          <div>
            <h5 style="margin:0; font-size:14px; font-weight:800; color:#166534;">${cls.name}</h5>
            <span style="font-size:12px; color:#15803d; display:block; margin-top:2px;">
              Gia sư: <strong>${cls.tutorName}</strong> • Phòng: <strong>${cls.room || 'Trực tuyến'}</strong> • Sĩ số: <strong>${sCount} HS</strong>
            </span>
          </div>
        </div>
      `;
    } else if (clean.length >= 3) {
      previewBox.style.display = 'block';
      previewBox.style.borderColor = '#fca5a5';
      previewBox.style.background = '#fef2f2';
      previewBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:#dc2626;">
          <span>⚠️</span> <span>Chưa tìm thấy lớp học với mã <strong>"${clean}"</strong>. Hãy kiểm tra lại chính xác mã từ Thầy/Cô!</span>
        </div>
      `;
    } else {
      previewBox.style.display = 'none';
    }
  },

  submitJoinClassFromModal() {
    const input = document.getElementById('modalJoinClassCodeInput');
    const code = input ? input.value.trim() : '';
    if (!code) {
      if (window.App && App.showToast) App.showToast('Vui lòng nhập mã lớp học!', 'warning');
      return;
    }
    const student = Auth.getCurrentUser();
    if (!student) return;

    if (this.isJoiningClass) return;
    this.isJoiningClass = true;

    try {
      const res = Store.joinClassByCode(student.id, code);
      if (res.success) {
        if (window.App && App.showToast) App.showToast(res.message, 'success');
        this.closeJoinClassModal();
        if (window.App && typeof App.renderCurrentView === 'function') {
          App.renderCurrentView();
        }
      } else {
        if (window.App && App.showToast) App.showToast(res.message, 'warning');
      }
    } finally {
      setTimeout(() => { this.isJoiningClass = false; }, 350);
    }
  },

  handleLeaveClass(classId, className) {
    if (confirm(`Bạn có chắc chắn muốn rời khỏi lớp "${className}"?\n\nSau khi rời, bạn vẫn có thể nhập mã lớp để quay trở lại bất kỳ lúc nào.`)) {
      const student = Auth.getCurrentUser();
      if (student) {
        const res = Store.leaveClass(student.id, classId);
        if (res.success) {
          if (window.App && App.showToast) App.showToast(res.message, 'info');
          App.renderCurrentView();
        } else {
          if (window.App && App.showToast) App.showToast(res.message, 'warning');
        }
      }
    }
  },

  copyClassCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      if (window.App && App.showToast) App.showToast(`📋 Đã sao chép mã lớp "${code}" vào bộ nhớ tạm!`, 'success');
    }).catch(() => {
      prompt('Mã lớp học của bạn:', code);
    });
  }
};

if (typeof window !== 'undefined') {
  window.StudentView = StudentView;
}
