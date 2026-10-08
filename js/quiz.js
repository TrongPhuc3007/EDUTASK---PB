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

  // Bộ nhớ đệm lưu câu hỏi bóc tách từ File / Văn bản trước khi nạp vào đề
  tempParsedQuestions: {
    create: null,
    edit: null
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

  // ================= BỘ ĐỌC & TÁCH ĐỀ THI TỰ ĐỘNG (SMART EXAM PARSER & AI) =================

  // Giải nén và đọc nội dung văn bản từ tệp Word (.docx) thuần JavaScript (Client-side)
  async extractTextFromDocx(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    let offset = 0;
    let docXmlBytes = null;
    let isDeflated = false;

    while (offset < bytes.length - 30) {
      if (view.getUint32(offset, true) === 0x04034b50) {
        const compMethod = view.getUint16(offset + 8, true);
        const compSize = view.getUint32(offset + 18, true);
        const fileNameLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);

        const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLen);
        const fileName = new TextDecoder('utf-8').decode(fileNameBytes);
        const dataOffset = offset + 30 + fileNameLen + extraLen;
        const normName = fileName.replace(/\\/g, '/').toLowerCase();

        if (normName.endsWith('word/document.xml')) {
          let actualCompSize = compSize;
          if (actualCompSize === 0) {
            let nextHeader = dataOffset;
            while (nextHeader < bytes.length - 4) {
              if (view.getUint32(nextHeader, true) === 0x04034b50 || view.getUint32(nextHeader, true) === 0x02014b50) {
                break;
              }
              nextHeader++;
            }
            actualCompSize = nextHeader - dataOffset;
          }
          docXmlBytes = bytes.subarray(dataOffset, dataOffset + actualCompSize);
          isDeflated = (compMethod === 8);
          break;
        }

        offset = dataOffset + (compSize > 0 ? compSize : 0);
        if (compSize === 0) offset++;
      } else {
        offset++;
      }
    }

    if (!docXmlBytes) {
      throw new Error('Không tìm thấy nội dung (word/document.xml) trong tệp docx.');
    }

    let xmlText = '';
    if (isDeflated && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(docXmlBytes);
      writer.close();
      const response = new Response(ds.readable);
      const decompressed = await response.arrayBuffer();
      xmlText = new TextDecoder('utf-8').decode(decompressed);
    } else {
      xmlText = new TextDecoder('utf-8').decode(docXmlBytes);
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const pNodes = xmlDoc.getElementsByTagName('w:p');
    const lines = [];
    for (let i = 0; i < pNodes.length; i++) {
      const tNodes = pNodes[i].getElementsByTagName('w:t');
      let line = '';
      for (let j = 0; j < tNodes.length; j++) {
        line += tNodes[j].textContent || '';
      }
      if (line.trim()) lines.push(line.trim());
    }
    return lines.join('\n');
  },

  // Đọc tệp tải lên (.docx, .txt) từ giao diện
  async readUploadedFile(event, context) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const textarea = document.getElementById(`${context}ImportTextarea`);
    if (!textarea) return;

    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'txt') {
        const text = await file.text();
        textarea.value = text;
        App.showToast(`✓ Đã nạp nội dung tệp text: ${file.name}`, 'success');
        this.handleParsePreview(context);
      } else if (ext === 'docx') {
        App.showToast('⏳ Đang giải nén và đọc nội dung Word (.docx)...', 'info');
        const buffer = await file.arrayBuffer();
        const text = await this.extractTextFromDocx(buffer);
        if (text && text.trim()) {
          textarea.value = text;
          App.showToast(`✓ Đã đọc thành công tệp Word: ${file.name}`, 'success');
          this.handleParsePreview(context);
        } else {
          throw new Error('Tệp docx không có nội dung chữ.');
        }
      } else {
        App.showToast('Vui lòng chọn tệp Word (.docx) hoặc Text (.txt)!', 'warning');
      }
    } catch (err) {
      console.warn('Lỗi đọc tệp:', err);
      App.showToast('Không thể đọc trực tiếp tệp này. Bạn có thể mở Word/PDF, nhấn Ctrl+A rồi dán trực tiếp vào ô bên dưới!', 'warning');
    }
  },

  // Thuật toán bóc tách văn bản đề thi thông minh (NLP / Regex Parser)
  parseExamText(rawText) {
    if (!rawText || !rawText.trim()) {
      return { questions: [], totalFound: 0, correctCount: 0, explanationCount: 0 };
    }

    // Chuẩn hóa văn bản đầu vào: ngắt dòng chuẩn & loại bỏ khoảng trắng đặc biệt / non-breaking spaces
    let text = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u00A0\u200B\u200C\u200D]/g, ' ')
      .trim();

    // Bước 1: Quét và bóc tách Bảng đáp án ở cuối văn bản (nếu có)
    const bottomKeys = {};
    const bottomKeySectionRegex = /(?:^|\n)\s*(?:[-–=]{2,}\s*)?(?:BẢNG\s+(?:ĐÁP\s+ÁN|TRẢ\s+LỜI)|ĐÁP\s+ÁN\s+(?:THAM\s+KHẢO|CHI\s+TIẾT|TỔNG\s+HỢP)|HƯỚNG\s+DẪN\s+CHẤM|ANSWER\s+KEY|KEY\s+TRẮC\s+NGHIỆM)(?:\s*[-–=:\s]+)?[\s\S]*$/i;
    const bottomMatch = text.match(bottomKeySectionRegex);
    if (bottomMatch) {
      const keySection = bottomMatch[0];
      const keyPairs = keySection.matchAll(/(\d+)[\s.:\/-]*([A-D])/gi);
      for (const kp of keyPairs) {
        bottomKeys[parseInt(kp[1], 10)] = kp[2].toUpperCase();
      }
      text = text.substring(0, bottomMatch.index).trim();
    } else {
      // Kiểm tra các dòng cuối cùng có phải chuỗi đáp án 1A 2B 3C...
      const lines = text.split('\n');
      let foundBottomLines = 0;
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        const linePairs = Array.from(line.matchAll(/(\d+)[\s.:\/-]*([A-D])/gi));
        // Nếu dòng chứa ít nhất 2 cặp đáp án và không chứa từ "câu hỏi", "hàm số", v.v.
        if (linePairs.length >= 2 && !line.match(/(?:cho|hàm|tìm|tính|biết|nếu|giá\s+trị)/i)) {
          for (const kp of linePairs) {
            bottomKeys[parseInt(kp[1], 10)] = kp[2].toUpperCase();
          }
          foundBottomLines++;
        } else {
          break;
        }
      }
      if (foundBottomLines > 0) {
        lines.splice(lines.length - foundBottomLines, foundBottomLines);
        text = lines.join('\n').trim();
      }
    }

    // Bước 2: Nhận diện điểm bắt đầu của từng câu hỏi
    // Hỗ trợ: "Câu 1:", "Câu 1.", "[Câu 1]", "Bài 1:", "Question 1:", "Q1:", "1.", "1)", "1/"
    const qRegex = /(?:^|\n)\s*(?:\[?(?:Câu|Bài|Question|\bQ)\s*(\d+)[\].:\/-\s]*\s+|\[?(\d+)\]?[\.\)\/:]\s+)/gi;
    const qMatches = [];
    let m;
    while ((m = qRegex.exec(text)) !== null) {
      const num = parseInt(m[1] || m[2], 10);
      qMatches.push({ index: m.index, num });
    }

    const chunks = [];
    if (qMatches.length > 0) {
      for (let i = 0; i < qMatches.length; i++) {
        const start = qMatches[i].index;
        const end = (i + 1 < qMatches.length) ? qMatches[i + 1].index : text.length;
        chunks.push({ num: qMatches[i].num || (i + 1), chunk: text.substring(start, end).trim() });
      }
    } else {
      // Nếu không có đánh số rõ ràng, chia theo đoạn cách nhau 2 dòng
      const rawChunks = text.split(/\n\s*\n+/).filter(c => c.trim().length > 10);
      rawChunks.forEach((c, idx) => chunks.push({ num: idx + 1, chunk: c.trim() }));
    }

    const questions = [];
    let correctCount = 0;
    let explanationCount = 0;

    chunks.forEach((item, idx) => {
      let block = item.chunk;

      // Bước 3a: Bóc tách Lời giải / Hướng dẫn giải chi tiết
      let explanation = '';
      const expMatch = block.match(/(?:Lời\s+giải(?:\s+chi\s+tiết)?|Hướng\s+dẫn(?:\s+giải)?|Giải(?:\s+chi\s+tiết)?|HDG|Explanation)[\s:=.-]+([\s\S]*)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        block = block.substring(0, expMatch.index).trim();
        explanationCount++;
      }

      // Bước 3b: Nhận diện dòng Đáp án đúng (Đáp án: A / Key: B / ĐA: C / Chọn: D)
      let detectedCorrect = null;
      const ansMatch = block.match(/(?:Đáp\s*án(?:\s*đúng|\s*là)?|Đ\/?A|Key|Answer|Ans|Chọn(?:\s*đáp\s*án|\s*phương\s*án)?|=>|->)[\s:=.-]*\s*([A-D])\b/i);
      if (ansMatch) {
        detectedCorrect = ansMatch[1].toUpperCase();
        block = block.substring(0, ansMatch.index) + block.substring(ansMatch.index + ansMatch[0].length);
        block = block.trim();
      }

      // Bước 3c: Tìm vị trí 4 phương án A, B, C, D
      // Hỗ trợ: "A.", "A)", "A:", "A/", "(A)", "[A]", "*A.", "A*."
      const optRegex = /(?:^|[\s\t\n;])([*#]?\s*(?:\([A-D]\)|\[[A-D]\]|[A-D]\*?))[\s.:\)\/–-]+(?=\S)/gi;
      const optMatches = [];
      let om;
      while ((om = optRegex.exec(block)) !== null) {
        const rawLetter = om[1].toUpperCase();
        const letter = rawLetter.replace(/[^A-D]/g, '');
        const isStar = rawLetter.includes('*') || rawLetter.includes('#');
        if (letter) {
          optMatches.push({ index: om.index, matchLen: om[0].length, letter, isStar });
        }
      }

      // Lọc các phương án xuất hiện theo đúng thứ tự A -> B -> C -> D (tránh trùng lắp hoặc chữ cái trong đề)
      const validOpts = [];
      const expectedLetters = ['A', 'B', 'C', 'D'];
      let expectedIdx = 0;
      for (const opt of optMatches) {
        if (opt.letter === expectedLetters[expectedIdx]) {
          validOpts.push(opt);
          expectedIdx++;
          if (expectedIdx >= 4) break;
        }
      }

      let qText = block;
      let options = ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];

      if (validOpts.length >= 2) {
        qText = block.substring(0, validOpts[0].index).trim();
        const extractedOpts = {};
        for (let i = 0; i < validOpts.length; i++) {
          const cur = validOpts[i];
          const next = validOpts[i + 1];
          const contentStart = cur.index + cur.matchLen;
          const contentEnd = next ? next.index : block.length;
          let optVal = block.substring(contentStart, contentEnd).trim();
          optVal = optVal.replace(/^[.:;–-]+\s*/, '').replace(/[,;]+$/, '').trim();
          extractedOpts[cur.letter] = optVal;
          if (cur.isStar && !detectedCorrect) {
            detectedCorrect = cur.letter;
          }
        }
        options = [
          extractedOpts['A'] || 'Phương án A',
          extractedOpts['B'] || 'Phương án B',
          extractedOpts['C'] || 'Phương án C',
          extractedOpts['D'] || 'Phương án D'
        ];
      }

      // Kiểm tra đáp án từ bảng đáp án cuối
      if (!detectedCorrect && bottomKeys[item.num]) {
        detectedCorrect = bottomKeys[item.num];
      }
      if (!detectedCorrect && bottomKeys[idx + 1]) {
        detectedCorrect = bottomKeys[idx + 1];
      }

      if (detectedCorrect) {
        correctCount++;
      } else {
        detectedCorrect = 'A';
      }

      // Chuẩn hóa tên câu
      if (!qText.match(/^(?:Câu|Bài|Question|\bQ)\s*\d+/i)) {
        qText = `Câu ${idx + 1}: ${qText}`;
      }

      questions.push({
        id: idx + 1,
        text: qText,
        options,
        correct: detectedCorrect,
        explanation
      });
    });

    return { questions, totalFound: questions.length, correctCount, explanationCount };
  },

  // Tải tệp đề thi mẫu chuẩn (.docx / .txt) về máy giáo viên
  downloadSampleFile(format = 'txt') {
    if (format === 'txt') {
      const sampleText = `ĐỀ THI TRẮC NGHIỆM MẪU CHUẨN EDUTASK PRO\n` +
        `(Giáo viên có thể mở file này chỉnh sửa, hoặc Copy & Paste trực tiếp vào ô Bóc Tách Đề Thi)\n\n` +
        `Câu 1. Nguyên hàm của hàm số f(x) = 3x^2 + 2x là:\n` +
        `A. x^3 + x^2 + C\n` +
        `B. 6x + 2 + C\n` +
        `C. x^3 + 2x^2 + C\n` +
        `D. 3x^3 + x^2 + C\n` +
        `Đáp án: A\n` +
        `Lời giải: Áp dụng công thức nguyên hàm: ∫(3x^2 + 2x)dx = x^3 + x^2 + C.\n\n` +
        `Câu 2. Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 2)^2. Số điểm cực trị của hàm số là:\n` +
        `A. 0    B. 1    C. 2    D. 3\n` +
        `Đáp án: B\n` +
        `Lời giải: f'(x) đổi dấu duy nhất 1 lần khi qua x = 0 (tại x = 2 là nghiệm bội chẵn nên không phải cực trị).\n\n` +
        `Câu 3. Trong không gian Oxyz, mặt cầu (S): (x - 1)^2 + (y + 2)^2 + z^2 = 9 có bán kính R bằng:\n` +
        `*A. 3\n` +
        `B. 9\n` +
        `C. 81\n` +
        `D. √3\n` +
        `Lời giải: Phương trình mặt cầu có R^2 = 9 suy ra R = 3. Dấu sao (*) trước đáp án A biểu thị đáp án đúng.\n\n` +
        `Câu 4: Kim loại nào sau đây dẫn điện và dẫn nhiệt tốt nhất?\n` +
        `A. Vàng\n` +
        `B. Đồng\n` +
        `C. Bạc\n` +
        `D. Nhôm\n\n` +
        `Câu 5: Nước sôi ở bao nhiêu độ C ở điều kiện áp suất khí quyển tiêu chuẩn?\n` +
        `A. 90°C\n` +
        `B. 100°C\n` +
        `C. 110°C\n` +
        `D. 120°C\n\n` +
        `BẢNG ĐÁP ÁN:\n` +
        `4C 5B\n`;

      const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_De_Thi_Trac_Nghiem_Chuan.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      App.showToast('📥 Đã tải xuống tệp mẫu Text (.txt) thành công!', 'success');
    } else if (format === 'docx') {
      const link = document.createElement('a');
      link.href = './templates/Mau_De_Thi_Trac_Nghiem_Chuan.docx';
      link.download = 'Mau_De_Thi_Trac_Nghiem_Chuan.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      App.showToast('📥 Đã tải xuống tệp mẫu Word (.docx) chuẩn cấu trúc!', 'success');
    }
  },

  // Mở modal hướng dẫn định dạng đề chuẩn
  openGuideModal(context = 'create') {
    this.currentGuideContext = context;
    const modal = document.getElementById('quizFormatGuideModal');
    if (modal) modal.classList.add('active');
  },

  // Đóng modal hướng dẫn
  closeGuideModal() {
    const modal = document.getElementById('quizFormatGuideModal');
    if (modal) modal.classList.remove('active');
  },

  // Áp dụng nhanh mẫu thử từ modal hướng dẫn
  applyGuideSample(sampleKey) {
    const context = this.currentGuideContext || 'create';
    this.closeGuideModal();
    this.insertSamplePreset(context, sampleKey);
  },

  // Bộ nạp dữ liệu mẫu thử nghiệm (Presets)
  insertSamplePreset(context, type) {
    const textarea = document.getElementById(`${context}ImportTextarea`);
    if (!textarea) return;

    if (type === 'math') {
      textarea.value = `Câu 1. Nguyên hàm của hàm số f(x) = 3x^2 + 2x là:
A. x^3 + x^2 + C
B. 6x + 2 + C
C. x^3 + 2x^2 + C
D. 3x^3 + x^2 + C
Đáp án: A
Lời giải: Ta có ∫(3x^2 + 2x)dx = x^3 + x^2 + C.

Câu 2. Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 2)^2. Số điểm cực trị của hàm số là:
A. 0
B. 1
C. 2
D. 3
Đáp án: B
Lời giải: Đạo hàm đổi dấu duy nhất 1 lần khi qua x = 0 (tại x = 2 là nghiệm bội chẵn không đổi dấu).

Câu 3. Trong không gian Oxyz, mặt cầu (S): (x - 1)^2 + (y + 2)^2 + z^2 = 9 có bán kính R bằng:
A. 3
B. 9
C. 81
D. √3
Đáp án: A
Lời giải: Bán kính R = √9 = 3.

Câu 4. Giá trị lớn nhất của hàm số f(x) = -x^4 + 2x^2 + 3 trên đoạn [0; 2] bằng:
A. 3
B. 4
C. -5
D. 1
Đáp án: B
Lời giải: f'(x) = -4x^3 + 4x = 0 <=> x = 0 hoặc x = 1. So sánh f(0)=3, f(1)=4, f(2)=-5 -> GTLN là 4.

Câu 5. Nghiệm của phương trình log2(x - 1) = 3 là:
A. x = 7
B. x = 8
C. x = 9
D. x = 10
Đáp án: C
Lời giải: x - 1 = 2^3 = 8 => x = 9.`;
    } else if (type === 'english') {
      textarea.value = `Question 1. If I ______ you, I would study harder for the national exam.
A. was
B. were
C. am
D. be
Key: B
Explanation: Second conditional clause: If + S + were...

Question 2. She has worked as a dedicated teacher ______ 2015.
A. since
B. for
C. in
D. at
Key: A
Explanation: "Since" is used with a specific point in time (2015).

Question 3. The new school library ______ last month by the local committee.
A. is opened
B. opened
C. was opened
D. has been opened
Key: C
Explanation: Past simple passive: was/were + V3/ed.

Question 4. Many young students are interested ______ exploring space science.
A. on
B. in
C. with
D. about
Key: B
Explanation: Collocation: interested in + V-ing.`;
    } else if (type === 'bottom_key') {
      textarea.value = `ĐỀ THI TỔNG HỢP KIẾN THỨC
Câu 1: Kim loại nào sau đây dẫn điện và dẫn nhiệt tốt nhất?
A. Vàng
B. Đồng
C. Bạc
D. Nhôm

Câu 2: Nước sôi ở bao nhiêu độ C ở điều kiện áp suất khí quyển tiêu chuẩn?
A. 90°C
B. 100°C
C. 110°C
D. 120°C

Câu 3: Ai là tác giả của tác phẩm văn học hiện thực "Tắt đèn"?
A. Nam Cao
B. Ngô Tất Tố
C. Vũ Trọng Phụng
D. Kim Lân

Câu 4: Quá trình quang hợp ở thực vật nhả ra khí gì vào khí quyển?
A. Khí Cacbonic (CO2)
B. Khí Oxi (O2)
C. Khí Nitơ (N2)
D. Khí Hidro (H2)

BẢNG ĐÁP ÁN:
1C 2B 3B 4B`;
    } else if (type === 'theory') {
      textarea.value = `Đoạn lý thuyết sinh học & vật lý:
Quang hợp là quá trình biến đổi năng lượng ánh sáng mặt trời thành năng lượng hóa học dưới dạng các hợp chất hữu cơ.
Lục lạp là bào quan thực hiện chức năng quang hợp chính ở tế bào thực vật, chứa sắc tố diệp lục hấp thụ ánh sáng.
Trong pha sáng của quang hợp, nước bị quang phân ly tạo ra khí oxi giải phóng ra môi trường.

--- Hệ thống đã tự động tạo câu hỏi trắc nghiệm từ nội dung trên ---
Câu 1: Quang hợp là quá trình biến đổi dạng năng lượng nào?
A. Năng lượng ánh sáng mặt trời thành năng lượng hóa học
B. Năng lượng nhiệt thành cơ năng
C. Năng lượng hạt nhân thành hóa năng
D. Điện năng thành thế năng
Đáp án: A
Lời giải: Quang hợp biến đổi quang năng thành hóa năng trong hợp chất hữu cơ.

Câu 2: Bào quan nào thực hiện chức năng quang hợp chính ở tế bào thực vật?
A. Ty thể
B. Lục lạp
C. Không bào
D. Bộ máy Golgi
Đáp án: B
Lời giải: Lục lạp chứa chất diệp lục đảm nhận chức năng quang hợp.

Câu 3: Khí oxi được giải phóng trong quang hợp có nguồn gốc từ đâu?
A. Khí cacbonic (CO2)
B. Sự quang phân ly nước (H2O)
C. Sự phân giải glucozơ
D. Hợp chất diệp lục
Đáp án: B
Lời giải: Oxi được tạo ra từ phản ứng quang phân ly nước trong pha sáng.`;
    }

    this.handleParsePreview(context);
    App.showToast(`✓ Đã nạp mẫu đề thi "${type}" thành công!`, 'success');
  },

  // Xử lý xem trước kết quả bóc tách trực tiếp (Live Preview)
  handleParsePreview(context) {
    const textarea = document.getElementById(`${context}ImportTextarea`);
    const previewBox = document.getElementById(`${context}ImportPreviewBox`);
    if (!textarea || !previewBox) return;

    const raw = textarea.value;
    if (!raw.trim()) {
      previewBox.innerHTML = `
        <div style="text-align:center; padding:20px; color:#94a3b8; font-size:13px;">
          📝 Chưa có nội dung. Hãy dán đề bài hoặc tải tệp lên ở trên rồi bấm <strong>"⚡ Phân Tích & Bóc Tách"</strong>.
        </div>
      `;
      previewBox.classList.remove('has-data');
      this.tempParsedQuestions[context] = null;
      return;
    }

    const res = this.parseExamText(raw);
    this.tempParsedQuestions[context] = res.questions;

    if (res.totalFound === 0) {
      previewBox.innerHTML = `
        <div style="text-align:center; padding:16px; color:#b91c1c; background:#fef2f2; border-radius:8px; font-size:13px;">
          ⚠️ Chưa nhận diện được câu hỏi trắc nghiệm nào. Vui lòng kiểm tra lại cấu trúc đề (VD: Câu 1, A., B., C., D.).
        </div>
      `;
      previewBox.classList.remove('has-data');
      return;
    }

    previewBox.classList.add('has-data');
    previewBox.innerHTML = `
      <div class="preview-stats-bar">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span class="preview-stat-pill" style="background:#dcfce7; color:#166534;">
            🟢 <strong>${res.totalFound}</strong> câu hỏi
          </span>
          <span class="preview-stat-pill" style="background:#e0e7ff; color:#3730a3;">
            🎯 <strong>${res.correctCount}/${res.totalFound}</strong> có đáp án
          </span>
          ${res.explanationCount > 0 ? `
            <span class="preview-stat-pill" style="background:#fef3c7; color:#92400e;">
              💡 <strong>${res.explanationCount}</strong> câu có lời giải
            </span>
          ` : ''}
        </div>
        <button type="button" class="btn btn-sm btn-primary" onclick="Quiz.applyParsedQuestions('${context}')" style="box-shadow:0 2px 8px rgba(37,99,235,0.3); font-weight:700;">
          ✅ Nạp ${res.totalFound} Câu Vào Đề Thi
        </button>
      </div>

      <div style="max-height:360px; overflow-y:auto; padding-right:4px;">
        ${res.questions.map((q, idx) => `
          <div class="preview-q-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">
              <strong style="font-size:13px; color:#1e293b;">${q.text}</strong>
              <span class="badge badge-success" style="font-size:11px; white-space:nowrap;">
                Đáp án: <strong>${q.correct}</strong>
              </span>
            </div>
            <div class="preview-options-grid">
              ${['A', 'B', 'C', 'D'].map((letter, optIdx) => `
                <div class="preview-opt-item ${q.correct === letter ? 'is-correct' : ''}">
                  <span style="font-weight:800; min-width:18px;">${letter}.</span>
                  <span>${q.options[optIdx] || ''}</span>
                  ${q.correct === letter ? '<span style="margin-left:auto; color:#16a34a; font-weight:900;">✓</span>' : ''}
                </div>
              `).join('')}
            </div>
            ${q.explanation ? `
              <div class="preview-explanation">
                <strong>💡 Lời giải:</strong> ${q.explanation}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div style="margin-top:12px; text-align:center;">
        <button type="button" class="btn btn-primary" onclick="Quiz.applyParsedQuestions('${context}')" style="padding:8px 24px; font-size:13.5px; font-weight:700;">
          🚀 ÁP DỤNG TOÀN BỘ ${res.totalFound} CÂU HỎI VÀO BÀI TẬP
        </button>
      </div>
    `;
  },

  // Áp dụng danh sách câu hỏi bóc tách vào form đề thi chính
  applyParsedQuestions(context) {
    const list = this.tempParsedQuestions[context];
    if (!list || list.length === 0) {
      App.showToast('Chưa có câu hỏi nào được bóc tách để nạp!', 'warning');
      return;
    }

    this.builderState[context].questions = JSON.parse(JSON.stringify(list));
    this.builderState[context].mode = 'detailed';
    this.renderBuilder(context);
    App.showToast(`✓ Đã nạp thành công ${list.length} câu hỏi vào đề thi! Gia sư có thể xem và chỉnh sửa trước khi giao bài.`, 'success');
  },

  // Xóa trắng ô nhập liệu import
  clearImport(context) {
    const textarea = document.getElementById(`${context}ImportTextarea`);
    if (textarea) textarea.value = '';
    this.tempParsedQuestions[context] = null;
    this.handleParsePreview(context);
  },

  // Render giao diện soạn thảo trắc nghiệm
  renderBuilder(context = 'create') {
    const container = document.getElementById(context === 'create' ? 'createQuizBuilderContainer' : 'editQuizBuilderContainer');
    if (!container) return;

    const state = this.builderState[context];
    const mode = state.mode || 'quick';
    const isQuick = mode === 'quick';
    const isDetailed = mode === 'detailed';
    const isImport = mode === 'import';
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
              ⚡ Bảng Đáp Án (Azota)
            </button>
            <button type="button" class="btn btn-xs ${isDetailed ? 'btn-primary' : 'btn-outline'}" onclick="Quiz.setBuilderMode('${context}', 'detailed')" title="Soạn chi tiết nội dung từng câu hỏi">
              📝 Soạn Chi Tiết
            </button>
            <button type="button" class="btn btn-xs ${isImport ? 'btn-primary' : 'btn-outline'}" onclick="Quiz.setBuilderMode('${context}', 'import')" title="Tự động đọc dữ liệu đề thi từ File Word / Text / Dán nội dung" style="${isImport ? 'background:linear-gradient(135deg, #4f46e5, #0ea5e9); border:none; color:#fff;' : 'border-color:#818cf8; color:#4f46e5;'}">
              🤖 Tách Đề Tự Động (AI / File)
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

          ${!isImport ? `
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="font-size:12px; color:#64748b; font-weight:600;">Số câu:</span>
              ${[5, 10, 15, 20, 40].map(cnt => `
                <button type="button" class="btn btn-xs ${totalQ === cnt ? 'btn-secondary' : 'btn-white'}" onclick="Quiz.setQuestionCount('${context}', ${cnt})" style="padding:2px 8px; font-size:11.5px;">
                  ${cnt} câu
                </button>
              `).join('')}
            </div>
          ` : `
            <div style="font-size:12px; color:#4f46e5; font-weight:700;">
              ✨ Tự động nhận diện số lượng câu hỏi từ đề thi
            </div>
          `}
        </div>

        ${isImport ? `
          <!-- Chế độ 3: Bóc Tách Tự Động Từ Văn Bản / File (Smart Import) -->
          <div class="quiz-import-box">
            <div class="import-guide-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <strong>🤖 Hướng Dẫn Bóc Tách Đề Thi Tự Động:</strong><br>
                Dán đề thi từ Word/PDF hoặc tải tệp <code>.docx</code> / <code>.txt</code>. Tự động nhận diện câu hỏi, 4 phương án, đáp án và lời giải chi tiết.
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button type="button" class="btn-guide-pill" onclick="Quiz.openGuideModal('${context}')" title="Xem cẩm nang hướng dẫn soạn đề và mẹo hay">
                  📖 Hướng Dẫn Soạn Chuẩn
                </button>
                <button type="button" class="btn-download-pill" onclick="Quiz.downloadSampleFile('docx')" title="Tải tệp Word (.docx) mẫu về máy tính">
                  📘 Tải Mẫu Word (.docx)
                </button>
                <button type="button" class="btn-download-pill" onclick="Quiz.downloadSampleFile('txt')" title="Tải tệp Text (.txt) mẫu về máy tính">
                  📄 Tải Mẫu Text (.txt)
                </button>
              </div>
            </div>

            <!-- Thanh chọn mẫu đề & Tải tệp -->
            <div class="import-presets-bar">
              <span style="font-size:12px; font-weight:700; color:#334155;">Thử nhanh:</span>
              <button type="button" class="import-preset-chip" onclick="Quiz.insertSamplePreset('${context}', 'math')">
                📐 Mẫu Toán THPT (5 câu)
              </button>
              <button type="button" class="import-preset-chip" onclick="Quiz.insertSamplePreset('${context}', 'english')">
                🇬🇧 Mẫu Tiếng Anh (4 câu)
              </button>
              <button type="button" class="import-preset-chip" onclick="Quiz.insertSamplePreset('${context}', 'bottom_key')">
                📑 Mẫu Bảng Đáp Án Cuối
              </button>
              <button type="button" class="import-preset-chip" onclick="Quiz.insertSamplePreset('${context}', 'theory')" style="background:#fef3c7; border-color:#fcd34d; color:#92400e;">
                💡 Sinh từ Lý Thuyết (AI Gen)
              </button>

              <div style="margin-left:auto;">
                <input type="file" id="${context}ImportFileInput" accept=".docx,.txt" style="display:none;" onchange="Quiz.readUploadedFile(event, '${context}')">
                <button type="button" class="btn btn-xs btn-outline" onclick="document.getElementById('${context}ImportFileInput').click()" style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px;">
                  📁 Tải Tệp Đề (.docx, .txt)
                </button>
              </div>
            </div>

            <textarea id="${context}ImportTextarea" class="import-textarea" placeholder="Dán nội dung toàn bộ đề thi vào đây... Ví dụ:&#10;Câu 1: Cho hàm số y = f(x)...&#10;A. 1&#10;B. 2&#10;C. 3&#10;D. 4&#10;Đáp án: B&#10;Lời giải: Ta có..." oninput="Quiz.handleParsePreview('${context}')"></textarea>

            <div class="import-actions-bar">
              <div style="display:flex; gap:8px;">
                <button type="button" class="btn btn-sm btn-primary" onclick="Quiz.handleParsePreview('${context}')" style="display:inline-flex; align-items:center; gap:6px;">
                  ⚡ Phân Tích & Bóc Tách Ngay
                </button>
                <button type="button" class="btn btn-sm btn-outline" onclick="Quiz.clearImport('${context}')">
                  🧹 Xóa Trắng
                </button>
              </div>
              <span style="font-size:11.5px; color:#64748b;">
                Xem trước kết quả ngay bên dưới trước khi áp dụng
              </span>
            </div>

            <!-- Vùng xem trước kết quả trực tiếp -->
            <div id="${context}ImportPreviewBox" class="import-preview-box">
              <div style="text-align:center; padding:16px; color:#94a3b8; font-size:13px;">
                📝 Dán đề bài hoặc bấm chọn mẫu thử ở trên để xem trước câu hỏi tại đây.
              </div>
            </div>
          </div>
        ` : isQuick ? `
          <!-- Chế độ 1: Bảng đáp án nhanh kiểu Azota -->
          <div class="quiz-quick-box">
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 12px; margin-bottom:12px; font-size:12px; color:#1e40af; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <span>💡 <strong>Mẹo:</strong> Đính kèm file đề bài (PDF/Word) ở trên, rồi chọn bảng đáp án dưới đây hoặc <a href="javascript:void(0)" onclick="Quiz.setBuilderMode('${context}', 'import')" style="color:#2563eb; font-weight:700; text-decoration:underline;">Tự Động Tách Câu Hỏi từ File</a>.</span>
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
          <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:8px 12px; margin-bottom:10px;">
            <span style="font-size:12px; color:#166534;">💡 Có sẵn file Word/PDF hoặc muốn dán toàn bộ đề thi?</span>
            <button type="button" class="btn btn-xs btn-primary" onclick="Quiz.setBuilderMode('${context}', 'import')" style="font-size:11.5px; padding:3px 10px;">
              🤖 Bóc Tách Tự Động Từ File / Đề Thi
            </button>
          </div>

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

        ${!isImport ? `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid #e2e8f0;">
            <span style="font-size:12.5px; color:#475569; font-weight:600;">
              📊 Tổng cộng: <strong>${totalQ}</strong> câu hỏi trắc nghiệm
            </span>
            <button type="button" class="btn btn-sm btn-outline" onclick="Quiz.addQuestion('${context}')">
              ➕ Thêm 1 câu hỏi
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Thu thập dữ liệu trắc nghiệm để lưu vào bài tập
  getBuilderData(context = 'create') {
    const durationInput = document.getElementById(`${context}QuizDuration`);
    const duration = durationInput ? parseInt(durationInput.value) : this.builderState[context].durationMinutes;
    return {
      mode: this.builderState[context].mode === 'import' ? 'detailed' : this.builderState[context].mode,
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
