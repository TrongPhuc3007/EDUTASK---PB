/**
 * EDUTASK PRO — STUDENT MODULE (CẤP 3: HỌC SINH)
 * To-Do List bài tập của riêng em, chụp ảnh nộp bài và xem lời phê của gia sư
 */

const StudentView = {
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

    const myAssignments = Store.getAssignmentsForStudent(student.id);

    container.innerHTML = `
      <!-- Banner Học Sinh -->
      <div class="view-banner" style="background: linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%);">
        <div class="banner-info">
          <h2>Xin Chào, ${student.name}!</h2>
          <div style="font-size:13px; color:rgba(255,255,255,0.95); margin-bottom:4px;">
            Tên tài khoản: <strong style="font-family:var(--font-mono); color:#a7f3d0;">${student.username}</strong>
          </div>
          <p>Giáo viên phụ trách: <strong>${student.assignedTutorName || 'Gia Sư Phụ Trách'}</strong> | Lớp: <strong>${student.grade}</strong></p>
        </div>
        <div class="banner-actions">
          <div style="background:rgba(255,255,255,0.2); backdrop-filter:blur(6px); padding:8px 16px; border-radius:12px; text-align:center;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Mục tiêu điểm số</div>
            <div style="font-size:20px; font-weight:800;">${student.currentScore} ➔ ${student.targetScore}</div>
          </div>
        </div>
      </div>

      <!-- To-Do List Bài Tập Cá Nhân -->
      <div class="content-card">
        <div class="card-header">
          <h3>📚 Danh Sách Bài Tập Của Riêng Bạn (${myAssignments.length} bài)</h3>
          <span class="badge badge-primary">Chỉ hiển thị bài tập giao riêng cho bạn</span>
        </div>
        <div class="card-body">
          <div class="assignment-grid">
            ${this.renderStudentAssignmentCards(myAssignments, student.id)}
          </div>
        </div>
      </div>
    `;
  },

  renderStudentAssignmentCards(assignments, studentId) {
    if (assignments.length === 0) {
      return `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted);">
          <div style="font-size:36px; margin-bottom:8px;">🎉</div>
          <p>Tuyệt vời! Bạn đã hoàn thành toàn bộ bài tập được giao.</p>
        </div>
      `;
    }

    return assignments.map(asn => {
      const sub = Store.getSubmission(asn.id, studentId);
      const safeDeadlineStr = (asn.deadline && asn.deadline.includes('T') && asn.deadline.length === 16) 
        ? asn.deadline + ':00' 
        : (asn.deadline || '');
      const parsedDeadline = safeDeadlineStr ? new Date(safeDeadlineStr) : new Date();
      const deadline = isNaN(parsedDeadline.getTime()) ? 'Chưa ấn định' : parsedDeadline.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
      });

      let statusBadge = '';
      let actionBtn = '';

      if (!sub) {
        statusBadge = `<span class="badge badge-warning">⏳ Chưa nộp</span>`;
        actionBtn = `
          <button class="btn btn-primary btn-sm" style="width:100%;" onclick="App.openSubmitModal('${asn.id}')">
            📸 Chụp ảnh nộp bài ngay
          </button>
        `;
      } else if (sub.status === 'submitted') {
        statusBadge = `<span class="badge badge-primary">⏳ Chờ gia sư chấm</span>`;
        actionBtn = `
          <button class="btn btn-outline btn-sm" style="width:100%;" onclick="App.openReviewModal('${sub.id}')">
            🔍 Xem bài đã nộp
          </button>
        `;
      } else if (sub.status === 'graded') {
        statusBadge = `<span class="badge badge-success">✅ Điểm: ${sub.score}/10</span>`;
        actionBtn = `
          <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="App.openReviewModal('${sub.id}')">
            🔍 Xem lời phê & bút đỏ (${sub.score}đ)
          </button>
        `;
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
            ${statusBadge}
          </div>

          <h4>${asn.title}</h4>
          <p style="font-size:13.5px; color:var(--text-muted);">${asn.description}</p>
          ${attachmentBox}
          ${feedbackSnippet}
          ${studentNoteSnippet}

          <div class="assignment-meta">
            <div class="meta-row">
              <span>⏰ Hạn nộp:</span>
              <strong style="color:var(--danger);">${deadline}</strong>
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
