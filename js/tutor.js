/**
 * EDUTASK PRO — TUTOR MODULE (CẤP 2: GIA SƯ PHỤ TRÁCH)
 * Bàn làm việc chuyên môn cao cấp: Giao bài 1-1, lọc theo từng học sinh,
 * chấm bài bút đỏ trực quan, và tự động tạo tin nhắn Zalo gửi Phụ huynh.
 */

const TutorView = {
  currentFilter: 'all',          // 'all', 'pending_grading', 'waiting_submission', 'completed'
  selectedStudentId: null,       // null = tất cả, hoặc 'u_std_quang',...
  selectedClassId: null,         // null = tất cả học sinh, hoặc 'cls_12a1', 'cls_10a2'...
  activeClassTab: 'assignments', // 'assignments' | 'gradebook' | 'evaluation' | 'history' | 'leaderboard' | 'announcements'
  searchKeyword: '',
  historyFilter: 'all',          // 'all', 'test', 'quiz', 'photo', 'evaluation'
  historySearchKeyword: '',

  setClassScope(classId) {
    this.selectedClassId = classId;
    this.selectedStudentId = null;
    this.activeClassTab = 'assignments';
    this.currentFilter = 'all';
    App.renderCurrentView();
  },

  setClassTab(tabName) {
    this.activeClassTab = tabName;
    App.renderCurrentView();
  },

  setHistoryFilter(filter) {
    this.historyFilter = filter;
    App.renderCurrentView();
  },

  setHistorySearch(keyword) {
    this.historySearchKeyword = (keyword || '').toLowerCase().trim();
    App.renderCurrentView();
    const input = document.getElementById('classHistorySearchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  renderClassWorkspace(container, classId, tab = 'assignments') {
    this.selectedClassId = classId;
    this.selectedStudentId = null;
    this.activeClassTab = tab;
    this.render(container);
  },

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

  // ================= CÁC HÀM QUẢN LÝ LỚP HỌC (CLASSROOM EXPANSION) =================
  openCreateClassModal() {
    const user = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = user ? user.id : '';
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    const container = document.getElementById('newClassStudentCheckboxes');
    if (container) {
      if (students.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:12.5px; text-align:center; padding:10px;">Chưa có học sinh nào.</div>';
      } else {
        container.innerHTML = students.map(std => `
          <label style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:4px; cursor:pointer;">
            <input type="checkbox" name="newClassStudents" value="${std.id}">
            <span><strong>${std.name}</strong> <small style="color:var(--text-muted);">(${std.grade})</small></span>
          </label>
        `).join('');
      }
    }

    const nameEl = document.getElementById('newClassName');
    if (nameEl) nameEl.value = '';
    const codeEl = document.getElementById('newClassCode');
    if (codeEl) codeEl.value = 'LOP' + Math.floor(1000 + Math.random() * 9000);
    const roomEl = document.getElementById('newClassRoom');
    if (roomEl) roomEl.value = 'Phòng 301 / Trực Tuyến';

    const modal = document.getElementById('createClassModal');
    if (modal) modal.classList.add('active');
  },

  submitCreateClass() {
    const name = document.getElementById('newClassName')?.value.trim();
    const code = document.getElementById('newClassCode')?.value.trim().toUpperCase();
    const grade = document.getElementById('newClassGrade')?.value || 'Lớp 12';
    const subject = document.getElementById('newClassSubject')?.value.trim() || 'Toán Học';
    const room = document.getElementById('newClassRoom')?.value.trim() || 'Phòng Học Trực Tuyến';

    if (!name) {
      App.showToast('Vui lòng nhập tên lớp học!', 'error');
      return;
    }

    const checkedBoxes = document.querySelectorAll('input[name="newClassStudents"]:checked');
    const studentIds = Array.from(checkedBoxes).map(cb => cb.value);

    const user = Auth.getCurrentUser();
    const currentTutorId = user ? user.id : '';
    const tutorName = user ? user.name : 'Gia Sư Phụ Trách';

    const newCls = Store.addClass({
      name,
      code: code || ('LOP' + Math.floor(1000 + Math.random() * 9000)),
      grade,
      subject,
      room,
      tutorId: currentTutorId,
      tutorName,
      studentIds
    });

    App.closeModal('createClassModal');
    this.selectedClassId = newCls.id;
    this.activeClassTab = 'assignments';
    App.showToast(`🎉 Đã tạo thành công lớp học "${name}" với ${studentIds.length} học sinh!`, 'success');
    App.renderCurrentView();
  },

  openAddStudentToClassModal(classId) {
    const cls = Store.getClassById(classId || this.selectedClassId);
    if (!cls) return;

    const idInput = document.getElementById('addStudentToClassId');
    if (idInput) idInput.value = cls.id;

    const titleEl = document.getElementById('addStudentToClassModalTitle');
    if (titleEl) titleEl.textContent = `Thêm Học Sinh Vào ${cls.name}`;

    const user = Auth.getCurrentUser();
    const isMasterAdmin = Auth.isRealAdmin() && !Auth.isAdminSupervising();
    const currentTutorId = user ? user.id : '';
    const allStudents = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);
    const existingIds = cls.studentIds || [];
    const availableStudents = allStudents.filter(s => !existingIds.includes(s.id));

    const container = document.getElementById('availableStudentsForClassList');
    if (container) {
      if (availableStudents.length === 0) {
        container.innerHTML = `
          <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">
            Tất cả học sinh trong danh sách phụ trách đều đã có mặt trong lớp này!
          </div>
        `;
      } else {
        container.innerHTML = availableStudents.map(std => `
          <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; background:#f8fafc; border:1px solid #e2e8f0; cursor:pointer;">
            <input type="checkbox" name="studentsToAddToClass" value="${std.id}">
            <div>
              <strong>${std.name}</strong> <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--primary); font-weight:600;">(TK: ${std.username || 'Chưa cấp'})</span>
              <small style="display:block; color:var(--text-muted);">${std.school || ''} • ${std.grade}</small>
            </div>
          </label>
        `).join('');
      }
    }

    const modal = document.getElementById('addStudentToClassModal');
    if (modal) modal.classList.add('active');
  },

  submitAddStudentsToClass() {
    const classId = document.getElementById('addStudentToClassId')?.value;
    if (!classId) return;

    const checkedBoxes = document.querySelectorAll('input[name="studentsToAddToClass"]:checked');
    const studentIds = Array.from(checkedBoxes).map(cb => cb.value);

    if (studentIds.length === 0) {
      App.showToast('Vui lòng chọn ít nhất một học sinh để thêm vào lớp!', 'warning');
      return;
    }

    studentIds.forEach(sid => {
      Store.addStudentToClass(classId, sid);
    });

    App.closeModal('addStudentToClassModal');
    App.showToast(`✓ Đã thêm ${studentIds.length} học sinh vào lớp học!`, 'success');
    App.renderCurrentView();
  },

  removeStudentFromClass(classId, studentId, studentName) {
    if (!confirm(`Bạn có chắc muốn đưa học sinh "${studentName}" ra khỏi lớp học này?`)) return;
    Store.removeStudentFromClass(classId, studentId);
    App.showToast(`Đã đưa học sinh "${studentName}" ra khỏi lớp!`, 'info');
    App.renderCurrentView();
  },

  postClassAnnouncement(classId) {
    const title = document.getElementById('classAnnTitleInput')?.value.trim();
    const content = document.getElementById('classAnnContentInput')?.value.trim();

    if (!title || !content) {
      App.showToast('Vui lòng nhập cả tiêu đề và nội dung thông báo!', 'error');
      return;
    }

    const user = Auth.getCurrentUser();
    const authorName = user ? user.name : 'Giáo viên phụ trách';

    Store.addClassAnnouncement(classId, { title, content, authorName });
    App.showToast('📢 Đã đăng thông báo lên bảng tin lớp thành công!', 'success');
    App.renderCurrentView();
  },

  copyAnnouncementToClipboard(title, content, authorName, dateStr) {
    const text = `📢 [THÔNG BÁO TỪ LỚP HỌC - EDUTASK]\n` +
      `Tiêu đề: ${title}\n` +
      `Thời gian: ${dateStr}\n` +
      `Người gửi: ${authorName}\n\n` +
      `${content}\n\n` +
      `👉 Các em học sinh chú ý theo dõi và thực hiện đúng thời hạn!`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        App.showToast('📋 Đã sao chép nội dung thông báo! Bạn có thể dán vào nhóm Zalo lớp ngay.', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  },

  exportClassGradebookCSV(classId) {
    const gradebook = Store.getClassGradebook(classId);
    if (!gradebook) {
      App.showToast('Không tìm thấy dữ liệu lớp!', 'error');
      return;
    }

    const { classInfo, assignments, matrix, classAvg } = gradebook;
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = [];
    rows.push([`SỔ ĐIỂM ĐIỆN TỬ — ${classInfo.name.toUpperCase()}`]);
    rows.push([`Mã Lớp: ${classInfo.code}`, `Môn Học: ${classInfo.subject}`, `Khối: ${classInfo.grade}`, `Điểm TB Toàn Lớp: ${classAvg}`]);
    rows.push([`Ngày Xuất: ${new Date().toLocaleString('vi-VN')}`]);
    rows.push([]);

    // Header row
    const headers = ['STT', 'Mã Học Sinh', 'Họ Và Tên', 'Tài Khoản', 'Trường Học'];
    assignments.forEach(a => {
      headers.push(escapeCsv(a.title));
    });
    headers.push('Điểm TB', 'Số Bài Đã Nộp', 'Tỉ Lệ Hoàn Thành', 'Xếp Loại');
    rows.push(headers);

    // Data rows
    matrix.forEach((row, index) => {
      const cols = [
        index + 1,
        row.student.id,
        escapeCsv(row.student.name),
        row.student.username || '',
        escapeCsv(row.student.school || '')
      ];

      assignments.forEach(a => {
        const sc = row.scores[a.id];
        if (sc === null || sc === undefined) cols.push('Chưa nộp');
        else if (sc === 'pending') cols.push('Chờ chấm');
        else cols.push(sc);
      });

      cols.push(
        row.avgScore !== null ? row.avgScore : 'Chưa có',
        `${row.submittedCount}/${assignments.length}`,
        `${row.completionRate}%`,
        row.classification
      );

      rows.push(cols);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SoDiem_${classInfo.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    App.showToast(`📊 Đã xuất thành công sổ điểm lớp ${classInfo.name}!`, 'success');
  },

  renderClassGradebook(classId) {
    const gradebook = Store.getClassGradebook(classId);
    if (!gradebook) {
      return `<div class="content-card" style="padding:24px; text-align:center;">Không tìm thấy dữ liệu lớp học.</div>`;
    }

    const { classInfo, assignments, matrix, classAvg, distribution } = gradebook;
    const dist = distribution;

    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="content-card">
          <div class="card-header" style="flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="margin:0;">📊 Sổ Điểm Điện Tử — ${classInfo.name}</h3>
              <small style="color:var(--text-muted);">Mã lớp: <strong>${classInfo.code}</strong> • Sĩ số: <strong>${gradebook.students.length} học sinh</strong> • Điểm TB toàn lớp: <strong style="color:var(--primary); font-size:14px;">${classAvg}/10</strong></small>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-primary" onclick="TutorView.exportClassGradebookCSV('${classId}')">
                📥 Tải Sổ Điểm (Excel/CSV)
              </button>
              <button class="btn btn-sm btn-secondary" onclick="App.openCreateAssignmentModal(null, '${classId}')">
                ➕ Giao bài cho lớp
              </button>
            </div>
          </div>

          <div class="card-body" style="padding:16px 20px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:16px;">
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:11.5px; color:#166534; font-weight:700;">🟢 Giỏi (≥ 8.5đ)</div>
                <div style="font-size:20px; font-weight:800; color:#15803d; margin:2px 0;">${dist.excellent.count} em</div>
                <div style="font-size:11px; color:#166534;">${dist.excellent.percent}% cả lớp</div>
              </div>

              <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:11.5px; color:#1e40af; font-weight:700;">🔵 Khá (7.0 - 8.4đ)</div>
                <div style="font-size:20px; font-weight:800; color:#1d4ed8; margin:2px 0;">${dist.good.count} em</div>
                <div style="font-size:11px; color:#1e40af;">${dist.good.percent}% cả lớp</div>
              </div>

              <div style="background:#fefce8; border:1px solid #fef08a; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:11.5px; color:#854d0e; font-weight:700;">🟡 TB (5.0 - 6.9đ)</div>
                <div style="font-size:20px; font-weight:800; color:#a16207; margin:2px 0;">${dist.average.count} em</div>
                <div style="font-size:11px; color:#854d0e;">${dist.average.percent}% cả lớp</div>
              </div>

              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:11.5px; color:#991b1b; font-weight:700;">🔴 Yếu (< 5.0đ)</div>
                <div style="font-size:20px; font-weight:800; color:#b91c1c; margin:2px 0;">${dist.weak.count} em</div>
                <div style="font-size:11px; color:#991b1b;">${dist.weak.percent}% cả lớp</div>
              </div>
            </div>

            ${assignments.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted); background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1;">
                Lớp này chưa có bài tập nào. Hãy nhấn <strong>"➕ Giao bài cho lớp"</strong> để bắt đầu tạo ma trận điểm!
              </div>
            ` : `
              <div class="gradebook-table-container">
                <table class="gradebook-matrix-table">
                  <thead>
                    <tr>
                      <th style="width:45px;">STT</th>
                      <th style="text-align:left; min-width:160px;">Học Sinh</th>
                      <th style="width:85px;">Tài Khoản</th>
                      ${assignments.map(a => `
                        <th title="${a.title} (${new Date(a.deadline).toLocaleDateString('vi-VN')})">
                          <div style="max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;">${a.title}</div>
                          <span style="font-size:10px; font-weight:normal; opacity:0.8;">${a.type === 'quiz' ? '⚡TN' : '📸TL'}</span>
                        </th>
                      `).join('')}
                      <th style="background:#1e1b4b; color:#fde68a; min-width:85px;">Điểm TB</th>
                      <th style="min-width:90px;">Tiến Độ</th>
                      <th style="min-width:100px;">Xếp Loại</th>
                      <th style="background:#1e1b4b; color:#fff; min-width:80px;">Hạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${matrix.map((row, idx) => {
                      const rankIdx = gradebook.rankings.findIndex(r => r.student.id === row.student.id) + 1;
                      let rankBadge = `#${rankIdx}`;
                      if (rankIdx === 1) rankBadge = '🥇 Hạng 1';
                      else if (rankIdx === 2) rankBadge = '🥈 Hạng 2';
                      else if (rankIdx === 3) rankBadge = '🥉 Hạng 3';

                      let classifBadge = '';
                      if (row.classification === 'Giỏi') classifBadge = '<span class="badge badge-success">Giỏi</span>';
                      else if (row.classification === 'Khá') classifBadge = '<span class="badge badge-primary">Khá</span>';
                      else if (row.classification === 'Trung Bình') classifBadge = '<span class="badge badge-warning">Trung Bình</span>';
                      else if (row.classification === 'Yếu') classifBadge = '<span class="badge badge-danger">Yếu</span>';
                      else classifBadge = '<span class="badge badge-secondary">—</span>';

                      return `
                        <tr>
                          <td>${idx + 1}</td>
                          <td style="text-align:left;">
                            <strong style="color:var(--text-main);">${row.student.name}</strong>
                          </td>
                          <td style="font-family:var(--font-mono); font-size:12px; color:var(--primary); font-weight:600;">
                            ${row.student.username || '—'}
                          </td>
                          ${assignments.map(a => {
                            const sc = row.scores[a.id];
                            if (sc === null || sc === undefined) {
                              return `<td><span class="score-cell-pill score-pill-empty" title="Chưa nộp bài">—</span></td>`;
                            }
                            if (sc === 'pending') {
                              return `<td><span class="score-cell-pill score-pill-pending" title="Chờ gia sư chấm">⏳ Chờ chấm</span></td>`;
                            }
                            let pillCls = 'score-pill-weak';
                            if (sc >= 8.5) pillCls = 'score-pill-excellent';
                            else if (sc >= 7.0) pillCls = 'score-pill-good';
                            else if (sc >= 5.0) pillCls = 'score-pill-average';
                            return `<td><span class="score-cell-pill ${pillCls}">${sc}</span></td>`;
                          }).join('')}
                          <td style="font-weight:800; font-size:14px; color:${row.avgScore !== null ? 'var(--primary)' : 'var(--text-muted)'}; background:#f5f3ff;">
                            ${row.avgScore !== null ? row.avgScore : '—'}
                          </td>
                          <td>
                            <span style="font-size:11.5px; font-weight:700;">${row.submittedCount}/${assignments.length}</span>
                            <small style="color:var(--text-muted); font-size:11px;">(${row.completionRate}%)</small>
                          </td>
                          <td>${classifBadge}</td>
                          <td style="font-weight:700; font-size:12px; background:#f8fafc;">${rankBadge}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                  <tfoot>
                    <tr style="background:#f1f5f9; font-weight:700;">
                      <td colspan="3" style="text-align:right; font-weight:800; color:#1e293b; padding:12px;">
                        Điểm TB Cả Lớp Từng Bài:
                      </td>
                      ${assignments.map(a => {
                        const scores = matrix.map(r => r.scores[a.id]).filter(s => typeof s === 'number');
                        const avg = scores.length > 0 ? (scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(1) : '—';
                        return `<td style="font-weight:800; color:var(--primary); font-size:13px;">${avg}</td>`;
                      }).join('')}
                      <td style="font-size:15px; font-weight:800; color:var(--primary); background:#e0e7ff;">${classAvg}</td>
                      <td colspan="3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  renderClassLeaderboard(classId) {
    const gradebook = Store.getClassGradebook(classId);
    if (!gradebook) return '';
    const { classInfo, rankings } = gradebook;

    const rank1 = rankings[0];
    const rank2 = rankings[1];
    const rank3 = rankings[2];

    return `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3 style="margin:0;">🏆 Bảng Vinh Danh & Xếp Hạng — ${classInfo.name}</h3>
              <small style="color:var(--text-muted);">Ghi nhận nỗ lực học tập và thành tích xuất sắc của các em học sinh</small>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="TutorView.setClassTab('gradebook')">
              📊 Xem Sổ Điểm Chi Tiết
            </button>
          </div>

          <div class="card-body" style="padding:24px;">
            ${rankings.length > 0 ? `
              <div class="podium-container">
                <!-- Á Quân 2 -->
                ${rank2 ? `
                  <div class="podium-card rank-2">
                    <span style="font-size:28px;">🥈</span>
                    <strong style="font-size:14px; margin-top:4px;">${rank2.student.name}</strong>
                    <div style="font-size:12px; opacity:0.9;">Hạng 2</div>
                    <div style="font-size:22px; font-weight:800; margin-top:auto;">${rank2.avgScore !== null ? rank2.avgScore : '—'}đ</div>
                    <small style="font-size:11px; opacity:0.9;">Đã nộp: ${rank2.submittedCount} bài</small>
                  </div>
                ` : '<div style="width:170px;"></div>'}

                <!-- Quán Quân 1 -->
                ${rank1 ? `
                  <div class="podium-card rank-1">
                    <span style="font-size:36px;">👑</span>
                    <strong style="font-size:15.5px; margin-top:4px;">${rank1.student.name}</strong>
                    <div style="font-size:12.5px; font-weight:700;">🥇 Quán Quân</div>
                    <div style="font-size:26px; font-weight:900; margin-top:auto;">${rank1.avgScore !== null ? rank1.avgScore : '—'}đ</div>
                    <small style="font-size:11.5px; opacity:0.95;">Đã nộp: ${rank1.submittedCount} bài (${rank1.completionRate}%)</small>
                  </div>
                ` : ''}

                <!-- Quý Quân 3 -->
                ${rank3 ? `
                  <div class="podium-card rank-3">
                    <span style="font-size:26px;">🥉</span>
                    <strong style="font-size:14px; margin-top:4px;">${rank3.student.name}</strong>
                    <div style="font-size:12px; opacity:0.9;">Hạng 3</div>
                    <div style="font-size:20px; font-weight:800; margin-top:auto;">${rank3.avgScore !== null ? rank3.avgScore : '—'}đ</div>
                    <small style="font-size:11px; opacity:0.9;">Đã nộp: ${rank3.submittedCount} bài</small>
                  </div>
                ` : '<div style="width:170px;"></div>'}
              </div>
            ` : `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                Chưa có dữ liệu xếp hạng lớp.
              </div>
            `}

            <div style="margin-top:20px;">
              <h4 style="margin-bottom:12px; font-size:15px; color:#1e293b;">📋 Bảng Tổng Sắp Thành Tích Cả Lớp</h4>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${rankings.map((r, i) => `
                  <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:10px; background:${i < 3 ? '#faf5ff' : '#ffffff'}; border:1px solid ${i < 3 ? '#e9d5ff' : '#e2e8f0'};">
                    <div style="display:flex; align-items:center; gap:12px;">
                      <div style="font-size:16px; font-weight:800; width:30px; text-align:center; color:${i === 0 ? '#d97706' : (i === 1 ? '#64748b' : (i === 2 ? '#b45309' : '#94a3b8'))};">
                        ${i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i + 1}`))}
                      </div>
                      <div class="user-avatar" style="width:34px; height:34px; font-size:12px;">
                        ${r.student.avatarText || r.student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style="font-size:14px; color:var(--text-main);">${r.student.name}</strong>
                        <span style="font-size:11.5px; font-family:var(--font-mono); color:var(--primary); font-weight:600; margin-left:6px;">(${r.student.username || 'Chưa cấp'})</span>
                        <div style="font-size:12px; color:var(--text-muted);">${r.student.school || 'THPT'} • Mục tiêu: <strong>${r.student.targetScore || '9.0'}đ</strong></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:16px;">
                      <div style="text-align:right;">
                        <div style="font-size:16px; font-weight:800; color:var(--primary);">${r.avgScore !== null ? r.avgScore : '—'}đ</div>
                        <small style="color:var(--text-muted); font-size:11.5px;">TB toàn lớp</small>
                      </div>
                      <div style="text-align:right;">
                        <span class="badge ${r.completionRate === 100 ? 'badge-success' : 'badge-primary'}">${r.completionRate}% nộp bài</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderClassAnnouncements(classId) {
    const cls = Store.getClassById(classId);
    if (!cls) return '';

    const announcements = Array.isArray(cls.announcements) ? cls.announcements : [];
    const students = Store.getStudentsByClass(classId);

    return `
      <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px;">
        <div class="content-card">
          <div class="card-header">
            <h3>📢 Bảng Tin Lớp Học</h3>
            <span class="badge badge-primary">${announcements.length} thông báo</span>
          </div>

          <div class="card-body" style="padding:18px; display:flex; flex-direction:column; gap:16px;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:10px;">
              <strong style="font-size:13.5px; color:#1e293b;">✍️ Đăng Thông Báo Mới Cho Lớp</strong>
              <input type="text" id="classAnnTitleInput" class="form-control" placeholder="Tiêu đề thông báo (VD: Nhắc lịch kiểm tra 15 phút, tài liệu mới...)">
              <textarea id="classAnnContentInput" class="form-control" rows="3" placeholder="Nội dung thông báo chi tiết gửi cả lớp..."></textarea>
              <div style="display:flex; justify-content:flex-end;">
                <button class="btn btn-primary btn-sm" onclick="TutorView.postClassAnnouncement('${classId}')">
                  📢 Đăng Lên Bảng Tin Lớp
                </button>
              </div>
            </div>

            ${announcements.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted); background:#f8fafc; border-radius:8px;">
                Chưa có thông báo nào được đăng trên bảng tin lớp này.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${announcements.map(ann => {
                  const dateStr = new Date(ann.createdAt).toLocaleString('vi-VN');
                  const safeTitle = (ann.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                  const safeContent = (ann.content || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
                  const safeAuthor = (ann.authorName || 'Giáo viên').replace(/'/g, "\\'");
                  return `
                    <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:10px; padding:14px; box-shadow:var(--shadow-sm);">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                          <strong style="font-size:14.5px; color:#1e293b;">📌 ${ann.title}</strong>
                          <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                            ${ann.authorName || 'Giáo viên'} • ${dateStr}
                          </div>
                        </div>
                        <button class="btn btn-xs btn-outline" onclick="TutorView.copyAnnouncementToClipboard('${safeTitle}', '${safeContent}', '${safeAuthor}', '${dateStr}')" title="Sao chép nội dung đẹp mắt để dán vào nhóm Zalo">
                          📋 Sao chép gửi Zalo
                        </button>
                      </div>
                      <p style="font-size:13.5px; color:#334155; margin:0; line-height:1.5; white-space:pre-wrap;">${ann.content}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>

        <div class="content-card">
          <div class="card-header">
            <h3>🎒 Thành Viên Lớp (${students.length} em)</h3>
            <button class="btn btn-sm btn-primary" onclick="TutorView.openAddStudentToClassModal('${classId}')">
              ➕ Thêm Học Sinh
            </button>
          </div>

          <div class="card-body" style="padding:16px;">
            ${students.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                Chưa có học sinh nào trong lớp. Bấm <strong>"➕ Thêm Học Sinh"</strong> để đưa học sinh vào lớp.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${students.map(std => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="user-avatar" style="width:30px; height:30px; font-size:11px;">
                        ${std.avatarText || std.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style="font-size:13px; color:var(--text-main);">${std.name}</strong>
                        <div style="font-size:11px; color:var(--primary); font-family:var(--font-mono); font-weight:600;">
                          TK: ${std.username || 'Chưa cấp'}
                        </div>
                      </div>
                    </div>

                    <div style="display:flex; gap:6px; align-items:center;">
                      <button class="btn btn-xs btn-outline" onclick="AdminView.openStudentProfileModal('${std.id}')" title="Xem hồ sơ">
                        👁️
                      </button>
                      <button class="btn btn-xs btn-primary" onclick="App.openCreateAssignmentModal('${std.id}')" title="Giao bài riêng">
                        🎯
                      </button>
                      <button class="btn btn-xs btn-danger" onclick="TutorView.removeStudentFromClass('${classId}', '${std.id}', '${std.name}')" title="Xóa khỏi lớp học này">
                        ✕
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  // ================= CẢI TIẾN: ĐÁNH GIÁ CHO TOÀN LỚP (CLASS EVALUATION) =================
  openCreateClassEvaluationModal(classId, evalId = null) {
    const cls = Store.getClassById(classId || this.selectedClassId);
    if (!cls) return;

    const idInput = document.getElementById('classEvalId');
    const classIdInput = document.getElementById('classEvalClassId');
    const periodInput = document.getElementById('classEvalPeriod');
    const authorInput = document.getElementById('classEvalAuthor');
    const overallInput = document.getElementById('classEvalOverall');
    const strengthsInput = document.getElementById('classEvalStrengths');
    const weaknessesInput = document.getElementById('classEvalWeaknesses');
    const actionPlanInput = document.getElementById('classEvalActionPlan');
    const commendationsInput = document.getElementById('classEvalCommendations');
    const attentionInput = document.getElementById('classEvalAttention');

    const currentUser = Auth.getCurrentUser();
    const defaultAuthor = currentUser ? currentUser.name : (cls.tutorName || 'Giáo viên phụ trách');

    if (idInput) idInput.value = evalId || '';
    if (classIdInput) classIdInput.value = cls.id;

    if (evalId) {
      const evaluations = Store.getClassEvaluations(cls.id);
      const targetEval = evaluations.find(e => e.id === evalId);
      if (targetEval) {
        const titleEl = document.getElementById('classEvalModalTitle');
        if (titleEl) titleEl.textContent = `Chỉnh Sửa Đánh Giá — ${cls.name}`;
        if (periodInput) periodInput.value = targetEval.period || '';
        if (authorInput) authorInput.value = targetEval.createdBy || defaultAuthor;
        if (overallInput) overallInput.value = targetEval.overallComment || '';
        if (strengthsInput) strengthsInput.value = targetEval.strengths || '';
        if (weaknessesInput) weaknessesInput.value = targetEval.weaknesses || '';
        if (actionPlanInput) actionPlanInput.value = targetEval.actionPlan || '';
        if (commendationsInput) commendationsInput.value = targetEval.commendations || '';
        if (attentionInput) attentionInput.value = targetEval.attentionNeeded || '';
      }
    } else {
      const titleEl = document.getElementById('classEvalModalTitle');
      if (titleEl) titleEl.textContent = `Tạo Đánh Giá Định Kỳ Mới — ${cls.name}`;
      const now = new Date();
      if (periodInput) periodInput.value = `Đánh Giá Tuần ${Math.ceil(now.getDate() / 7)} - Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
      if (authorInput) authorInput.value = defaultAuthor;
      if (overallInput) overallInput.value = '';
      if (strengthsInput) strengthsInput.value = '';
      if (weaknessesInput) weaknessesInput.value = '';
      if (actionPlanInput) actionPlanInput.value = '';
      if (commendationsInput) commendationsInput.value = '';
      if (attentionInput) attentionInput.value = '';

      // Tự động gợi ý điền dữ liệu
      this.autoFillClassEvaluation();
    }

    const modal = document.getElementById('classEvaluationModal');
    if (modal) modal.classList.add('active');
  },

  autoFillClassEvaluation() {
    const classId = document.getElementById('classEvalClassId')?.value || this.selectedClassId;
    const cls = Store.getClassById(classId);
    if (!cls) return;

    const gradebook = Store.getClassGradebook(classId);
    if (!gradebook) return;

    const classAvg = gradebook.classAvg;
    const rankings = gradebook.rankings || [];

    // Tự động phân tích top học sinh xuất sắc (điểm >= 8.5 hoặc top 2)
    const topStudents = rankings.filter(r => r.avgScore !== null && r.avgScore >= 8.5);
    const commendationNames = (topStudents.length > 0 ? topStudents : rankings.slice(0, 2))
      .filter(r => r.avgScore !== null)
      .map(r => `${r.student.name} (${r.avgScore}đ)`)
      .join(', ');

    // Tự động phân tích các em cần đôn đốc (chưa nộp đủ bài hoặc điểm < 6.5)
    const needAttentionStudents = rankings
      .filter(r => r.avgScore !== null && (r.avgScore < 6.5 || r.completionRate < 70))
      .map(r => r.student.name);

    let overallMsg = `Cả lớp ${cls.name} duy trì nề nếp học tập nghiêm túc. Điểm trung bình toàn lớp đạt ${classAvg}/10. `;
    if (classAvg !== '—' && parseFloat(classAvg) >= 8.0) {
      overallMsg += `Đa số các em nắm rất chắc kiến thức trọng tâm, kỹ năng giải đề tự tin và nộp bài đều đặn.`;
    } else if (classAvg !== '—' && parseFloat(classAvg) >= 6.5) {
      overallMsg += `Các em nắm được kiến thức nền tảng, tuy nhiên cần tăng tốc độ làm bài và rèn thêm tính cẩn thận.`;
    } else {
      overallMsg += `Lớp cần tập trung ôn tập lại các dạng bài cơ bản và hoàn thành bài tập về nhà đầy đủ hơn.`;
    }

    const overallInput = document.getElementById('classEvalOverall');
    if (overallInput && !overallInput.value.trim()) {
      overallInput.value = overallMsg;
    }

    const strengthsInput = document.getElementById('classEvalStrengths');
    if (strengthsInput && !strengthsInput.value.trim()) {
      strengthsInput.value = `Tư duy đại số và khả năng áp dụng công thức tốt. Tinh thần tự giác làm bài của đa số học sinh cao.`;
    }

    const weaknessesInput = document.getElementById('classEvalWeaknesses');
    if (weaknessesInput && !weaknessesInput.value.trim()) {
      weaknessesInput.value = `Một số em còn lúng túng ở câu hỏi trắc nghiệm vận dụng cao và các bài toán hình học không gian.`;
    }

    const actionPlanInput = document.getElementById('classEvalActionPlan');
    if (actionPlanInput && !actionPlanInput.value.trim()) {
      actionPlanInput.value = `Tuần tới sẽ tăng cường 2 phiếu luyện tập trọng tâm và tổ chức 1 bài kiểm tra 30 phút rèn tốc độ.`;
    }

    const commendationsInput = document.getElementById('classEvalCommendations');
    if (commendationsInput && !commendationsInput.value.trim()) {
      commendationsInput.value = commendationNames ? `Tuyên dương các em: ${commendationNames}` : `Toàn bộ các em đã có nhiều nỗ lực hoàn thành bài tập.`;
    }

    const attentionInput = document.getElementById('classEvalAttention');
    if (attentionInput && !attentionInput.value.trim()) {
      attentionInput.value = needAttentionStudents.length > 0 
        ? `Đôn đốc các em hoàn thành bài tập đúng hạn: ${needAttentionStudents.join(', ')}`
        : `Nhắc nhở cả lớp nộp bài tập về nhà trước 21h00 hàng ngày.`;
    }

    App.showToast('⚡ Đã tự động phân tích và gợi ý số liệu đánh giá lớp!', 'info');
  },

  submitClassEvaluation() {
    const classId = document.getElementById('classEvalClassId')?.value;
    const evalId = document.getElementById('classEvalId')?.value;
    const period = document.getElementById('classEvalPeriod')?.value.trim();
    const overallComment = document.getElementById('classEvalOverall')?.value.trim();

    if (!classId) return;
    if (!period || !overallComment) {
      App.showToast('Vui lòng nhập Kỳ đánh giá và Nhận xét chung của lớp!', 'error');
      return;
    }

    const gradebook = Store.getClassGradebook(classId);
    const evalData = {
      id: evalId || ('eval_' + Date.now()),
      period,
      createdBy: document.getElementById('classEvalAuthor')?.value.trim() || 'Giáo viên phụ trách',
      overallComment,
      strengths: document.getElementById('classEvalStrengths')?.value.trim() || '',
      weaknesses: document.getElementById('classEvalWeaknesses')?.value.trim() || '',
      actionPlan: document.getElementById('classEvalActionPlan')?.value.trim() || '',
      commendations: document.getElementById('classEvalCommendations')?.value.trim() || '',
      attentionNeeded: document.getElementById('classEvalAttention')?.value.trim() || '',
      date: new Date().toISOString(),
      statsSnapshot: gradebook ? {
        classAvg: gradebook.classAvg,
        studentCount: gradebook.students.length,
        distribution: gradebook.distribution
      } : null
    };

    Store.saveClassEvaluation(classId, evalData);
    App.closeModal('classEvaluationModal');
    App.showToast(`✓ Đã lưu thành công bản đánh giá "${period}" cho lớp!`, 'success');
    App.renderCurrentView();
  },

  deleteClassEvaluation(classId, evalId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bản đánh giá định kỳ này?')) return;
    Store.deleteClassEvaluation(classId, evalId);
    App.showToast('Đã xóa bản đánh giá lớp.', 'info');
    App.renderCurrentView();
  },

  openClassEvaluationZaloModal(classId, evalId = null) {
    const cls = Store.getClassById(classId || this.selectedClassId);
    if (!cls) return;

    const evaluations = Store.getClassEvaluations(cls.id);
    const targetEval = evalId ? evaluations.find(e => e.id === evalId) : (evaluations.length > 0 ? evaluations[0] : null);

    if (!targetEval) {
      App.showToast('Chưa có bản đánh giá nào để tạo tin nhắn Zalo!', 'warning');
      return;
    }

    const gradebook = Store.getClassGradebook(cls.id);
    const students = Store.getStudentsByClass(cls.id);
    const dist = gradebook ? gradebook.distribution : { excellent: {percent:0}, good: {percent:0}, average: {percent:0}, weak: {percent:0} };

    let avgCompletionRate = 0;
    if (gradebook && gradebook.matrix.length > 0) {
      const sumRates = gradebook.matrix.reduce((acc, row) => acc + row.completionRate, 0);
      avgCompletionRate = Math.round(sumRates / gradebook.matrix.length);
    }

    const dateStr = new Date(targetEval.date).toLocaleDateString('vi-VN');
    const msg = `🏫 BÁO CÁO ĐÁNH GIÁ TÌNH HÌNH HỌC TẬP — ${cls.name.toUpperCase()}
📅 Kỳ đánh giá: ${targetEval.period} (${dateStr})
👨‍🏫 Giáo viên phụ trách: ${targetEval.createdBy || cls.tutorName}

1. TỔNG QUAN KẾT QUẢ CẢ LỚP:
• Sĩ số lớp: ${students.length} học sinh
• Điểm trung bình toàn lớp: ${gradebook ? gradebook.classAvg : '—'}/10
• Tỷ lệ hoàn thành bài tập về nhà: ${avgCompletionRate}%
• Phân bổ học lực: Giỏi ${dist.excellent.percent}% | Khá ${dist.good.percent}% | TB ${dist.average.percent}% | Cần cố gắng ${dist.weak.percent}%

2. NHẬN XÉT CỦA GIÁO VIÊN:
• Nề nếp & Thái độ: ${targetEval.overallComment}
${targetEval.strengths ? `• Ưu điểm nổi bật: ${targetEval.strengths}` : ''}
${targetEval.weaknesses ? `• Nội dung cần củng cố: ${targetEval.weaknesses}` : ''}

3. TUYÊN DƯƠNG & KHEN THƯỞNG:
🌟 ${targetEval.commendations || 'Ghi nhận sự nỗ lực của toàn thể học sinh trong lớp.'}

4. HỌC SINH CẦN PHỤ HUYNH PHỐI HỢP ĐÔN ĐỐC:
⚠️ ${targetEval.attentionNeeded || 'Nhắc nhở các em hoàn thành bài tập trước hạn quy định.'}

5. KẾ HOẠCH HỌC TẬP THỜI GIAN TỚI:
🎯 ${targetEval.actionPlan || 'Tiếp tục rèn luyện theo lộ trình chuyên đề.'}

Trân trọng cảm ơn Quý phụ huynh đã luôn đồng hành cùng các con và lớp học!`;

    const previewBox = document.getElementById('classEvaluationZaloPreview');
    if (previewBox) {
      previewBox.textContent = msg;
    }

    const modal = document.getElementById('classEvaluationZaloModal');
    if (modal) modal.classList.add('active');
  },

  copyClassEvaluationZalo() {
    const previewBox = document.getElementById('classEvaluationZaloPreview');
    if (!previewBox) return;
    const text = previewBox.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        App.showToast('📋 Đã sao chép báo cáo Zalo cả lớp! Bạn có thể dán (Ctrl+V) gửi ngay vào nhóm lớp.', 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  },

  applyQuickNote(studentId, noteText) {
    const input = document.getElementById(`stdEvalNote_${studentId}`);
    if (input) {
      const cur = input.value.trim();
      input.value = cur ? `${cur} ${noteText}` : noteText;
      input.focus();
    }
  },

  saveStudentEvaluationNote(classId, studentId) {
    const input = document.getElementById(`stdEvalNote_${studentId}`);
    if (!input) return;
    const note = input.value.trim();

    const evaluations = Store.getClassEvaluations(classId);
    let latestEval = evaluations.length > 0 ? evaluations[0] : null;

    if (!latestEval) {
      latestEval = Store.saveClassEvaluation(classId, {
        period: `Đánh Giá Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        overallComment: 'Bản đánh giá tổng hợp tình hình học tập và nhận xét chi tiết từng học sinh.',
        studentNotes: { [studentId]: note }
      });
    } else {
      Store.updateStudentClassEvaluationNote(classId, latestEval.id, studentId, note);
    }

    App.showToast(`✓ Đã lưu nhận xét cho học sinh!`, 'success');
  },

  exportClassEvaluationCSV(classId) {
    if (window.Store && typeof Store.exportClassEvaluationCSV === 'function') {
      return Store.exportClassEvaluationCSV(classId);
    }
  },

  remindClassStudents(classId) {
    const cls = Store.getClassById(classId || this.selectedClassId);
    if (!cls) return;

    const students = Store.getStudentsByClass(cls.id);
    const assignments = Store.getAllAssignments().filter(asn => {
      if (asn.classId === cls.id) return true;
      return asn.targetStudentIds && asn.targetStudentIds.some(sid => (cls.studentIds || []).includes(sid));
    });

    const pendingList = [];
    assignments.forEach(asn => {
      const targetIds = (asn.targetStudentIds || []).filter(sid => (cls.studentIds || []).includes(sid));
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
      App.showToast(`🎉 Tuyệt vời! 100% học sinh lớp "${cls.name}" đều đã nộp bài đầy đủ, không có bài tập nào bị trễ hạn.`, 'success');
      return;
    }

    let msg = `🔔 THÔNG BÁO NHẮC NỘP BÀI TẬP — LỚP: ${cls.name.toUpperCase()}\n`;
    msg += `(Ngày: ${new Date().toLocaleDateString('vi-VN')})\n\n`;
    msg += `Kính gửi Quý phụ huynh và các em học sinh,\nThầy/Cô xin gửi danh sách các bạn còn bài tập về nhà chưa hoàn thành trên hệ thống EduTask:\n\n`;

    pendingList.forEach((item, idx) => {
      msg += `${idx + 1}. Em ${item.studentName}: "${item.asnTitle}" (Hạn nộp: ${item.deadline})\n`;
    });

    msg += `\nCác em hãy tranh thủ đăng nhập làm và gửi bài để Thầy/Cô chấm điểm bút đỏ nhé!\nTrân trọng.`;

    this.fallbackCopy(msg);
    alert(`📋 ĐÃ SAO CHÉP NỘI DUNG NHẮC NỘP BÀI LỚP "${cls.name}"!\n\nBạn có thể dán (Ctrl+V) ngay vào nhóm Zalo lớp:\n\n${msg}`);
  },

  renderClassEvaluation(classId) {
    const cls = Store.getClassById(classId);
    if (!cls) {
      return `<div class="content-card" style="padding:24px; text-align:center;">Không tìm thấy dữ liệu lớp học.</div>`;
    }

    const students = Store.getStudentsByClass(classId);
    const gradebook = Store.getClassGradebook(classId);
    const evaluations = Store.getClassEvaluations(classId);
    const latestEval = evaluations.length > 0 ? evaluations[0] : null;
    const historyData = Store.getClassTestHistory(classId);

    const classAvg = gradebook ? gradebook.classAvg : '—';
    const dist = gradebook ? gradebook.distribution : { excellent: {count:0, percent:0}, good: {count:0, percent:0}, average: {count:0, percent:0}, weak: {count:0, percent:0} };

    let totalAssignments = gradebook ? gradebook.assignments.length : 0;
    let avgCompletionRate = 0;
    if (gradebook && gradebook.matrix.length > 0) {
      const sumRates = gradebook.matrix.reduce((acc, row) => acc + row.completionRate, 0);
      avgCompletionRate = Math.round(sumRates / gradebook.matrix.length);
    }

    let totalIntegrity = 0;
    students.forEach(s => {
      const cheat = Store.getStudentCheatSummary(s.id);
      totalIntegrity += cheat.integrityRate;
    });
    const classIntegrityRate = students.length > 0 ? Math.round(totalIntegrity / students.length) : 100;

    let classOverallRating = 'Khá';
    if (classAvg !== '—' && typeof classAvg === 'string' && parseFloat(classAvg) >= 8.5) classOverallRating = 'Xuất Sắc / Giỏi';
    else if (classAvg !== '—' && parseFloat(classAvg) >= 7.0) classOverallRating = 'Khá';
    else if (classAvg !== '—' && parseFloat(classAvg) >= 5.0) classOverallRating = 'Trung Bình';
    else if (classAvg !== '—') classOverallRating = 'Cần Cố Gắng';

    return `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- KHỐI 1: TỔNG QUAN NĂNG LỰC & HỌC LỰC TOÀN LỚP -->
        <div class="content-card">
          <div class="card-header" style="flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="margin:0;">📝 Báo Cáo Đánh Giá Toàn Diện — ${cls.name}</h3>
              <small style="color:var(--text-muted);">Đánh giá năng lực, chuyên cần, nề nếp học tập và định hướng cải thiện kết quả</small>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-sm btn-primary" onclick="TutorView.openCreateClassEvaluationModal('${classId}')">
                ➕ Tạo Báo Cáo Đánh Giá Mới
              </button>
              ${latestEval ? `
                <button class="btn btn-sm btn-secondary" onclick="TutorView.openClassEvaluationZaloModal('${classId}', '${latestEval.id}')" title="Xem trước mẫu tin nhắn chuẩn bị gửi Zalo phụ huynh cả lớp">
                  💬 Gửi Zalo Cả Lớp
                </button>
              ` : ''}
              <button class="btn btn-sm btn-outline" onclick="TutorView.exportClassEvaluationCSV('${classId}')" title="Tải file báo cáo đánh giá Excel/CSV">
                📥 Tải Báo Cáo CSV
              </button>
            </div>
          </div>

          <div class="card-body" style="padding:20px;">
            <!-- 4 Thẻ Chỉ Số Vàng -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin-bottom:20px;">
              <div style="background:linear-gradient(135deg, #eff6ff, #dbeafe); border:1.5px solid #bfdbfe; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#1e40af;">📊 ĐIỂM TB TOÀN LỚP</div>
                <div style="font-size:26px; font-weight:900; color:#1d4ed8; margin:4px 0;">${classAvg}/10</div>
                <span class="badge badge-primary" style="font-size:11px;">Học lực: ${classOverallRating}</span>
              </div>

              <div style="background:linear-gradient(135deg, #f0fdf4, #dcfce7); border:1.5px solid #bbf7d0; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#166534;">✍️ TỶ LỆ NỘP BÀI TẬP</div>
                <div style="font-size:26px; font-weight:900; color:#15803d; margin:4px 0;">${avgCompletionRate}%</div>
                <span class="badge badge-success" style="font-size:11px;">${totalAssignments} đề bài tập đã giao</span>
              </div>

              <div style="background:linear-gradient(135deg, #faf5ff, #f3e8ff); border:1.5px solid #e9d5ff; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#6b21a8;">🛡️ ĐỘ TRUNG THỰC LÀM BÀI</div>
                <div style="font-size:26px; font-weight:900; color:#7e22ce; margin:4px 0;">${classIntegrityRate}%</div>
                <span class="badge" style="background:#ede9fe; color:#5b21b6; font-size:11px;">Giám sát chống gian lận</span>
              </div>

              <div style="background:linear-gradient(135deg, #fffbeb, #fef3c7); border:1.5px solid #fde68a; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#92400e;">🎒 SĨ SỐ THÀNH VIÊN</div>
                <div style="font-size:26px; font-weight:900; color:#b45309; margin:4px 0;">${students.length} em</div>
                <span class="badge badge-warning" style="font-size:11px;">100% Đang theo học</span>
              </div>
            </div>

            <!-- Phổ điểm học lực trực quan -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:13px; color:#1e293b;">📈 Phân Bổ Học Lực Cả Lớp:</strong>
                <span style="font-size:12px; color:var(--text-muted);">Dựa trên toàn bộ điểm kiểm tra & bài tập</span>
              </div>
              <div style="display:flex; height:18px; border-radius:9px; overflow:hidden; gap:2px; background:#e2e8f0;">
                <div style="width:${dist.excellent.percent}%; background:#10b981;" title="Giỏi (≥8.5đ): ${dist.excellent.count} em (${dist.excellent.percent}%)"></div>
                <div style="width:${dist.good.percent}%; background:#3b82f6;" title="Khá (7.0-8.4đ): ${dist.good.count} em (${dist.good.percent}%)"></div>
                <div style="width:${dist.average.percent}%; background:#f59e0b;" title="Trung bình (5.0-6.9đ): ${dist.average.count} em (${dist.average.percent}%)"></div>
                <div style="width:${dist.weak.percent}%; background:#ef4444;" title="Yếu (<5.0đ): ${dist.weak.count} em (${dist.weak.percent}%)"></div>
              </div>
              <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:8px; font-size:12px;">
                <span>🟢 <strong>Giỏi:</strong> ${dist.excellent.count} em (${dist.excellent.percent}%)</span>
                <span>🔵 <strong>Khá:</strong> ${dist.good.count} em (${dist.good.percent}%)</span>
                <span>🟡 <strong>TB:</strong> ${dist.average.count} em (${dist.average.percent}%)</span>
                <span>🔴 <strong>Yếu:</strong> ${dist.weak.count} em (${dist.weak.percent}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- KHỐI 2: BẢN ĐÁNH GIÁ ĐỊNH KỲ CỦA GIÁO VIÊN -->
        <div class="content-card">
          <div class="card-header" style="flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:22px;">📋</span>
              <div>
                <h3 style="margin:0;">Nhật Ký Đánh Giá Định Kỳ Của Giáo Viên</h3>
                <small style="color:var(--text-muted);">${evaluations.length} kỳ đánh giá đã ghi nhận</small>
              </div>
            </div>
            ${latestEval ? `
              <div style="display:flex; gap:8px;">
                <button class="btn btn-sm btn-outline" onclick="TutorView.openCreateClassEvaluationModal('${classId}', '${latestEval.id}')">
                  ✏️ Chỉnh Sửa Đánh Giá
                </button>
                <button class="btn btn-sm btn-secondary" onclick="TutorView.openClassEvaluationZaloModal('${classId}', '${latestEval.id}')">
                  💬 Xem Báo Cáo Zalo
                </button>
              </div>
            ` : ''}
          </div>

          <div class="card-body" style="padding:20px;">
            ${latestEval ? `
              <div style="background:#ffffff; border:1.5px solid #c7d2fe; border-radius:14px; padding:20px; box-shadow:0 4px 14px rgba(99,102,241,0.08);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; border-bottom:1px solid #e0e7ff; padding-bottom:12px; flex-wrap:wrap; gap:8px;">
                  <div>
                    <h4 style="margin:0; font-size:17px; color:#312e81;">📌 ${latestEval.period}</h4>
                    <div style="font-size:12.5px; color:var(--text-muted); margin-top:3px;">
                      Người đánh giá: <strong>${latestEval.createdBy}</strong> • Ngày lập: <strong>${new Date(latestEval.date).toLocaleDateString('vi-VN')}</strong>
                    </div>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-xs btn-outline" onclick="TutorView.openClassEvaluationZaloModal('${classId}', '${latestEval.id}')">
                      📋 Mẫu Zalo
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="TutorView.deleteClassEvaluation('${classId}', '${latestEval.id}')" title="Xóa bản đánh giá này">
                      🗑️ Xóa
                    </button>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px;">
                    <strong style="color:#1e293b; font-size:13.5px; display:block; margin-bottom:4px;">📝 Nhận Xét Chung Về Tình Hình & Thái Độ Học Tập Cả Lớp:</strong>
                    <p style="margin:0; font-size:13.5px; color:#334155; line-height:1.6; white-space:pre-wrap;">${latestEval.overallComment}</p>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px 14px;">
                      <strong style="color:#166534; font-size:13px; display:block; margin-bottom:4px;">🟢 Ưu Điểm Nổi Bật:</strong>
                      <p style="margin:0; font-size:13px; color:#14532d; line-height:1.5;">${latestEval.strengths || 'Tích cực làm bài và nắm kiến thức cơ bản tốt.'}</p>
                    </div>

                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px 14px;">
                      <strong style="color:#991b1b; font-size:13px; display:block; margin-bottom:4px;">🔴 Điểm Yếu & Cần Củng Cố Thêm:</strong>
                      <p style="margin:0; font-size:13px; color:#7f1d1d; line-height:1.5;">${latestEval.weaknesses || 'Cần chú ý cẩn thận hơn ở khâu tính toán nháp.'}</p>
                    </div>
                  </div>

                  <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px 16px;">
                    <strong style="color:#1e40af; font-size:13px; display:block; margin-bottom:4px;">🎯 Kế Hoạch & Phương Hướng Rèn Luyện Tới:</strong>
                    <p style="margin:0; font-size:13px; color:#1e3a8a; line-height:1.5;">${latestEval.actionPlan || 'Tiếp tục luyện đề theo chuyên đề và kiểm tra định kỳ.'}</p>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div style="background:#fffbeb; border:1px solid #fef08a; border-radius:10px; padding:12px 14px;">
                      <strong style="color:#854d0e; font-size:13px; display:block; margin-bottom:4px;">🌟 Tuyên Dương & Khen Thưởng:</strong>
                      <p style="margin:0; font-size:13px; color:#713f12; line-height:1.5;">${latestEval.commendations || 'Ghi nhận sự cố gắng của toàn thể học sinh trong lớp.'}</p>
                    </div>

                    <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:12px 14px;">
                      <strong style="color:#9a3412; font-size:13px; display:block; margin-bottom:4px;">⚠️ Cần Phụ Huynh Phối Hợp Đôn Đốc:</strong>
                      <p style="margin:0; font-size:13px; color:#7c2d12; line-height:1.5;">${latestEval.attentionNeeded || 'Nhắc nhở các em hoàn thành bài tập trước 21h hàng ngày.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ` : `
              <div style="text-align:center; padding:36px; background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:12px;">
                <div style="font-size:36px; margin-bottom:8px;">📝</div>
                <h4 style="margin-bottom:6px; color:#334155;">Lớp này chưa có bản đánh giá định kỳ nào</h4>
                <p style="color:var(--text-muted); font-size:13.5px; max-width:480px; margin:0 auto 16px auto;">
                  Hãy tạo bản đánh giá định kỳ để ghi nhận thành tích, nhận xét ưu/nhược điểm và tự động xuất tin nhắn Zalo gửi phụ huynh cả lớp.
                </p>
                <button class="btn btn-primary btn-sm" onclick="TutorView.openCreateClassEvaluationModal('${classId}')">
                  ➕ Tạo Bản Đánh Giá Đầu Tiên Cho Lớp
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- KHỐI 3: BẢNG NHẬN XÉT CHI TIẾT TỪNG HỌC SINH TRONG LỚP -->
        <div class="content-card">
          <div class="card-header">
            <div>
              <h3 style="margin:0;">🎒 Nhận Xét & Lời Khuyên Cho Từng Học Sinh Trong Lớp</h3>
              <small style="color:var(--text-muted);">Ghi chú nhận xét riêng cho từng em (tự động đưa vào báo cáo cá nhân hóa)</small>
            </div>
            <span class="badge badge-primary">${students.length} học sinh</span>
          </div>

          <div class="card-body" style="padding:16px;">
            ${students.length === 0 ? `
              <div style="text-align:center; padding:30px; color:var(--text-muted);">
                Chưa có học sinh nào trong lớp.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:12px;">
                ${students.map((std, idx) => {
                  const stdMatrix = gradebook ? gradebook.matrix.find(m => m.student.id === std.id) : null;
                  const scoreStr = stdMatrix && stdMatrix.avgScore !== null ? `${stdMatrix.avgScore}đ` : '—';
                  const completionStr = stdMatrix ? `${stdMatrix.submittedCount}/${stdMatrix.totalAsns} (${stdMatrix.completionRate}%)` : '—';
                  const existingNote = (latestEval && latestEval.studentNotes && latestEval.studentNotes[std.id]) || '';

                  return `
                    <div style="border:1.5px solid #e2e8f0; border-radius:12px; padding:14px; background:#ffffff; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:10px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                          <div class="user-avatar" style="width:34px; height:34px; font-size:12px;">
                            ${std.avatarText || std.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style="font-size:14px; color:var(--text-main);">${std.name}</strong>
                            <span style="font-size:11.5px; font-family:var(--font-mono); color:var(--primary); font-weight:600; margin-left:6px;">(${std.username || 'Chưa cấp'})</span>
                            <div style="font-size:12px; color:var(--text-muted);">${std.school || ''} • ${std.grade || ''}</div>
                          </div>
                        </div>

                        <div style="display:flex; align-items:center; gap:12px;">
                          <div style="text-align:right;">
                            <div style="font-size:15px; font-weight:800; color:var(--primary);">${scoreStr}</div>
                            <small style="color:var(--text-muted); font-size:11px;">Điểm TB</small>
                          </div>
                          <div style="text-align:right;">
                            <div style="font-size:13px; font-weight:700; color:#334155;">${completionStr}</div>
                            <small style="color:var(--text-muted); font-size:11px;">Tiến độ bài tập</small>
                          </div>
                        </div>
                      </div>

                      <div style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <label style="font-size:12px; font-weight:700; color:#475569; margin:0;">
                            ✍️ Lời phê & Lời khuyên của Giáo viên:
                          </label>
                          <div style="display:flex; gap:4px; flex-wrap:wrap;">
                            <button type="button" class="btn btn-xs btn-outline" onclick="TutorView.applyQuickNote('${std.id}', 'Tiếp thu nhanh, tư duy giải đề tốt.')" style="font-size:10.5px; padding:1px 6px;">
                              + Tiếp thu nhanh
                            </button>
                            <button type="button" class="btn btn-xs btn-outline" onclick="TutorView.applyQuickNote('${std.id}', 'Cần cẩn thận hơn ở khâu tính toán cuối.')" style="font-size:10.5px; padding:1px 6px;">
                              + Tính cẩn thận
                            </button>
                            <button type="button" class="btn btn-xs btn-outline" onclick="TutorView.applyQuickNote('${std.id}', 'Chăm chỉ, làm bài đầy đủ đúng hạn.')" style="font-size:10.5px; padding:1px 6px;">
                              + Chăm chỉ
                            </button>
                            <button type="button" class="btn btn-xs btn-outline" onclick="TutorView.applyQuickNote('${std.id}', 'Tiến bộ rõ rệt so với giai đoạn trước.')" style="font-size:10.5px; padding:1px 6px;">
                              + Tiến bộ vượt bậc
                            </button>
                          </div>
                        </div>

                        <div style="display:flex; gap:8px;">
                          <input type="text" id="stdEvalNote_${std.id}" class="form-control" style="font-size:13px;" placeholder="Nhập lời phê riêng cho ${std.name}..." value="${existingNote.replace(/"/g, '&quot;')}">
                          <button class="btn btn-sm btn-primary" onclick="TutorView.saveStudentEvaluationNote('${classId}', '${std.id}')" style="white-space:nowrap; padding:6px 12px;">
                            💾 Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- KHỐI 4: GHI NHẬN CÁC ĐỢT KIỂM TRA & ĐÁNH GIÁ GẦN ĐÂY -->
        <div class="content-card">
          <div class="card-header" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="margin:0;">📜 Lịch Sử & Ghi Nhận Các Đợt Kiểm Tra Gần Đây</h3>
              <small style="color:var(--text-muted);">Mốc thời gian tổ chức các bài kiểm tra và tóm tắt những nội dung cập nhật mới nhất</small>
            </div>
            <button class="btn btn-sm btn-outline" onclick="TutorView.setClassTab('history')" style="font-weight:700; color:var(--primary); border-color:var(--primary);">
              🔍 Xem Toàn Bộ Lịch Sử (${historyData.items.length} đợt)
            </button>
          </div>
          <div class="card-body" style="padding:16px;">
            ${historyData.items.length === 0 ? `
              <div style="text-align:center; padding:24px; color:var(--text-muted);">
                Chưa có đợt kiểm tra nào được ghi nhận. Bấm <strong>"➕ Giao bài cho lớp"</strong> để bắt đầu tổ chức đợt kiểm tra.
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${historyData.items.slice(0, 3).map((item, idx) => `
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                      <span style="font-size:24px;">${item.itemType === 'test' ? (item.category.includes('Trắc nghiệm') ? '⚡' : '📸') : '📝'}</span>
                      <div>
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                          <span class="badge ${item.statusColor ? `badge-${item.statusColor}` : 'badge-primary'}" style="font-size:10.5px;">${item.category}</span>
                          <strong style="font-size:13.5px; color:#1e293b;">${item.title}</strong>
                        </div>
                        <small style="color:var(--text-muted); font-size:11.5px;">
                          🕒 Cập nhật: ${new Date(item.lastUpdated).toLocaleString('vi-VN')} • Người phụ trách: <strong>${item.author}</strong>
                        </small>
                      </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                      ${item.itemType === 'test' ? `
                        <div style="text-align:right;">
                          <strong style="color:${item.avgScore ? '#15803d' : 'var(--text-muted)'}; font-size:14px;">${item.avgScore ? item.avgScore + '/10' : 'Chưa có điểm'}</strong><br>
                          <small style="color:var(--text-muted); font-size:11px;">Đã nộp: ${item.submittedCount}/${item.targetCount}</small>
                        </div>
                      ` : ''}
                      <button class="btn btn-xs btn-outline" onclick="TutorView.openClassTestDetailModal('${item.id}', '${item.itemType}')">
                        🔍 Chi tiết
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  // ================= RENDER TAB LỊCH SỬ & THỐNG KÊ CÁC ĐỢT KIỂM TRA =================
  renderClassTestHistory(classId) {
    const historyData = Store.getClassTestHistory(classId);
    const { classInfo, items, summary } = historyData;

    if (!classInfo) {
      return `<div class="content-card" style="padding:24px; text-align:center;">Không tìm thấy dữ liệu lớp học.</div>`;
    }

    // Lọc theo loại hình
    let filteredItems = items;
    if (this.historyFilter === 'quiz') {
      filteredItems = filteredItems.filter(i => i.itemType === 'test' && i.category.includes('Trắc nghiệm'));
    } else if (this.historyFilter === 'photo') {
      filteredItems = filteredItems.filter(i => i.itemType === 'test' && i.category.includes('Tự luận'));
    } else if (this.historyFilter === 'test') {
      filteredItems = filteredItems.filter(i => i.itemType === 'test');
    } else if (this.historyFilter === 'evaluation') {
      filteredItems = filteredItems.filter(i => i.itemType === 'evaluation');
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.historySearchKeyword) {
      const q = this.historySearchKeyword;
      filteredItems = filteredItems.filter(i => {
        const titleMatch = (i.title || '').toLowerCase().includes(q);
        const topicMatch = (i.topic || '').toLowerCase().includes(q);
        const descMatch = (i.description || '').toLowerCase().includes(q);
        const updatesMatch = (i.updatedDetails || []).some(u => u.text.toLowerCase().includes(q));
        return titleMatch || topicMatch || descMatch || updatesMatch;
      });
    }

    const quizCount = items.filter(i => i.itemType === 'test' && i.category.includes('Trắc nghiệm')).length;
    const photoCount = items.filter(i => i.itemType === 'test' && i.category.includes('Tự luận')).length;
    const lastUpdatedStr = summary.lastUpdatedDate ? new Date(summary.lastUpdatedDate).toLocaleString('vi-VN') : 'Chưa có';

    return `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- KHỐI 1: TỔNG QUAN & BỐN CHỈ SỐ LỊCH SỬ KIỂM TRA -->
        <div class="content-card">
          <div class="card-header" style="flex-wrap:wrap; gap:10px; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="margin:0;">📜 Danh Sách Thống Kê & Lịch Sử Các Đợt Kiểm Tra — ${classInfo.name}</h3>
              <small style="color:var(--text-muted);">Ghi nhận toàn diện các mốc thời gian tổ chức kiểm tra, đánh giá định kỳ và chi tiết cập nhật</small>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-sm btn-primary" onclick="App.openCreateAssignmentModal(null, '${classId}')">
                ➕ Giao Bài Kiểm Tra Mới
              </button>
              <button class="btn btn-sm btn-secondary" onclick="TutorView.openCreateClassEvaluationModal('${classId}')">
                📝 Tạo Đánh Giá Định Kỳ
              </button>
              <button class="btn btn-sm btn-outline" onclick="Store.exportClassTestHistoryCSV('${classId}')" title="Tải bảng tính Excel/CSV lịch sử kiểm tra">
                📥 Tải File CSV
              </button>
            </div>
          </div>

          <div class="card-body" style="padding:20px;">
            <!-- 4 Thẻ Thống Kê -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
              <div style="background:linear-gradient(135deg, #eff6ff, #dbeafe); border:1.5px solid #bfdbfe; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#1e40af;">🎯 TỔNG CÁC ĐỢT GHI NHẬN</div>
                <div style="font-size:26px; font-weight:900; color:#1d4ed8; margin:4px 0;">${summary.totalItems} đợt</div>
                <span class="badge badge-primary" style="font-size:11px;">${summary.totalTests} bài KT • ${summary.totalEvals} bản ĐG</span>
              </div>

              <div style="background:linear-gradient(135deg, #f0fdf4, #dcfce7); border:1.5px solid #bbf7d0; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#166534;">🔄 CẬP NHẬT GẦN NHẤT</div>
                <div style="font-size:15px; font-weight:800; color:#15803d; margin:8px 0;">${lastUpdatedStr}</div>
                <span class="badge badge-success" style="font-size:11px;">Đồng bộ thời gian thực</span>
              </div>

              <div style="background:linear-gradient(135deg, #faf5ff, #f3e8ff); border:1.5px solid #e9d5ff; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#6b21a8;">📈 ĐIỂM TB TOÀN DIỆN</div>
                <div style="font-size:26px; font-weight:900; color:#7e22ce; margin:4px 0;">${summary.overallAvgScore}/10</div>
                <span class="badge" style="background:#ede9fe; color:#5b21b6; font-size:11px;">Qua toàn bộ bài kiểm tra</span>
              </div>

              <div style="background:linear-gradient(135deg, #fffbeb, #fef3c7); border:1.5px solid #fde68a; border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; font-weight:700; color:#92400e;">✍️ TỶ LỆ HOÀN THÀNH</div>
                <div style="font-size:26px; font-weight:900; color:#b45309; margin:4px 0;">${summary.avgCompletionRate}%</div>
                <span class="badge badge-warning" style="font-size:11px;">Nộp bài đúng hạn</span>
              </div>
            </div>

            <!-- Toolbar Lọc & Tìm Kiếm -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 16px;">
              <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <button type="button" class="btn btn-sm ${this.historyFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="TutorView.setHistoryFilter('all')" style="border-radius:20px; font-size:12.5px;">
                  📋 Tất Cả (${items.length})
                </button>
                <button type="button" class="btn btn-sm ${this.historyFilter === 'quiz' ? 'btn-primary' : 'btn-outline'}" onclick="TutorView.setHistoryFilter('quiz')" style="border-radius:20px; font-size:12.5px;">
                  ⚡ Trắc Nghiệm (${quizCount})
                </button>
                <button type="button" class="btn btn-sm ${this.historyFilter === 'photo' ? 'btn-primary' : 'btn-outline'}" onclick="TutorView.setHistoryFilter('photo')" style="border-radius:20px; font-size:12.5px;">
                  📸 Tự Luận (${photoCount})
                </button>
                <button type="button" class="btn btn-sm ${this.historyFilter === 'evaluation' ? 'btn-primary' : 'btn-outline'}" onclick="TutorView.setHistoryFilter('evaluation')" style="border-radius:20px; font-size:12.5px;">
                  📝 Đánh Giá Định Kỳ (${summary.totalEvals})
                </button>
              </div>

              <div style="display:flex; gap:8px; align-items:center;">
                <input 
                  type="text" 
                  id="classHistorySearchInput"
                  class="form-control" 
                  placeholder="🔍 Tìm đợt kiểm tra, nội dung..." 
                  value="${this.historySearchKeyword}"
                  oninput="TutorView.setHistorySearch(this.value)"
                  style="width:260px; font-size:13px; padding:6px 12px; border-radius:8px;"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- KHỐI 2: DANH SÁCH DÒNG THỜI GIAN CÁC ĐỢT KIỂM TRA -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${filteredItems.length === 0 ? `
            <div class="content-card" style="text-align:center; padding:48px 20px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:16px;">
              <div style="font-size:42px; margin-bottom:12px;">📂</div>
              <h4 style="color:#1e293b; margin-bottom:6px;">Không tìm thấy đợt kiểm tra nào phù hợp</h4>
              <p style="color:#64748b; font-size:14px; max-width:440px; margin:0 auto 16px auto;">
                Hãy thử chọn bộ lọc khác hoặc nhấn "Giao Bài Kiểm Tra Mới" để tổ chức đợt kiểm tra đầu tiên cho lớp.
              </p>
              <button class="btn btn-primary btn-sm" onclick="App.openCreateAssignmentModal(null, '${classId}')">
                ➕ Giao Bài Kiểm Tra Mới Cho Lớp
              </button>
            </div>
          ` : filteredItems.map((item, idx) => {
            const isTest = item.itemType === 'test';
            const icon = isTest ? (item.category.includes('Trắc nghiệm') ? '⚡' : '📸') : '📝';

            return `
              <div class="content-card" style="border:1.5px solid #e2e8f0; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <!-- Header của đợt -->
                <div style="background:${isTest ? '#f8fafc' : '#f5f3ff'}; padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                  <div style="display:flex; align-items:flex-start; gap:12px;">
                    <div style="width:44px; height:44px; border-radius:12px; background:${isTest ? '#e0f2fe' : '#ede9fe'}; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
                      ${icon}
                    </div>
                    <div>
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                        <span class="badge ${item.statusColor ? `badge-${item.statusColor}` : 'badge-primary'}" style="font-size:11px; font-weight:700;">
                          ${item.category}
                        </span>
                        <span class="badge" style="background:#ffffff; color:#334155; border:1px solid #cbd5e1; font-size:11px;">
                          ${item.statusLabel}
                        </span>
                        <span style="font-size:12px; color:var(--text-muted);">
                          #Đợt ${filteredItems.length - idx}
                        </span>
                      </div>
                      <h4 style="margin:0 0 4px 0; font-size:16px; color:#1e293b;">
                        ${item.title}
                      </h4>
                      <div style="font-size:12.5px; color:#64748b; display:flex; gap:16px; flex-wrap:wrap;">
                        <span>Chuyên đề: <strong style="color:#334155;">${item.topic}</strong></span>
                        <span>Người phụ trách: <strong style="color:#334155;">${item.author}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                    <div style="font-size:12px; color:var(--text-muted); text-align:right;">
                      <div>🕒 Giao/Tạo: <strong>${new Date(item.createdAt).toLocaleString('vi-VN')}</strong></div>
                      <div>🔄 Cập nhật: <strong style="color:var(--primary);">${new Date(item.lastUpdated).toLocaleString('vi-VN')}</strong></div>
                    </div>
                  </div>
                </div>

                <!-- Thân đợt: Kết quả & Chi tiết nội dung cập nhật -->
                <div style="padding:18px 20px;">
                  ${isTest ? `
                    <!-- 4 Thẻ Chỉ Số Của Riêng Đợt Này -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:16px;">
                      <div style="background:#f1f5f9; padding:10px 14px; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#64748b; text-transform:uppercase;">Tiến độ nộp</div>
                        <strong style="font-size:16px; color:#0f172a;">${item.submittedCount}/${item.targetCount}</strong>
                      </div>
                      <div style="background:#f0fdf4; padding:10px 14px; border-radius:8px; text-align:center; border:1px solid #bbf7d0;">
                        <div style="font-size:11px; color:#166534; text-transform:uppercase;">Điểm TB đợt</div>
                        <strong style="font-size:16px; color:#15803d;">${item.avgScore !== null ? item.avgScore + '/10' : 'Chưa chấm'}</strong>
                      </div>
                      <div style="background:#fffbeb; padding:10px 14px; border-radius:8px; text-align:center; border:1px solid #fde68a;">
                        <div style="font-size:11px; color:#854d0e; text-transform:uppercase;">Thủ khoa đợt</div>
                        <strong style="font-size:16px; color:#b45309;">${item.highestScore !== null ? item.highestScore + 'đ' : '—'}</strong>
                      </div>
                      <div style="background:#fef2f2; padding:10px 14px; border-radius:8px; text-align:center; border:1px solid #fecaca;">
                        <div style="font-size:11px; color:#991b1b; text-transform:uppercase;">Thấp nhất</div>
                        <strong style="font-size:16px; color:#b91c1c;">${item.lowestScore !== null ? item.lowestScore + 'đ' : '—'}</strong>
                      </div>
                    </div>
                  ` : ''}

                  <!-- GHI NHẬN CẬP NHẬT NHỮNG GÌ -->
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                      <strong style="font-size:13px; color:#1e293b; display:flex; align-items:center; gap:6px;">
                        <span>📝</span> Ghi Nhận Lịch Sử Cập Nhật & Thay Đổi Của Đợt Này:
                      </strong>
                      <span style="font-size:11.5px; color:var(--text-muted);">${item.updatedDetails.length} mốc ghi nhận</span>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                      ${item.updatedDetails.map(u => `
                        <div style="display:flex; align-items:flex-start; gap:8px; font-size:13px; color:#334155; line-height:1.5;">
                          <span style="font-size:15px; flex-shrink:0;">${u.icon}</span>
                          <div style="flex:1;">
                            ${u.text}
                          </div>
                          <small style="color:#94a3b8; font-size:11px; white-space:nowrap;">
                            ${new Date(u.time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                          </small>
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Thanh Thao Tác Chân Đợt -->
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:6px;">
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                      <button class="btn btn-sm btn-primary" onclick="TutorView.openClassTestDetailModal('${item.id}', '${item.itemType}')" style="font-weight:700;">
                        🔍 Xem Chi Tiết Bảng Điểm & Lời Phê
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="TutorView.copyTestZaloSummary('${item.id}', '${item.itemType}')" title="Sao chép báo cáo Zalo đợt này">
                        📋 Sao Chép Báo Cáo Zalo Đợt Này
                      </button>
                    </div>

                    <div style="display:flex; gap:6px;">
                      ${isTest ? `
                        <button class="btn btn-xs btn-secondary" onclick="App.openEditAssignmentModal('${item.id}')" title="Chỉnh sửa bài kiểm tra">
                          ✏️ Sửa Đề
                        </button>
                      ` : `
                        <button class="btn btn-xs btn-secondary" onclick="TutorView.openCreateClassEvaluationModal('${classId}', '${item.id}')" title="Chỉnh sửa bản đánh giá">
                          ✏️ Sửa Đánh Giá
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openClassTestDetailModal(testId, itemType = null) {
    const cls = Store.getClassById(this.selectedClassId);
    if (!cls) return;

    // Tự động nhận diện itemType nếu người dùng/hệ thống không truyền vào
    if (!itemType) {
      const isAsn = Store.getAssignmentById(testId);
      itemType = isAsn ? 'test' : 'evaluation';
    }

    const modal = document.getElementById('classTestDetailModal');
    const titleEl = document.getElementById('classTestDetailTitle');
    const subtitleEl = document.getElementById('classTestDetailSubtitle');
    const contentEl = document.getElementById('classTestDetailContent');
    const footerActionsEl = document.getElementById('classTestDetailFooterActions');

    if (itemType === 'test') {
      const asn = Store.getAssignmentById(testId);
      if (!asn) return;
      const subs = Store.getSubmissionsByAssignment(testId);
      const students = Store.getStudentsByClass(cls.id);
      const isQuiz = asn.type === 'quiz' || asn.submissionType === 'quiz';

      titleEl.textContent = `Bảng Điểm & Chi Tiết Đợt: "${asn.title}"`;
      subtitleEl.textContent = `Lớp: ${cls.name} • Hình thức: ${isQuiz ? 'Trắc nghiệm Online' : 'Tự luận viết tay'} • Hạn chót: ${asn.deadline ? new Date(asn.deadline).toLocaleString('vi-VN') : 'Không hạn'}`;

      contentEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:14px;">
          <!-- Tóm Tắt Nhanh -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px; font-size:13px; color:#334155; line-height:1.6;">
            <div>📌 <strong>Chuyên đề:</strong> ${asn.topic || 'Ôn tập'}</div>
            <div>⏰ <strong>Thời gian giao:</strong> ${new Date(asn.createdAt).toLocaleString('vi-VN')}</div>
            <div>📋 <strong>Yêu cầu:</strong> ${asn.description || 'Hoàn thành đầy đủ bài tập.'}</div>
          </div>

          <!-- Bảng Điểm Từng Học Sinh -->
          <div style="overflow-x:auto;">
            <table class="table" style="width:100%; border-collapse:collapse; font-size:13px;">
              <thead>
                <tr style="background:#f1f5f9; text-align:left;">
                  <th style="padding:10px 12px; width:45px;">STT</th>
                  <th style="padding:10px 12px;">Học Sinh</th>
                  <th style="padding:10px 12px; width:120px;">Trạng Thái</th>
                  <th style="padding:10px 12px; width:80px; text-align:center;">Điểm</th>
                  <th style="padding:10px 12px; min-width:180px;">Lời Phê / Nhận Xét</th>
                  <th style="padding:10px 12px; width:110px; text-align:center;">Giám Sát</th>
                  <th style="padding:10px 12px; width:110px; text-align:center;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((std, idx) => {
                  const sub = subs.find(s => s.studentId === std.id);
                  let statusHtml = '<span class="badge badge-warning">⏳ Chưa nộp</span>';
                  let scoreHtml = '—';
                  let feedbackHtml = '<span style="color:#94a3b8; font-style:italic;">Chưa có</span>';
                  let cheatHtml = '<span style="color:#10b981; font-size:11.5px;">✓ Trung thực</span>';
                  let actionBtn = '';

                  if (sub) {
                    if (sub.status === 'graded') {
                      statusHtml = '<span class="badge badge-success">✅ Đã chấm</span>';
                      scoreHtml = `<strong style="font-size:15px; color:${sub.score >= 8 ? '#15803d' : (sub.score >= 5 ? '#2563eb' : '#dc2626')};">${sub.score}đ</strong>`;
                      feedbackHtml = sub.feedback ? `<span style="color:#166534;">💬 ${sub.feedback}</span>` : '<span style="color:#94a3b8; font-style:italic;">Chưa phê</span>';
                      actionBtn = `<button class="btn btn-xs btn-outline" onclick="App.openReviewModal('${sub.id}')">🔍 Xem bài</button>`;
                    } else {
                      statusHtml = '<span class="badge badge-primary">⏳ Chờ chấm</span>';
                      actionBtn = isQuiz 
                        ? `<button class="btn btn-xs btn-primary" onclick="Quiz.openResultModal('${sub.id}')">📊 Xem điểm</button>`
                        : `<button class="btn btn-xs btn-primary" onclick="App.openGraderModal('${sub.id}')">✍️ Chấm ngay</button>`;
                    }

                    if (sub.cheatCount > 0) {
                      cheatHtml = `<span class="badge badge-danger" style="font-size:10.5px;">⚠️ Rời tab ${sub.cheatCount} lần</span>`;
                    }
                  }

                  return `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="padding:10px 12px; text-align:center;">${idx + 1}</td>
                      <td style="padding:10px 12px;">
                        <strong>${std.name}</strong><br>
                        <small style="color:var(--text-muted); font-family:var(--font-mono);">${std.username || 'Chưa cấp'}</small>
                      </td>
                      <td style="padding:10px 12px;">${statusHtml}</td>
                      <td style="padding:10px 12px; text-align:center;">${scoreHtml}</td>
                      <td style="padding:10px 12px;">${feedbackHtml}</td>
                      <td style="padding:10px 12px; text-align:center;">${cheatHtml}</td>
                      <td style="padding:10px 12px; text-align:center;">${actionBtn}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      footerActionsEl.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="TutorView.copyTestZaloSummary('${asn.id}', 'test')">
          📋 Sao Chép Báo Cáo Zalo Đợt Này
        </button>
      `;
    } else {
      const evals = Store.getClassEvaluations(cls.id);
      const ev = evals.find(e => e.id === testId);
      if (!ev) return;

      titleEl.textContent = `Bản Đánh Giá Định Kỳ: "${ev.period}"`;
      subtitleEl.textContent = `Lớp: ${cls.name} • Người đánh giá: ${ev.createdBy} • Ngày: ${new Date(ev.date || ev.createdAt).toLocaleDateString('vi-VN')}`;

      contentEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:14px; font-size:13.5px; line-height:1.6;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px;">
            <strong style="color:#1e293b;">📝 Nhận Xét Chung:</strong>
            <p style="margin:4px 0 0 0; color:#334155; white-space:pre-wrap;">${ev.overallComment || 'Chưa cập nhật'}</p>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px 14px;">
              <strong style="color:#166534;">🟢 Ưu Điểm Nổi Bật:</strong>
              <p style="margin:4px 0 0 0; color:#14532d;">${ev.strengths || 'Nắm vững kiến thức'}</p>
            </div>
            <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px 14px;">
              <strong style="color:#991b1b;">🔴 Cần Củng Cố:</strong>
              <p style="margin:4px 0 0 0; color:#7f1d1d;">${ev.weaknesses || 'Cần cẩn thận tính toán'}</p>
            </div>
          </div>

          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px 16px;">
            <strong style="color:#1e40af;">🎯 Kế Hoạch Tuần Tới:</strong>
            <p style="margin:4px 0 0 0; color:#1e3a8a;">${ev.actionPlan || 'Tiếp tục rèn luyện theo chuyên đề'}</p>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="background:#fffbeb; border:1px solid #fef08a; border-radius:10px; padding:12px 14px;">
              <strong style="color:#854d0e;">🌟 Tuyên Dương:</strong>
              <p style="margin:4px 0 0 0; color:#713f12;">${ev.commendations || 'Ghi nhận tinh thần tự giác của cả lớp'}</p>
            </div>
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:12px 14px;">
              <strong style="color:#9a3412;">⚠️ Cần Đôn Đốc:</strong>
              <p style="margin:4px 0 0 0; color:#7c2d12;">${ev.attentionNeeded || 'Nhắc nhở nộp bài đúng hạn'}</p>
            </div>
          </div>
        </div>
      `;

      footerActionsEl.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="TutorView.openClassEvaluationZaloModal('${cls.id}', '${ev.id}')">
          💬 Xem Bản Tin Zalo
        </button>
      `;
    }

    if (modal) modal.classList.add('active');
  },

  copyTestZaloSummary(testId, itemType = 'test') {
    const cls = Store.getClassById(this.selectedClassId);
    if (!cls) return;

    if (itemType === 'evaluation') {
      this.openClassEvaluationZaloModal(cls.id, testId);
      return;
    }

    const asn = Store.getAssignmentById(testId);
    if (!asn) return;

    const subs = Store.getSubmissionsByAssignment(testId);
    const students = Store.getStudentsByClass(cls.id);
    const gradedSubs = subs.filter(s => s.status === 'graded');
    const scores = gradedSubs.map(s => s.score);

    const avgScore = scores.length > 0 ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1) : 'Đang chấm';
    const highestScore = scores.length > 0 ? Math.max(...scores) : '—';
    const topNames = scores.length > 0 ? gradedSubs.filter(s => s.score === highestScore).map(s => s.studentName).join(', ') : '';

    const isQuiz = asn.type === 'quiz' || asn.submissionType === 'quiz';
    const typeStr = isQuiz ? 'Trắc nghiệm Online' : 'Tự luận vở viết tay';

    const msg = `📢 BÁO CÁO KẾT QUẢ ĐỢT KIỂM TRA — LỚP: ${cls.name.toUpperCase()}
Kính gửi Quý phụ huynh và các em học sinh,
Thầy/Cô xin tổng kết kết quả đợt kiểm tra vừa qua như sau:

📚 Bài kiểm tra: ${asn.title}
📌 Chuyên đề: ${asn.topic || 'Kiểm tra & Ôn tập'}
📝 Hình thức: ${typeStr}
⏰ Thời gian giao: ${new Date(asn.createdAt).toLocaleDateString('vi-VN')}

📊 KẾT QUẢ TỔNG HỢP:
• Tỷ lệ nộp bài: ${subs.length}/${students.length} học sinh (${students.length > 0 ? Math.round((subs.length / students.length) * 100) : 0}%)
• Số bài đã chấm hoàn tất: ${gradedSubs.length}/${subs.length} bài
• Điểm trung bình cả lớp: ${avgScore}/10
• Điểm cao nhất đợt: ${highestScore}đ${topNames ? ` (Tuyên dương: ${topNames})` : ''}

💬 NHẬN XÉT CỦA GIÁO VIÊN:
${asn.description || 'Các em đã có tinh thần làm bài nghiêm túc và hoàn thành tốt yêu cầu.'}

👉 Chi tiết bài chấm và lời phê bút đỏ đã được cập nhật đầy đủ trên ứng dụng EduTask. Phụ huynh và học sinh vui lòng đăng nhập để xem lại từng câu làm của mình.
Trân trọng.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(() => {
        App.showToast(`📋 Đã sao chép tin nhắn Zalo tổng kết đợt kiểm tra "${asn.title}"!`, 'success');
      }).catch(() => {
        this.fallbackCopy(msg);
        App.showToast(`📋 Đã sao chép tin nhắn Zalo tổng kết đợt kiểm tra!`, 'success');
      });
    } else {
      this.fallbackCopy(msg);
      App.showToast(`📋 Đã sao chép tin nhắn Zalo tổng kết đợt kiểm tra!`, 'success');
    }
  },

  render(container) {
    const currentUser = Auth.getCurrentUser();
    const isSupervising = Auth.isAdminSupervising();
    const isMasterAdmin = Auth.isRealAdmin() && !isSupervising;
    const currentTutorId = currentUser ? currentUser.id : '';

    // Danh sách các lớp học do giáo viên này phụ trách (hoặc tất cả nếu là Master Admin)
    const allClasses = isMasterAdmin ? Store.getClasses() : Store.getClassesByTutor(currentTutorId);
    const availableClasses = allClasses.length > 0 ? allClasses : Store.getClasses();

    // Lớp học đang chọn
    const currentClass = this.selectedClassId ? Store.getClassById(this.selectedClassId) : null;
    if (this.selectedClassId && !currentClass) {
      this.selectedClassId = null;
    }

    // Danh sách học sinh: Nếu chọn 1 lớp thì lấy học sinh trong lớp; nếu không thì lấy tất cả học sinh phụ trách
    const allTutorStudents = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);
    const students = currentClass ? Store.getStudentsByClass(currentClass.id) : allTutorStudents;

    // Lấy bài tập thuộc phạm vi giảng dạy của lớp hoặc toàn bộ
    const allAssignments = Store.getAllAssignments().filter(asn => {
      if (currentClass) {
        if (asn.classId === currentClass.id) return true;
        return asn.targetStudentIds && asn.targetStudentIds.some(sid => (currentClass.studentIds || []).includes(sid));
      }
      if (isMasterAdmin) return true;
      if (asn.tutorId && asn.tutorId === currentTutorId) return true;
      return asn.targetStudentIds && asn.targetStudentIds.some(sid => allTutorStudents.some(std => std.id === sid));
    });

    // Đồng bộ an toàn: Nếu học sinh đang chọn không còn trong danh sách thì reset
    if (this.selectedStudentId && !students.some(s => s.id === this.selectedStudentId)) {
      this.selectedStudentId = null;
    }

    // Phạm vi bài tập đang xét
    const scopedAssignments = this.selectedStudentId 
      ? allAssignments.filter(asn => asn.targetStudentIds && asn.targetStudentIds.includes(this.selectedStudentId))
      : allAssignments;

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

    let totalPendingSubmissions = 0;
    scopedAssignments.forEach(asn => {
      const targetIds = this.selectedStudentId ? [this.selectedStudentId] : (asn.targetStudentIds || []);
      const subs = Store.getSubmissionsByAssignment(asn.id).filter(s => targetIds.includes(s.studentId) && s.status === 'submitted');
      totalPendingSubmissions += subs.length;
    });

    // 1. BANNER CHÍNH
    let bannerHtml = '';
    if (currentClass) {
      bannerHtml = `
        <div class="view-banner" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);">
          <div class="banner-info">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
              <span class="badge" style="background:rgba(255,255,255,0.2); color:#fff; font-size:12px; font-weight:700;">🏫 ${currentClass.grade}</span>
              <span class="badge" style="background:rgba(255,255,255,0.2); color:#fde68a; font-family:var(--font-mono); font-weight:700; font-size:12px;">MÃ: ${currentClass.code}</span>
              ${currentClass.room ? `<span class="badge" style="background:rgba(255,255,255,0.15); color:#fff; font-size:12px;">📍 ${currentClass.room}</span>` : ''}
            </div>
            <h2>${currentClass.name}</h2>
            <p>Môn: <strong>${currentClass.subject || 'Toán Học'}</strong> • Sĩ số: <strong>${students.length} học sinh</strong> • GV Phụ trách: <strong>${currentClass.tutorName || (currentUser ? currentUser.name : 'Gia Sư')}</strong></p>
          </div>
          <div class="banner-actions" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-white" onclick="App.openCreateAssignmentModal(null, '${currentClass.id}')">
              ➕ Giao Bài Cho Lớp
            </button>
            <button class="btn btn-secondary" onclick="TutorView.setClassTab('evaluation')" title="Đánh giá và nhận xét toàn diện cho cả lớp">
              📝 Đánh Giá Lớp
            </button>
            <button class="btn btn-secondary" onclick="TutorView.remindClassStudents('${currentClass.id}')" title="Tạo tin nhắn Zalo nhắc nộp bài tập cho lớp này">
              🔔 Nhắc Cả Lớp
            </button>
            <button class="btn btn-secondary" onclick="TutorView.openAddStudentToClassModal('${currentClass.id}')" title="Thêm học sinh vào lớp học này">
              🎒 ➕ Thêm Học Sinh
            </button>
            <button class="btn btn-secondary" onclick="TutorView.exportClassGradebookCSV('${currentClass.id}')" title="Xuất sổ điểm điện tử cả lớp ra file Excel/CSV">
              📊 Tải Sổ Điểm Excel
            </button>
            <button class="btn btn-secondary" onclick="TutorView.setClassTab('announcements')" title="Mở bảng tin và thành viên lớp">
              📢 Bảng Tin Lớp
            </button>
            ${(isMasterAdmin || (currentUser && currentUser.id === currentClass.tutorId)) ? `
              <button class="btn btn-secondary" onclick="AdminView.confirmDeleteClass('${currentClass.id}', '${(currentClass.name || '').replace(/'/g, "\\'")}')" title="Xóa vĩnh viễn lớp học này" style="color:#ef4444; border-color:rgba(239,68,68,0.4);">
                🗑️ Xóa Lớp
              </button>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      bannerHtml = `
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
            <button class="btn btn-secondary" onclick="TutorView.openCreateClassModal()" title="Mở rộng tạo lớp học theo nhóm / lớp">
              🏫 ➕ Tạo Lớp Mới
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
      `;
    }

    // 2. THANH CHUYỂN PHẠM VI LỚP HỌC (CLASS SCOPE BAR)
    const scopeBarHtml = `
      <div class="class-scope-bar" style="margin-bottom:18px;">
        <span style="font-size:12.5px; font-weight:700; color:var(--text-muted); display:inline-flex; align-items:center; gap:5px;">
          🏫 <span>Phạm vi giảng dạy:</span>
        </span>
        <button class="class-pill-btn ${this.selectedClassId === null ? 'active' : ''}" onclick="TutorView.setClassScope(null)">
          🌐 Tất cả học sinh (${allTutorStudents.length})
        </button>
        ${availableClasses.map(cls => `
          <button class="class-pill-btn ${this.selectedClassId === cls.id ? 'active' : ''}" onclick="TutorView.setClassScope('${cls.id}')">
            🏫 ${cls.name} <span class="chip-badge" style="font-size:10px;">${(cls.studentIds || []).length} em</span>
          </button>
        `).join('')}
        <button class="class-pill-btn" style="border-style:dashed; color:var(--primary);" onclick="TutorView.openCreateClassModal()">
          ➕ Tạo Lớp Mới
        </button>
      </div>
    `;

    // 3. NẾU ĐANG CHỌN LỚP HỌC: HIỂN THỊ CÁC TAB CỦA LỚP
    if (currentClass) {
      const navTabsHtml = `
        <div class="class-nav-tabs" style="margin-bottom:18px;">
          <button class="class-nav-tab-btn ${this.activeClassTab === 'assignments' ? 'active' : ''}" onclick="TutorView.setClassTab('assignments')">
            📋 Bài Tập Cả Lớp (${scopedAssignments.length})
          </button>
          <button class="class-nav-tab-btn ${this.activeClassTab === 'gradebook' ? 'active' : ''}" onclick="TutorView.setClassTab('gradebook')">
            📊 Sổ Điểm Điện Tử & Ma Trận
          </button>
          <button class="class-nav-tab-btn ${this.activeClassTab === 'evaluation' ? 'active' : ''}" onclick="TutorView.setClassTab('evaluation')">
            📝 Đánh Giá Toàn Lớp
          </button>
          <button class="class-nav-tab-btn ${this.activeClassTab === 'history' ? 'active' : ''}" onclick="TutorView.setClassTab('history')">
            📜 Lịch Sử & Thống Kê Đợt KT
          </button>
          <button class="class-nav-tab-btn ${this.activeClassTab === 'leaderboard' ? 'active' : ''}" onclick="TutorView.setClassTab('leaderboard')">
            🏆 Bảng Vinh Danh & Podium
          </button>
          <button class="class-nav-tab-btn ${this.activeClassTab === 'announcements' ? 'active' : ''}" onclick="TutorView.setClassTab('announcements')">
            📢 Bảng Tin & Thành Viên (${students.length})
          </button>
        </div>
      `;

      if (this.activeClassTab === 'gradebook') {
        container.innerHTML = bannerHtml + scopeBarHtml + navTabsHtml + this.renderClassGradebook(currentClass.id);
        return;
      }
      if (this.activeClassTab === 'evaluation') {
        container.innerHTML = bannerHtml + scopeBarHtml + navTabsHtml + this.renderClassEvaluation(currentClass.id);
        return;
      }
      if (this.activeClassTab === 'history') {
        container.innerHTML = bannerHtml + scopeBarHtml + navTabsHtml + this.renderClassTestHistory(currentClass.id);
        return;
      }
      if (this.activeClassTab === 'leaderboard') {
        container.innerHTML = bannerHtml + scopeBarHtml + navTabsHtml + this.renderClassLeaderboard(currentClass.id);
        return;
      }
      if (this.activeClassTab === 'announcements') {
        container.innerHTML = bannerHtml + scopeBarHtml + navTabsHtml + this.renderClassAnnouncements(currentClass.id);
        return;
      }
    }

    // 4. TAB BÀI TẬP (HOẶC GIAO DIỆN TỔNG QUAN KHI KHÔNG CHỌN LỚP CỤ THỂ)
    const metricsGridHtml = `
      <div class="metrics-grid">
        <div class="metric-card ${this.currentFilter === 'all' ? 'active-metric-card' : ''}" style="cursor:pointer;" onclick="TutorView.setFilter('all');" title="Xem tất cả bài tập">
          <div class="metric-icon-box metric-blue">📋</div>
          <div class="metric-data">
            <h4>${scopedAssignments.length} đề</h4>
            <span>${this.selectedStudentId ? 'Tổng bài tập của em' : (currentClass ? 'Tổng đề của lớp' : 'Tổng số đề bài tập')}</span>
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
            <span>${currentClass ? 'Sĩ số lớp' : 'Học sinh theo học'}</span>
          </div>
        </div>
      </div>
    `;

    // Khối thẻ học sinh: Chỉ hiển thị khi đang xem "Tất cả học sinh"
    let studentsCardHtml = '';
    if (!currentClass) {
      studentsCardHtml = `
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
                    <button class="btn btn-secondary btn-sm" onclick="AdminView.openEditStudentModal('${std.id}')" title="Chỉnh sửa thông tin học sinh">
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
      `;
    }

    const classNavTabsInAssignmentView = currentClass ? `
      <div class="class-nav-tabs" style="margin-bottom:18px;">
        <button class="class-nav-tab-btn ${this.activeClassTab === 'assignments' ? 'active' : ''}" onclick="TutorView.setClassTab('assignments')">
          📋 Bài Tập Cả Lớp (${scopedAssignments.length})
        </button>
        <button class="class-nav-tab-btn ${this.activeClassTab === 'gradebook' ? 'active' : ''}" onclick="TutorView.setClassTab('gradebook')">
          📊 Sổ Điểm Điện Tử & Ma Trận
        </button>
        <button class="class-nav-tab-btn ${this.activeClassTab === 'evaluation' ? 'active' : ''}" onclick="TutorView.setClassTab('evaluation')">
          📝 Đánh Giá Toàn Lớp
        </button>
        <button class="class-nav-tab-btn ${this.activeClassTab === 'history' ? 'active' : ''}" onclick="TutorView.setClassTab('history')">
          📜 Lịch Sử & Thống Kê Đợt KT
        </button>
        <button class="class-nav-tab-btn ${this.activeClassTab === 'leaderboard' ? 'active' : ''}" onclick="TutorView.setClassTab('leaderboard')">
          🏆 Bảng Vinh Danh & Podium
        </button>
        <button class="class-nav-tab-btn ${this.activeClassTab === 'announcements' ? 'active' : ''}" onclick="TutorView.setClassTab('announcements')">
          📢 Bảng Tin & Thành Viên (${students.length})
        </button>
      </div>
    ` : '';

    container.innerHTML = `
      ${bannerHtml}
      ${scopeBarHtml}
      ${classNavTabsInAssignmentView}
      ${metricsGridHtml}
      ${studentsCardHtml}

      <!-- Khu vực Danh Sách Bài Tập -->
      <div class="content-card">
        <div class="card-header">
          <h3>📋 Quản Lý Bài Tập & Chấm Điểm ${currentClass ? `(${currentClass.name})` : ''}</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${currentClass ? `
              <button class="btn btn-sm btn-primary" onclick="App.openCreateAssignmentModal(null, '${currentClass.id}')">
                ➕ Giao bài cho lớp
              </button>
              <button class="btn btn-sm btn-secondary" onclick="TutorView.remindClassStudents('${currentClass.id}')" title="Tạo tin nhắn Zalo nhắc nộp bài tập cho lớp này">
                🔔 Nhắc cả lớp
              </button>
              <button class="btn btn-sm btn-secondary" onclick="TutorView.setClassTab('evaluation')">
                📝 Đánh giá lớp
              </button>
            ` : `
              <button class="btn btn-sm btn-outline" onclick="TutorView.remindAllStudents()">
                🔔 Nhắc nộp bài
              </button>
              <button class="btn btn-sm btn-secondary" onclick="TutorView.openZaloModal()">
                💬 Tạo tin Zalo
              </button>
            `}
          </div>
        </div>

        <!-- Thanh Chọn Nhanh Học Sinh -->
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

        <!-- Filter Tabs & Ô Tìm Kiếm Bài Tập -->
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
    const studentContainer = document.getElementById('editStudentPickerContainer');
    const classContainer = document.getElementById('editClassPickerContainer');
    if (studentContainer) {
      studentContainer.style.display = (val === 'individual') ? 'block' : 'none';
    }
    if (classContainer) {
      classContainer.style.display = (val === 'class') ? 'block' : 'none';
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
    setVal('editAsnTargetType', asn.targetType || (asn.classId ? 'class' : 'individual'));

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
    const currentTutorId = currentUser ? currentUser.id : '';
    const students = isMasterAdmin ? Store.getStudents() : Store.getStudentsByTutor(currentTutorId);

    // Cập nhật danh sách chọn lớp
    const classSelect = document.getElementById('editAsnClassSelect');
    const classes = isMasterAdmin ? Store.getClasses() : Store.getClassesByTutor(currentTutorId);
    const availableClasses = classes.length > 0 ? classes : Store.getClasses();
    if (classSelect) {
      if (availableClasses.length === 0) {
        classSelect.innerHTML = `<option value="">Chưa có lớp học nào</option>`;
      } else {
        classSelect.innerHTML = availableClasses.map(cls => `
          <option value="${cls.id}">${cls.name} (${cls.grade} • Sĩ số: ${(cls.studentIds || []).length} em)</option>
        `).join('');
      }
      if (asn.classId) {
        classSelect.value = asn.classId;
      }
    }

    this.handleEditTargetTypeChange(asn.targetType || (asn.classId ? 'class' : 'individual'));

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
    let classId = null;

    if (targetType === 'class') {
      const classSelect = document.getElementById('editAsnClassSelect');
      classId = classSelect ? classSelect.value : null;
      if (!classId) {
        App.showToast('Vui lòng chọn Lớp học nhận bài tập!', 'error');
        return;
      }
      const cls = Store.getClassById(classId);
      if (!cls) {
        App.showToast('Không tìm thấy lớp học đã chọn!', 'error');
        return;
      }
      targetStudentIds = Array.isArray(cls.studentIds) ? [...cls.studentIds] : [];
      if (targetStudentIds.length === 0) {
        App.showToast(`Lớp "${cls.name}" hiện chưa có học sinh nào!`, 'warning');
        return;
      }
    } else if (targetType === 'individual') {
      const checkedBoxes = document.querySelectorAll('input[name="editTargetStudents"]:checked');
      targetStudentIds = Array.from(checkedBoxes).map(cb => cb.value);
      if (targetStudentIds.length === 0) {
        App.showToast('Vui lòng chọn ít nhất một học sinh nhận bài tập!', 'warning');
        return;
      }
    } else {
      const currentUser = Auth.getCurrentUser();
      const currentTutorId = currentUser ? currentUser.id : '';
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
      classId: classId,
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
    const currentTutorId = currentUser ? currentUser.id : '';
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
    const currentTutorId = currentUser ? currentUser.id : '';
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
    const currentTutorId = currentUser ? currentUser.id : '';

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

