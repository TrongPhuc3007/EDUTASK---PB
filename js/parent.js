/**
 * EDUTASK PRO — PARENT MODULE (CẤP 4: PHỤ HUYNH)
 * Giám sát tiến độ học tập, xem bài con đã nộp và lời phê của gia sư,
 * sổ liên lạc điện tử minh bạch 100% và gửi phản hồi cho gia sư.
 */

const ParentView = {
  render(container) {
    const parent = Auth.getCurrentUser();
    const student = Store.getUserById(parent.studentId);
    if (!student) {
      container.innerHTML = `<div class="content-card" style="padding:40px; text-align:center;"><p>Không tìm thấy thông tin học sinh liên kết.</p></div>`;
      return;
    }

    const tutor = Store.getUserById(student.assignedTutorId || student.tutorId);
    const assignments = Store.getAssignmentsForStudent(student.id);

    // Tính điểm trung bình và bài hoàn thành
    const completedSubs = assignments
      .map(asn => Store.getSubmission(asn.id, student.id))
      .filter(s => s && s.status === 'graded');

    const avgScore = completedSubs.length > 0
      ? (completedSubs.reduce((acc, s) => acc + s.score, 0) / completedSubs.length).toFixed(1)
      : 'Chưa có';

    const cheatSummary = Store.getStudentCheatSummary ? Store.getStudentCheatSummary(student.id) : null;
    const honestyRate = cheatSummary ? (cheatSummary.honestyRate ?? cheatSummary.integrityRate ?? 100) : 100;

    container.innerHTML = `
      <!-- Banner Phụ Huynh -->
      <div class="view-banner" style="background: linear-gradient(135deg, #78350f 0%, #b45309 60%, #d97706 100%);">
        <div class="banner-info">
          <h2>Kính Chào Quý Phụ Huynh — ${parent.name}</h2>
          <p>Sổ liên lạc & tiến độ học tập minh bạch của em: <strong>${student.name}</strong> (${student.grade || 'Lớp 12'})</p>
        </div>
        <div class="banner-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-white" onclick="window.print()" title="In sổ liên lạc hoặc lưu PDF báo cáo">
            🖨️ In Sổ Liên Lạc
          </button>
          <button class="btn btn-secondary" onclick="ParentView.openMessageModal('${student.id}')" title="Gửi lời nhắn động viên hoặc dặn dò gia sư">
            💬 Nhắn Gửi Gia Sư
          </button>
        </div>
      </div>

      <!-- Thẻ Tóm Tắt Tình Hình Học Tập Của Con -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box metric-purple">👨‍🏫</div>
          <div class="metric-data">
            <h4>${tutor ? tutor.name : (student.assignedTutorName || 'Thầy Minh Đức')}</h4>
            <span>Gia sư phụ trách ${tutor && tutor.phone ? `• SĐT: ${tutor.phone}` : ''}</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box metric-blue">🎯</div>
          <div class="metric-data">
            <h4>${student.currentScore} ➔ ${student.targetScore}</h4>
            <span>Mục tiêu điểm số</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box metric-green">⭐</div>
          <div class="metric-data">
            <h4>${avgScore}/10</h4>
            <span>Điểm TB (${completedSubs.length}/${assignments.length} bài đã chấm)</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon-box ${honestyRate >= 80 ? 'metric-green' : 'metric-yellow'}">🛡️</div>
          <div class="metric-data">
            <h4>${honestyRate}%</h4>
            <span>Chỉ số trung thực (làm bài)</span>
          </div>
        </div>
      </div>

      <!-- Lời Dặn Của Phụ Huynh (Nếu có) -->
      ${student.parentNoteToTutor ? `
        <div class="content-card" style="background:#fffbeb; border:1px solid #fde68a; padding:16px 20px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#92400e; font-size:13.5px;">💬 Lời nhắn của Phụ huynh gửi Gia sư:</strong>
            <button class="btn btn-xs btn-outline" style="border-color:#d97706; color:#b45309;" onclick="ParentView.openMessageModal('${student.id}')">✏️ Cập nhật</button>
          </div>
          <p style="margin:6px 0 0 0; font-size:13.5px; color:#78350f; font-style:italic;">"${student.parentNoteToTutor}"</p>
        </div>
      ` : ''}

      <!-- Bảng Tiến Độ Từng Bài Tập -->
      <div class="content-card">
        <div class="card-header" style="flex-wrap:wrap; gap:8px; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0;">📋 Nhật Ký Bài Tập & Kết Quả Đánh Giá Của Con</h3>
            <small style="color:var(--text-muted); font-size:12.5px;">Dữ liệu đồng bộ trực tiếp từ bàn chấm bài của Gia sư</small>
          </div>
          <span class="badge badge-success">Minh bạch 100%</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Bài Tập</th>
                <th>Hình Thức</th>
                <th>Hạn Nộp</th>
                <th>Tình Trạng</th>
                <th>Điểm Số</th>
                <th>Lời Phê & Giám Sát</th>
                <th>Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(asn => {
                const sub = Store.getSubmission(asn.id, student.id);
                const safeDeadlineStr = (asn.deadline && asn.deadline.includes('T') && asn.deadline.length === 16) 
                  ? asn.deadline + ':00' 
                  : (asn.deadline || '');
                const parsedDeadline = safeDeadlineStr ? new Date(safeDeadlineStr) : new Date();
                const deadline = isNaN(parsedDeadline.getTime()) ? 'Chưa ấn định' : parsedDeadline.toLocaleString('vi-VN', {
                  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                });
                const isIndividual = asn.targetType === 'individual';

                let statusHtml = '<span class="badge badge-warning">Chưa làm</span>';
                let scoreHtml = '—';
                let feedbackHtml = '<span style="color:var(--text-muted); font-size:12px;">Đang đợi con làm bài</span>';
                let actionHtml = '<span style="color:var(--text-muted); font-size:13px;">—</span>';

                if (sub) {
                  const cheatCount = sub.cheatCount || 0;
                  const cheatBadge = cheatCount > 0
                    ? `<span style="font-size:11px; color:#dc2626; display:block; margin-top:3px;">🚨 Rời tab ${cheatCount} lần (${sub.cheatDuration || 0}s)</span>`
                    : `<span style="font-size:11px; color:#16a34a; display:block; margin-top:3px;">🛡️ 0 lần rời tab (Trung thực)</span>`;

                  if (sub.status === 'submitted') {
                    statusHtml = '<span class="badge badge-primary">Đã nộp, chờ chấm</span>';
                    feedbackHtml = `
                      <span style="color:#b45309; font-size:12px;">Bài nộp lúc ${new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}</span>
                      ${cheatBadge}
                    `;
                  } else if (sub.status === 'graded') {
                    statusHtml = '<span class="badge badge-success">Đã chấm điểm</span>';
                    scoreHtml = `<strong style="color:var(--primary); font-size:16px;">${sub.score}/10</strong>`;
                    feedbackHtml = `
                      <div style="font-size:12.5px; color:#1e293b; line-height:1.4;">${sub.feedback || 'Đã hoàn thành tốt.'}</div>
                      ${cheatBadge}
                    `;
                    actionHtml = sub.isQuiz ? `
                      <button class="btn btn-sm btn-primary" onclick="Quiz.openResultModal('${sub.id}')">
                        📊 Xem lời giải (${sub.score}đ)
                      </button>
                    ` : `
                      <button class="btn btn-sm btn-secondary" onclick="App.openReviewModal('${sub.id}')">
                        🔍 Xem bút đỏ (${sub.score}đ)
                      </button>
                    `;
                  }
                }

                return `
                  <tr>
                    <td>
                      <strong>${asn.title}</strong><br>
                      <small style="color:var(--text-muted);">${asn.description || ''}</small>
                    </td>
                    <td>
                      <span class="target-student-pill ${isIndividual ? 'individual' : ''}">
                        ${isIndividual ? '🎯 Giao riêng' : '👥 Cả lớp'}
                      </span>
                    </td>
                    <td>${deadline}</td>
                    <td>${statusHtml}</td>
                    <td>${scoreHtml}</td>
                    <td>${feedbackHtml}</td>
                    <td>${actionHtml}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openMessageModal(studentId) {
    const student = Store.getUserById(studentId);
    if (!student) return;

    const currentMsg = student.parentNoteToTutor || '';
    const newMsg = prompt('Nhập lời nhắn / dặn dò của Quý Phụ huynh gửi đến Gia sư phụ trách:\n(Ví dụ: Nhờ thầy cô kèm thêm hình không gian và kiểm tra bài tập trên lớp của cháu)', currentMsg);

    if (newMsg !== null) {
      student.parentNoteToTutor = newMsg.trim();
      Store.saveData();
      App.showToast('✓ Đã lưu và gửi lời nhắn đến Gia sư thành công!', 'success');
      App.renderCurrentView();
    }
  }
};

if (typeof window !== 'undefined') {
  window.ParentView = ParentView;
}
