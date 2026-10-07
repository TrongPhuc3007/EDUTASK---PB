/**
 * EDUTASK PRO — PARENT MODULE (CẤP 4: PHỤ HUYNH)
 * Giám sát tiến độ học tập, xem bài con đã nộp và lời phê của gia sư
 */

const ParentView = {
  render(container) {
    const parent = Auth.getCurrentUser();
    const student = Store.getUserById(parent.studentId);
    if (!student) {
      container.innerHTML = `<p>Không tìm thấy thông tin học sinh liên kết.</p>`;
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
          <p>Bảng theo dõi tiến độ học tập minh bạch của em: <strong>${student.name}</strong> (${student.grade || 'Lớp 12'})</p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-white" onclick="App.showToast('Đã sao chép liên kết báo cáo tiến độ học tập của con!', 'success')">
            🔗 Chia sẻ liên kết
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
            <span>Điểm trung bình bài tập</span>
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

      <!-- Bảng Tiến Độ Từng Bài Tập -->
      <div class="content-card">
        <div class="card-header">
          <h3>📋 Nhật Ký Bài Tập & Kết Quả Đánh Giá Của Con</h3>
          <span class="badge badge-success">Minh bạch 100%</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Bài Tập</th>
                <th>Hình Thức Giao</th>
                <th>Hạn Nộp</th>
                <th>Tình Trạng</th>
                <th>Điểm Số</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(asn => {
                const sub = Store.getSubmission(asn.id, student.id);
                const deadline = new Date(asn.deadline).toLocaleDateString('vi-VN');
                const isIndividual = asn.targetType === 'individual';

                let statusHtml = '<span class="badge badge-warning">Chưa làm</span>';
                let scoreHtml = '—';
                let actionHtml = '<span style="color:var(--text-muted); font-size:13px;">Đang đợi con nộp</span>';

                if (sub) {
                  if (sub.status === 'submitted') {
                    statusHtml = '<span class="badge badge-primary">Đã nộp, chờ chấm</span>';
                  } else if (sub.status === 'graded') {
                    statusHtml = '<span class="badge badge-success">Đã chấm điểm</span>';
                    scoreHtml = `<strong style="color:var(--primary); font-size:15px;">${sub.score}/10</strong>`;
                    actionHtml = `
                      <button class="btn btn-sm btn-secondary" onclick="App.openReviewModal('${sub.id}')">
                        🔍 Xem bài chấm bút đỏ
                      </button>
                    `;
                  }
                }

                return `
                  <tr>
                    <td>
                      <strong>${asn.title}</strong><br>
                      <small style="color:var(--text-muted);">${asn.description}</small>
                    </td>
                    <td>
                      <span class="target-student-pill ${isIndividual ? 'individual' : ''}">
                        ${isIndividual ? '🎯 Giao riêng' : '👥 Bài nhóm'}
                      </span>
                    </td>
                    <td>${deadline}</td>
                    <td>${statusHtml}</td>
                    <td>${scoreHtml}</td>
                    <td>${actionHtml}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};
