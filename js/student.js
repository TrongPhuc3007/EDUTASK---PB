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

    container.innerHTML = `
      <!-- Banner Học Sinh & Tiến Độ Mục Tiêu -->
      <div class="view-banner" style="background: linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%);">
        <div class="banner-info">
          <h2>Xin Chào, ${student.name}!</h2>
          <div style="font-size:13px; color:rgba(255,255,255,0.95); margin-bottom:4px;">
            Tên tài khoản: <strong style="font-family:var(--font-mono); color:#a7f3d0;">${student.username}</strong>
          </div>
          <p>Giáo viên phụ trách: <strong>${student.assignedTutorName || 'Gia Sư Phụ Trách'}</strong> | Lớp: <strong>${studentClass ? `${studentClass.name} (Mã: ${studentClass.code})` : student.grade}</strong></p>
        </div>
        <div class="banner-actions" style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
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

      return `
        <div class="assignment-card">
          <div class="card-top">
            <span class="target-student-pill ${isIndividual ? 'individual' : ''}">
              ${isIndividual ? '🎯 Giao riêng cho bạn' : '👥 Bài tập chung cả lớp'}
            </span>
            <div style="display:flex; gap:6px; align-items:center;">
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
  }
};

if (typeof window !== 'undefined') {
  window.StudentView = StudentView;
}
