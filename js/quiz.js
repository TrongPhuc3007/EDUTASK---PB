/**
 * EDUTASK PRO — QUIZ MODULE (HỆ THỐNG BÀI TẬP TRẮC NGHIỆM ONLINE)
 * Quản lý soạn đề trắc nghiệm (Bảng đáp án nhanh & Soạn chi tiết),
 * Làm bài thi trực tuyến với đồng hồ đếm ngược, tự động chấm điểm và xem kết quả.
 */

const Quiz = {
  // Trạng thái soạn thảo đề trắc nghiệm
  builderState: {
    create: {
      mode: 'quick',            // 'quick' (bảng đáp án nhanh) hoặc 'detailed' (soạn chi tiết)
      durationMinutes: 45,
      questions: []
    },
    edit: {
      mode: 'quick',
      durationMinutes: 45,
      questions: []
    }
  },

  // Trạng thái học sinh đang làm bài thi
  activeQuiz: {
    assignment: null,
    answers: {},                // { 1: 'A', 2: 'C', ... }
    remainingSeconds: 0,
    timerInterval: null,
    startTime: null
  },

  init() {
    this.initDefaultQuestions('create', 10);
  },

  initDefaultQuestions(context = 'create', count = 10) {
    const list = [];
    const defaultAnswers = ['A', 'B', 'C', 'D'];
    for (let i = 1; i <= count; i++) {
      list.push({
        id: i,
        text: `Câu ${i}: Chọn đáp án đúng cho câu hỏi này`,
        options: [
          'Phương án A',
          'Phương án B',
          'Phương án C',
          'Phương án D'
        ],
        correct: defaultAnswers[(i - 1) % 4],
        explanation: ''
      });
    }
    this.builderState[context].questions = list;
    this.builderState[context].mode = 'quick';
    this.builderState[context].durationMinutes = 45;
  },

  // Bật / Tắt vùng soạn đề trắc nghiệm trong modal tạo / sửa bài tập
  toggleBuilder(context = 'create', type = 'photo') {
    const container = document.getElementById(context === 'create' ? 'createQuizBuilderContainer' : 'editQuizBuilderContainer');
    if (!container) return;

    if (type === 'quiz') {
      container.style.display = 'block';
      this.renderBuilder(context);
    } else {
      container.style.display = 'none';
    }
  },

  // Nạp dữ liệu trắc nghiệm có sẵn khi sửa bài tập
  loadExistingQuiz(context = 'edit', quizData = null) {
    if (quizData && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
      this.builderState[context] = {
        mode: quizData.mode || 'quick',
        durationMinutes: quizData.durationMinutes !== undefined ? quizData.durationMinutes : 45,
        questions: JSON.parse(JSON.stringify(quizData.questions))
      };
    } else {
      this.initDefaultQuestions(context, 10);
    }
    this.renderBuilder(context);
  },

  // Chuyển đổi giữa chế độ 'quick' (Đáp án nhanh kiểu Azota) và 'detailed' (Soạn chi tiết)
  setBuilderMode(context, mode) {
    this.builderState[context].mode = mode;
    this.renderBuilder(context);
  },

  // Đổi số lượng câu hỏi nhanh (5, 10, 15, 20, 40, 50 câu)
  setQuestionCount(context, count) {
    const current = this.builderState[context].questions;
    const defaultAnswers = ['A', 'B', 'C', 'D'];
    if (count > current.length) {
      for (let i = current.length + 1; i <= count; i++) {
        current.push({
          id: i,
          text: `Câu ${i}: Chọn đáp án đúng cho câu hỏi này`,
          options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          correct: defaultAnswers[(i - 1) % 4],
          explanation: ''
        });
      }
    } else if (count < current.length) {
      this.builderState[context].questions = current.slice(0, count);
    }
    this.renderBuilder(context);
  },

  // Thêm 1 câu hỏi
  addQuestion(context) {
    const questions = this.builderState[context].questions;
    const nextId = questions.length + 1;
    questions.push({
      id: nextId,
      text: `Câu ${nextId}: Chọn đáp án đúng cho câu hỏi này`,
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correct: 'A',
      explanation: ''
    });
    this.renderBuilder(context);
  },

  // Xóa 1 câu hỏi
  removeQuestion(context, index) {
    const questions = this.builderState[context].questions;
    if (questions.length <= 1) {
      App.showToast('Đề thi trắc nghiệm cần có ít nhất 1 câu hỏi!', 'warning');
      return;
    }
    questions.splice(index, 1);
    // Đánh lại số thứ tự ID
    questions.forEach((q, idx) => {
      q.id = idx + 1;
      if (q.text && q.text.startsWith('Câu ')) {
        q.text = q.text.replace(/^Câu \d+:/, `Câu ${idx + 1}:`);
      }
    });
    this.renderBuilder(context);
  },

  // Đặt đáp án đúng cho câu hỏi
  setCorrectAnswer(context, qIndex, letter) {
    if (this.builderState[context].questions[qIndex]) {
      this.builderState[context].questions[qIndex].correct = letter;
      this.renderBuilder(context);
    }
  },

  // Phân tích chuỗi đáp án gõ nhanh kiểu Azota: "1A 2B 3C 4D" hoặc "A B C D A"
  parseQuickAnswerString(context, inputStr) {
    if (!inputStr || !inputStr.trim()) return;
    const tokens = inputStr.toUpperCase().replace(/[^A-D0-9\s.,]/g, ' ').split(/\s+/).filter(Boolean);
    const questions = this.builderState[context].questions;

    let parsedCount = 0;
    tokens.forEach((token, idx) => {
      const match = token.match(/(\d+)?([A-D])/);
      if (match) {
        const qNum = match[1] ? parseInt(match[1]) : (idx + 1);
        const ans = match[2];
        if (qNum >= 1 && qNum <= questions.length) {
          questions[qNum - 1].correct = ans;
          parsedCount++;
        }
      }
    });

    if (parsedCount > 0) {
      this.renderBuilder(context);
      App.showToast(`✓ Đã tự động cập nhật đáp án cho ${parsedCount} câu hỏi!`, 'success');
    } else {
      App.showToast('Không nhận diện được định dạng đáp án (VD: 1A 2B 3C 4D)', 'warning');
    }
  },

  // Render giao diện soạn thảo trắc nghiệm
  renderBuilder(context = 'create') {
    const container = document.getElementById(context === 'create' ? 'createQuizBuilderContainer' : 'editQuizBuilderContainer');
    if (!container) return;

    const state = this.builderState[context];
    const isQuick = state.mode === 'quick';
    const totalQ = state.questions.length;

    container.innerHTML = `
      <div class="quiz-builder-box">
        <div class="quiz-builder-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:22px;">⚡</span>
            <div>
              <strong style="font-size:14px; color:#1e293b;">Soạn Bài Tập Trắc Nghiệm Online</strong>
              <div style="font-size:12px; color:#64748b;">Học sinh làm bài trực tuyến, tự động chấm điểm 10/10 ngay khi nộp</div>
            </div>
          </div>
          <!-- Chuyển đổi chế độ -->
          <div class="quiz-mode-switch">
            <button type="button" class="btn btn-xs ${isQuick ? 'btn-primary' : 'btn-outline'}" onclick="Quiz.setBuilderMode('${context}', 'quick')" title="Nhập bảng đáp án nhanh, kết hợp đề PDF">
              ⚡ Bảng Đáp Án Nhanh (Azota)
            </button>
            <button type="button" class="btn btn-xs ${!isQuick ? 'btn-primary' : 'btn-outline'}" onclick="Quiz.setBuilderMode('${context}', 'detailed')" title="Soạn chi tiết nội dung từng câu hỏi">
              📝 Soạn Đề Chi Tiết
            </button>
          </div>
        </div>

        <!-- Cài đặt bài thi: Thời gian làm bài & Chọn nhanh số câu -->
        <div class="quiz-settings-bar">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <label style="font-size:12.5px; font-weight:700; color:#334155; margin:0;">⏰ Thời gian làm bài:</label>
            <select id="${context}QuizDuration" class="form-control" style="width:auto; padding:4px 10px; font-size:12.5px; height:32px;" onchange="Quiz.builderState['${context}'].durationMinutes = parseInt(this.value);">
              <option value="0" ${state.durationMinutes === 0 ? 'selected' : ''}>Không giới hạn thời gian</option>
              <option value="15" ${state.durationMinutes === 15 ? 'selected' : ''}>15 phút</option>
              <option value="30" ${state.durationMinutes === 30 ? 'selected' : ''}>30 phút</option>
              <option value="45" ${state.durationMinutes === 45 ? 'selected' : ''}>45 phút (1 tiết)</option>
              <option value="60" ${state.durationMinutes === 60 ? 'selected' : ''}>60 phút</option>
              <option value="90" ${state.durationMinutes === 90 ? 'selected' : ''}>90 phút (Thi thử)</option>
            </select>
          </div>

          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:12px; color:#64748b; font-weight:600;">Số câu:</span>
            ${[5, 10, 15, 20, 40].map(cnt => `
              <button type="button" class="btn btn-xs ${totalQ === cnt ? 'btn-secondary' : 'btn-white'}" onclick="Quiz.setQuestionCount('${context}', ${cnt})" style="padding:2px 8px; font-size:11.5px;">
                ${cnt} câu
              </button>
            `).join('')}
          </div>
        </div>

        ${isQuick ? `
          <!-- Chế độ 1: Bảng đáp án nhanh kiểu Azota -->
          <div class="quiz-quick-box">
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 12px; margin-bottom:12px; font-size:12px; color:#1e40af; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <span>💡 <strong>Mẹo chuyên nghiệp:</strong> Bạn có thể đính kèm file đề bài (PDF/Word/Ảnh) ở mục trên, sau đó chỉ cần chọn bảng đáp án đúng dưới đây!</span>
              <div style="display:flex; gap:6px; align-items:center;">
                <input type="text" id="${context}QuickAnsInput" placeholder="Dán chuỗi: 1A 2B 3C 4D..." style="font-size:11.5px; padding:3px 8px; border:1px solid #93c5fd; border-radius:4px; width:170px;">
                <button type="button" class="btn btn-xs btn-primary" onclick="Quiz.parseQuickAnswerString('${context}', document.getElementById('${context}QuickAnsInput').value)">
                  Điền Nhanh
                </button>
              </div>
            </div>

            <!-- Bảng lưới chọn đáp án A, B, C, D -->
            <div class="quick-answer-grid">
              ${state.questions.map((q, idx) => `
                <div class="quick-answer-row">
                  <span class="q-num-label">Câu ${q.id}:</span>
                  <div class="q-options-pills">
                    ${['A', 'B', 'C', 'D'].map(letter => `
                      <button type="button" class="q-opt-pill ${q.correct === letter ? 'active' : ''}" onclick="Quiz.setCorrectAnswer('${context}', ${idx}, '${letter}')">
                        ${letter}
                      </button>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <!-- Chế độ 2: Soạn câu hỏi chi tiết -->
          <div class="quiz-detailed-list">
            ${state.questions.map((q, idx) => `
              <div class="detailed-q-card">
                <div class="detailed-q-header">
                  <strong>Câu ${q.id}</strong>
                  <button type="button" class="btn btn-xs btn-outline" style="color:var(--danger); border-color:#fca5a5;" onclick="Quiz.removeQuestion('${context}', ${idx})" title="Xóa câu hỏi này">
                    🗑️ Xóa
                  </button>
                </div>
                <div class="form-group" style="margin-bottom:8px;">
                  <input type="text" class="form-control" style="font-size:13px;" placeholder="Nhập nội dung câu hỏi..." value="${q.text || ''}" oninput="Quiz.builderState['${context}'].questions[${idx}].text = this.value">
                </div>
                <div class="detailed-options-grid">
                  ${['A', 'B', 'C', 'D'].map((letter, optIdx) => `
                    <div class="detailed-opt-item ${q.correct === letter ? 'is-correct' : ''}">
                      <label class="detailed-opt-label">
                        <input type="radio" name="${context}_q_${q.id}" ${q.correct === letter ? 'checked' : ''} onchange="Quiz.setCorrectAnswer('${context}', ${idx}, '${letter}')">
                        <span>${letter}</span>
                      </label>
                      <input type="text" class="form-control form-control-sm" placeholder="Đáp án ${letter}..." value="${q.options && q.options[optIdx] ? q.options[optIdx] : ''}" oninput="Quiz.builderState['${context}'].questions[${idx}].options[${optIdx}] = this.value">
                    </div>
                  `).join('')}
                </div>
                <div style="margin-top:8px;">
                  <input type="text" class="form-control form-control-sm" placeholder="💡 Lời giải chi tiết / Giải thích (tùy chọn)..." value="${q.explanation || ''}" oninput="Quiz.builderState['${context}'].questions[${idx}].explanation = this.value">
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid #e2e8f0;">
          <span style="font-size:12.5px; color:#475569; font-weight:600;">
            📊 Tổng cộng: <strong>${totalQ}</strong> câu hỏi trắc nghiệm
          </span>
          <button type="button" class="btn btn-sm btn-outline" onclick="Quiz.addQuestion('${context}')">
            ➕ Thêm 1 câu hỏi
          </button>
        </div>
      </div>
    `;
  },

  // Thu thập dữ liệu trắc nghiệm để lưu vào bài tập
  getBuilderData(context = 'create') {
    const durationInput = document.getElementById(`${context}QuizDuration`);
    const duration = durationInput ? parseInt(durationInput.value) : this.builderState[context].durationMinutes;
    return {
      mode: this.builderState[context].mode,
      durationMinutes: isNaN(duration) ? 45 : duration,
      questions: JSON.parse(JSON.stringify(this.builderState[context].questions))
    };
  },

  // ================= HỌC SINH LÀM BÀI TRẮC NGHIỆM ONLINE =================

  startQuiz(assignmentId) {
    const asn = Store.data.assignments.find(a => a.id === assignmentId);
    if (!asn) return;

    const student = Auth.getCurrentUser();
    if (!student) return;

    // Chuẩn bị danh sách câu hỏi
    let quizData = asn.quizData;
    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      quizData = {
        mode: 'quick',
        durationMinutes: 45,
        questions: [
          { id: 1, text: 'Câu 1: Chọn đáp án A, B, C, D', options: ['A', 'B', 'C', 'D'], correct: 'A' },
          { id: 2, text: 'Câu 2: Chọn đáp án A, B, C, D', options: ['A', 'B', 'C', 'D'], correct: 'B' },
          { id: 3, text: 'Câu 3: Chọn đáp án A, B, C, D', options: ['A', 'B', 'C', 'D'], correct: 'C' },
          { id: 4, text: 'Câu 4: Chọn đáp án A, B, C, D', options: ['A', 'B', 'C', 'D'], correct: 'D' },
          { id: 5, text: 'Câu 5: Chọn đáp án A, B, C, D', options: ['A', 'B', 'C', 'D'], correct: 'A' }
        ]
      };
    }

    this.activeQuiz = {
      assignment: asn,
      quizData: quizData,
      answers: {},
      remainingSeconds: (quizData.durationMinutes || 45) * 60,
      timerInterval: null,
      startTime: Date.now()
    };

    // Bật giám sát chống gian lận
    if (window.AntiCheat) {
      AntiCheat.startMonitoring(assignmentId, student.id);
    }

    // Mở modal làm bài
    const modal = document.getElementById('quizTakingModal');
    if (modal) modal.classList.add('active');

    this.renderQuizTakingView();
    this.startTimer();
  },

  startTimer() {
    if (this.activeQuiz.timerInterval) {
      clearInterval(this.activeQuiz.timerInterval);
    }

    const timerEl = document.getElementById('quizCountdownTimer');
    const updateDisplay = () => {
      if (!timerEl) return;
      if (this.activeQuiz.quizData.durationMinutes === 0) {
        timerEl.textContent = '⏱️ Không giới hạn';
        return;
      }
      const sec = this.activeQuiz.remainingSeconds;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      timerEl.textContent = `⏱️ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      if (sec <= 300) {
        timerEl.classList.add('timer-warning');
      } else {
        timerEl.classList.remove('timer-warning');
      }
    };

    updateDisplay();

    if (this.activeQuiz.quizData.durationMinutes > 0) {
      this.activeQuiz.timerInterval = setInterval(() => {
        this.activeQuiz.remainingSeconds--;
        updateDisplay();
        if (this.activeQuiz.remainingSeconds <= 0) {
          clearInterval(this.activeQuiz.timerInterval);
          App.showToast('⏰ Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn...', 'warning');
          this.submitQuiz(true);
        }
      }, 1000);
    }
  },

  renderQuizTakingView() {
    const qz = this.activeQuiz;
    const asn = qz.assignment;
    const questions = qz.quizData.questions;

    // Header thông tin bài thi
    document.getElementById('quizTakingTitle').textContent = `⚡ ${asn.title}`;
    const descEl = document.getElementById('quizTakingDesc');
    if (descEl) descEl.textContent = asn.description || 'Lựa chọn phương án chính xác cho từng câu hỏi.';

    // Nút xem đề bài đính kèm (nếu có)
    const attachBox = document.getElementById('quizTakingAttachmentBox');
    if (attachBox) {
      if (asn.attachmentName) {
        attachBox.style.display = 'flex';
        attachBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <span>📎</span>
            <span>Đề bài đính kèm: <strong>${asn.attachmentName}</strong></span>
          </div>
          <a href="${asn.attachmentDataUrl || 'javascript:void(0)'}" download="${asn.attachmentName}" class="btn btn-xs btn-white" onclick="App.handleDownloadAttachment(event, '${asn.id}')">
            📥 Tải / Mở Đề Bài
          </a>
        `;
      } else {
        attachBox.style.display = 'none';
      }
    }

    // Danh sách câu hỏi
    const questionsContainer = document.getElementById('quizTakingQuestionsList');
    if (questionsContainer) {
      questionsContainer.innerHTML = questions.map((q, idx) => {
        const selected = qz.answers[q.id];
        return `
          <div class="quiz-question-card" id="quiz_q_card_${q.id}">
            <div class="quiz-q-title">
              <span class="q-badge">Câu ${q.id}</span>
              <span class="q-text">${q.text || `Chọn đáp án đúng cho Câu ${q.id}`}</span>
            </div>
            <div class="quiz-options-list">
              ${['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                const optText = (q.options && q.options[optIdx]) ? q.options[optIdx] : `Phương án ${letter}`;
                const isChecked = selected === letter;
                return `
                  <div class="quiz-option-choice ${isChecked ? 'selected' : ''}" onclick="Quiz.selectAnswer(${q.id}, '${letter}')">
                    <div class="opt-radio-circle">${letter}</div>
                    <div class="opt-content-text">${optText}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    this.renderBubbleSheet();
  },

  // Cập nhật phiếu trả lời nhanh (Bubble sheet)
  renderBubbleSheet() {
    const qz = this.activeQuiz;
    const questions = qz.quizData.questions;
    const bubbleContainer = document.getElementById('quizBubbleSheetGrid');
    const progressEl = document.getElementById('quizTakingProgress');

    const answeredCount = Object.keys(qz.answers).length;
    if (progressEl) {
      progressEl.textContent = `Đã làm: ${answeredCount} / ${questions.length} câu`;
    }

    if (bubbleContainer) {
      bubbleContainer.innerHTML = questions.map(q => {
        const isDone = !!qz.answers[q.id];
        const chosen = qz.answers[q.id] || '';
        return `
          <button type="button" class="bubble-btn ${isDone ? 'done' : ''}" onclick="Quiz.scrollToQuestion(${q.id})" title="Câu ${q.id}${chosen ? `: Chọn ${chosen}` : ''}">
            <span>${q.id}</span>
            ${chosen ? `<small class="bubble-chosen-letter">${chosen}</small>` : ''}
          </button>
        `;
      }).join('');
    }
  },

  // Học sinh bấm chọn 1 đáp án
  selectAnswer(questionId, letter) {
    this.activeQuiz.answers[questionId] = letter;

    // Cập nhật thẻ câu hỏi
    const card = document.getElementById(`quiz_q_card_${questionId}`);
    if (card) {
      card.querySelectorAll('.quiz-option-choice').forEach(el => el.classList.remove('selected'));
      const clicked = Array.from(card.querySelectorAll('.quiz-option-choice')).find(el => el.querySelector('.opt-radio-circle')?.textContent.trim() === letter);
      if (clicked) clicked.classList.add('selected');
    }

    this.renderBubbleSheet();
  },

  // Cuộn màn hình tới câu hỏi
  scrollToQuestion(questionId) {
    const card = document.getElementById(`quiz_q_card_${questionId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('pulse-highlight');
      setTimeout(() => card.classList.remove('pulse-highlight'), 1200);
    }
  },

  // Nộp bài thi
  submitQuiz(autoSubmit = false) {
    const qz = this.activeQuiz;
    if (!qz.assignment) return;

    const student = Auth.getCurrentUser();
    if (!student) return;

    const questions = qz.quizData.questions;
    const total = questions.length;
    const answeredCount = Object.keys(qz.answers).length;

    if (!autoSubmit && answeredCount < total) {
      const remaining = total - answeredCount;
      if (!confirm(`Bạn còn ${remaining} câu chưa chọn đáp án!\n\nBạn có chắc chắn muốn nộp bài thi ngay không?`)) {
        return;
      }
    }

    // Dừng đồng hồ đếm ngược
    if (qz.timerInterval) {
      clearInterval(qz.timerInterval);
    }

    // Thu thập kết quả giám sát chống gian lận
    let cheatData = { violationCount: 0, totalDuration: 0, logs: [] };
    if (window.AntiCheat) {
      cheatData = AntiCheat.stopMonitoring();
    }

    // Tự động chấm điểm trắc nghiệm
    let correctCount = 0;
    const answerBreakdown = [];

    questions.forEach(q => {
      const userChoice = qz.answers[q.id] || null;
      const isCorrect = userChoice === q.correct;
      if (isCorrect) correctCount++;

      answerBreakdown.push({
        questionId: q.id,
        questionText: q.text,
        userChoice: userChoice,
        correctAnswer: q.correct,
        isCorrect: isCorrect,
        explanation: q.explanation || ''
      });
    });

    const score = Math.round((correctCount / total) * 10 * 10) / 10;
    const timeSpentSeconds = Math.round((Date.now() - qz.startTime) / 1000);

    const submission = {
      id: 'sub_' + Date.now(),
      assignmentId: qz.assignment.id,
      studentId: student.id,
      studentName: student.name,
      submittedAt: new Date().toISOString(),
      status: 'graded',       // Tự động hoàn thành & có điểm ngay lập tức!
      score: score,
      feedback: `Hệ thống chấm tự động: Đúng ${correctCount}/${total} câu (${score}/10đ).`,
      gradedAt: new Date().toISOString(),
      isQuiz: true,
      quizAnswers: qz.answers,
      quizBreakdown: answerBreakdown,
      quizCorrectCount: correctCount,
      quizTotalQuestions: total,
      quizTimeSpentSeconds: timeSpentSeconds,
      cheatCount: cheatData.violationCount,
      cheatDuration: cheatData.totalDuration,
      cheatLogs: cheatData.logs
    };

    Store.addSubmission(submission);

    // Đóng modal làm bài
    const modal = document.getElementById('quizTakingModal');
    if (modal) modal.classList.remove('active');

    App.renderCurrentView();

    // Mở ngay modal kết quả trắc nghiệm
    this.openResultModal(submission.id);
  },

  // ================= XEM KẾT QUẢ & PHÂN TÍCH BÀI THI TRẮC NGHIỆM =================

  openResultModal(submissionId) {
    const sub = Store.data.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    const asn = Store.data.assignments.find(a => a.id === sub.assignmentId);
    const modal = document.getElementById('quizResultModal');
    if (!modal) return;

    const total = sub.quizTotalQuestions || (sub.quizBreakdown ? sub.quizBreakdown.length : 10);
    const correct = sub.quizCorrectCount || 0;
    const wrong = total - correct;
    const score = sub.score !== null ? sub.score : 0;
    const minutes = Math.floor((sub.quizTimeSpentSeconds || 0) / 60);
    const seconds = (sub.quizTimeSpentSeconds || 0) % 60;

    document.getElementById('quizResultTitle').textContent = `Kết Quả: ${asn ? asn.title : 'Bài trắc nghiệm'}`;
    document.getElementById('quizResultStudent').textContent = `Học sinh: ${sub.studentName}`;
    document.getElementById('quizResultScore').textContent = `${score}`;
    document.getElementById('quizResultCorrect').textContent = `${correct}/${total}`;
    document.getElementById('quizResultWrong').textContent = `${wrong}`;
    document.getElementById('quizResultTime').textContent = `${minutes}p ${seconds}s`;

    // Huy hiệu chống gian lận
    const cheatEl = document.getElementById('quizResultCheatBadge');
    if (cheatEl) {
      if (sub.cheatCount > 0) {
        cheatEl.innerHTML = `<span class="badge badge-danger">🚨 ${sub.cheatCount} lần rời tab (${sub.cheatDuration}s)</span>`;
      } else {
        cheatEl.innerHTML = `<span class="badge badge-success">🛡️ Trung thực tuyệt đối (0 rời tab)</span>`;
      }
    }

    // Danh sách phân tích từng câu hỏi
    const breakdownList = document.getElementById('quizResultBreakdownList');
    if (breakdownList) {
      const breakdown = sub.quizBreakdown || [];
      breakdownList.innerHTML = breakdown.map(item => {
        const isRight = item.isCorrect;
        return `
          <div class="result-breakdown-card ${isRight ? 'correct' : 'wrong'}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <strong style="font-size:13.5px; color:#1e293b;">Câu ${item.questionId}: ${item.questionText || ''}</strong>
              <span class="badge ${isRight ? 'badge-success' : 'badge-danger'}" style="font-size:11.5px;">
                ${isRight ? '✓ ĐÚNG (+1)' : '✕ SAI (0đ)'}
              </span>
            </div>
            <div style="display:flex; gap:12px; font-size:13px; margin-bottom:4px; flex-wrap:wrap;">
              <span>Bạn chọn: <strong style="color:${isRight ? '#16a34a' : '#dc2626'}; font-size:14px;">${item.userChoice || 'Bỏ trống'}</strong></span>
              <span>Đáp án đúng: <strong style="color:#16a34a; font-size:14px;">${item.correctAnswer}</strong></span>
            </div>
            ${item.explanation ? `
              <div style="font-size:12px; color:#475569; background:#f8fafc; padding:6px 10px; border-radius:6px; margin-top:4px;">
                💡 <strong>Lời giải:</strong> ${item.explanation}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    modal.classList.add('active');
  }
};

if (typeof window !== 'undefined') {
  window.Quiz = Quiz;
}
