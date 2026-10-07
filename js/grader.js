/**
 * EDUTASK PRO — INTERACTIVE CANVAS GRADER
 * Bàn chấm bài tương tác: vẽ bút đỏ, highlight, đóng dấu ✔️/❌/⭐/💡, chọn điểm nhanh và tải ảnh
 */

const Grader = {
  activeSubmission: null,
  canvas: null,
  ctx: null,
  isDrawing: false,
  currentTool: 'red_pen', // 'red_pen', 'blue_pen', 'highlighter', 'eraser', 'stamp'
  currentLineWidth: 3.5,
  currentStamp: '✔️',
  baseImage: null,
  history: [],

  init() {
    this.canvas = document.getElementById('gradingCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
  },

  open(submissionId) {
    const sub = Store.data.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    this.activeSubmission = sub;
    const assignment = Store.data.assignments.find(a => a.id === sub.assignmentId);
    const student = Store.getUserById(sub.studentId);

    // Điền thông tin lên Header của Grader
    document.getElementById('graderAssignmentTitle').textContent = assignment ? assignment.title : 'Bài tập';
    document.getElementById('graderStudentName').textContent = `Học sinh: ${student ? student.name : sub.studentName}`;
    document.getElementById('graderScoreInput').value = sub.score !== null ? sub.score : 8.5;
    document.getElementById('graderFeedbackInput').value = sub.feedback || '';

    // Cập nhật huy hiệu & Hộp Báo Cáo Chống Gian Lận
    const cheatBadge = document.getElementById('graderCheatBadge');
    const cheatReportBox = document.getElementById('graderCheatReportBox');
    const cheatCount = sub.cheatCount || 0;
    const cheatDuration = sub.cheatDuration || 0;

    if (cheatBadge) {
      if (cheatCount > 0) {
        cheatBadge.className = 'badge badge-danger';
        cheatBadge.style.cursor = 'pointer';
        cheatBadge.innerHTML = `🚨 ${cheatCount} lần rời tab (${cheatDuration}s)`;
        cheatBadge.onclick = () => AntiCheat.openLogModal(sub.id);
      } else {
        cheatBadge.className = 'badge badge-success';
        cheatBadge.innerHTML = `🛡️ Trung thực (0 rời tab)`;
        cheatBadge.onclick = null;
      }
    }

    if (cheatReportBox) {
      if (cheatCount > 0) {
        cheatReportBox.style.display = 'block';
        cheatReportBox.style.border = '1px solid #ef4444';
        cheatReportBox.style.background = '#450a0a';
        cheatReportBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#fca5a5; font-size:12.5px; display:flex; align-items:center; gap:6px;">
              🚨 CẢNH BÁO TASK NGOÀI
            </strong>
            <span class="badge badge-danger">${cheatCount} vi phạm</span>
          </div>
          <div style="font-size:12px; color:#fecaca; line-height:1.4; margin-bottom:8px;">
            Phát hiện học sinh rời màn hình <strong>${cheatCount} lần</strong> (tổng ${cheatDuration} giây) để tra cứu ngoài.
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-xs btn-white" style="flex:1;" onclick="AntiCheat.openLogModal('${sub.id}')">
              📋 Xem Chi Tiết Log
            </button>
            <button type="button" class="btn btn-xs btn-danger" onclick="Grader.applyCheatPenalty()">
              ⚠️ Trừ 1đ vì tra cứu
            </button>
          </div>
        `;
      } else {
        cheatReportBox.style.display = 'block';
        cheatReportBox.style.border = '1px solid #166534';
        cheatReportBox.style.background = '#064e3b';
        cheatReportBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="pulse-indicator safe"></span>
            <div>
              <strong style="color:#86efac; font-size:12.5px;">GIÁM SÁT TRUNG THỰC: ĐẠT CHUẨN</strong>
              <div style="font-size:11.5px; color:#bbf7d0;">0 lần rời tab bài làm • Không phát hiện task ngoài</div>
            </div>
          </div>
        `;
      }
    }

    // Mở overlay
    const modal = document.getElementById('graderModal');
    if (modal) modal.classList.add('active');

    // Tải ảnh bài nộp lên Canvas
    this.loadImage(sub.annotatedPhoto || sub.photoUrl || Store.samplePaperDataUrl);
  },

  close() {
    const modal = document.getElementById('graderModal');
    if (modal) modal.classList.remove('active');
    this.activeSubmission = null;
  },

  loadImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.baseImage = img;
      // Giới hạn kích thước tối đa để không làm tràn bộ nhớ GPU trên điện thoại và máy tính bảng
      const maxDim = 1400;
      let w = img.width || 800;
      let h = img.height || 1100;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0, w, h);
      this.saveState();
    };
    img.src = src;
  },

  setTool(tool, stampChar = '') {
    this.currentTool = tool;
    if (stampChar) this.currentStamp = stampChar;

    // Cập nhật trạng thái active trên giao diện
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active', 'blue-active', 'yellow-active'));
    
    if (tool === 'red_pen') {
      const el = document.getElementById('btnToolRed');
      if (el) el.classList.add('active');
    } else if (tool === 'blue_pen') {
      const el = document.getElementById('btnToolBlue');
      if (el) el.classList.add('blue-active');
    } else if (tool === 'highlighter') {
      const el = document.getElementById('btnToolHighlight');
      if (el) el.classList.add('yellow-active');
    } else if (tool === 'eraser') {
      const el = document.getElementById('btnToolEraser');
      if (el) el.classList.add('active');
    }
  },

  setLineWidth(width) {
    this.currentLineWidth = width;
    document.querySelectorAll('.pen-size-btn').forEach(b => b.classList.remove('active'));
    if (width === 2) document.getElementById('btnSizeThin')?.classList.add('active');
    if (width === 3.5) document.getElementById('btnSizeMedium')?.classList.add('active');
    if (width === 6) document.getElementById('btnSizeThick')?.classList.add('active');
  },

  setFastScore(score) {
    const input = document.getElementById('graderScoreInput');
    if (input) {
      input.value = score;
      App.showToast(`Đã chọn nhanh điểm: ${score}/10`, 'info');
    }
  },

  downloadAnnotated() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `BaiCham_${this.activeSubmission?.studentName || 'HocSinh'}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    App.showToast('Đã tải xuống ảnh bài tập đã chấm bút đỏ!', 'success');
  },

  bindEvents() {
    if (!this.canvas) return;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      let clientX, clientY;

      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    let pendingPoints = [];
    let isRafScheduled = false;

    const renderPoints = () => {
      if (!this.isDrawing || pendingPoints.length === 0) {
        isRafScheduled = false;
        return;
      }
      for (let i = 0; i < pendingPoints.length; i++) {
        const pt = pendingPoints[i];
        this.ctx.lineTo(pt.x, pt.y);
      }
      this.ctx.stroke();
      pendingPoints = [];
      isRafScheduled = false;
    };

    const startDraw = (e) => {
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);

      if (this.currentTool === 'stamp') {
        this.drawStamp(pos.x, pos.y, this.currentStamp);
        this.saveState();
        return;
      }

      this.isDrawing = true;
      pendingPoints = [];
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.applyStyle();
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      pendingPoints.push(pos);
      if (!isRafScheduled) {
        isRafScheduled = true;
        requestAnimationFrame(renderPoints);
      }
    };

    const stopDraw = () => {
      if (this.isDrawing) {
        if (pendingPoints.length > 0) {
          renderPoints();
        }
        this.isDrawing = false;
        this.saveState();
      }
    };

    // Hỗ trợ Pointer Events tiên tiến (cho iPad Apple Pencil, Samsung S-Pen, bút cảm ứng & ngón tay)
    if (window.PointerEvent) {
      this.canvas.addEventListener('pointerdown', startDraw, { passive: false });
      this.canvas.addEventListener('pointermove', draw, { passive: false });
      window.addEventListener('pointerup', stopDraw);
      window.addEventListener('pointercancel', stopDraw);
    } else {
      this.canvas.addEventListener('mousedown', startDraw);
      this.canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDraw);

      this.canvas.addEventListener('touchstart', startDraw, { passive: false });
      this.canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDraw);
      window.addEventListener('touchcancel', stopDraw);
    }
  },

  applyStyle() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.currentTool === 'red_pen') {
      this.ctx.strokeStyle = '#dc2626';
      this.ctx.lineWidth = this.currentLineWidth;
      this.ctx.globalCompositeOperation = 'source-over';
    } else if (this.currentTool === 'blue_pen') {
      this.ctx.strokeStyle = '#2563eb';
      this.ctx.lineWidth = this.currentLineWidth;
      this.ctx.globalCompositeOperation = 'source-over';
    } else if (this.currentTool === 'highlighter') {
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      this.ctx.lineWidth = 22;
      this.ctx.globalCompositeOperation = 'source-over';
    } else if (this.currentTool === 'eraser') {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 20;
    }
  },

  drawStamp(x, y, text) {
    this.ctx.save();
    this.ctx.font = 'bold 26px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (text === '✔️' || text === 'Đúng') {
      this.ctx.fillStyle = '#16a34a';
      this.ctx.fillText('✔️ ĐÚNG', x, y);
    } else if (text === '❌' || text === 'Sai') {
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillText('❌ CẦN SỬA', x, y);
    } else if (text === '⭐' || text === 'Tốt') {
      this.ctx.fillStyle = '#d97706';
      this.ctx.fillText('⭐ RẤT TỐT', x, y);
    } else if (text === '⚠️' || text === 'Nhầm dấu') {
      this.ctx.fillStyle = '#ea580c';
      this.ctx.fillText('⚠️ NHẦM DẤU', x, y);
    } else if (text === '💡' || text === 'Chú ý') {
      this.ctx.fillStyle = '#0284c7';
      this.ctx.fillText('💡 CHÚ Ý', x, y);
    }
    this.ctx.restore();
  },

  saveState() {
    if (this.history.length > 10) this.history.shift();
    this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
  },

  undo() {
    if (this.history.length > 1) {
      this.history.pop();
      const prev = this.history[this.history.length - 1];
      this.ctx.putImageData(prev, 0, 0);
    }
  },

  clearAll() {
    if (this.baseImage) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.baseImage, 0, 0);
      this.saveState();
    }
  },

  applyCheatPenalty() {
    const input = document.getElementById('graderScoreInput');
    const feedbackInput = document.getElementById('graderFeedbackInput');
    if (input) {
      const current = parseFloat(input.value) || 0;
      const penalty = Math.max(0, current - 1);
      input.value = penalty;
      if (feedbackInput && !feedbackInput.value.includes('Trừ 1 điểm vì rời màn hình')) {
        feedbackInput.value = (feedbackInput.value ? feedbackInput.value + '\n' : '') + '⚠️ Trừ 1 điểm kỷ luật vì phát hiện chuyển tab / mở task tra cứu ngoài trong lúc làm bài.';
      }
      App.showToast(`Đã trừ 1 điểm kỷ luật gian lận (Điểm hiện tại: ${penalty}/10)`, 'warning');
    }
  },

  submitGrading() {
    if (!this.activeSubmission) return;

    const score = document.getElementById('graderScoreInput').value;
    const feedback = document.getElementById('graderFeedbackInput').value;

    if (score === '' || isNaN(score) || score < 0 || score > 10) {
      App.showToast('Vui lòng nhập điểm số hợp lệ từ 0 đến 10!', 'error');
      return;
    }

    const annotatedDataUrl = this.canvas.toDataURL('image/jpeg', 0.85);
    Store.updateSubmissionGrading(this.activeSubmission.id, score, feedback, annotatedDataUrl);

    App.showToast(`Đã chấm xong! Điểm ${score}/10 đã được lưu và cập nhật tiến độ học sinh.`, 'success');
    this.close();
    App.renderCurrentView();
  }
};
