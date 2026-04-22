// ================================================
// Google Apps Script - 정보 클래스룸 통합 관리
// 연결된 스프레드시트 ID: 1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c
// ================================================

const SPREADSHEET_ID = '1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c';
const SHEET_MEMBERS  = 'Sheet1';       // 회원 목록
const SHEET_SUBMIT   = 'Submissions';  // 수행평가 제출
const SHEET_NOTICES  = 'Notices';      // 공지사항

// ── GET ──────────────────────────────────────────────────────
function doGet(e) {
  const action   = e.parameter.action;
  const callback = e.parameter.callback;
  let result     = {};

  // 회원 목록 (관리자)
  if (action === 'getMembers') {
    try {
      const sheet   = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_MEMBERS);
      const lastRow = sheet.getLastRow();
      let members   = [];
      if (lastRow > 1) {
        const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
        members = rows.filter(r => r[3]).map(r => ({
          date      : r[0] ? String(r[0]) : '',
          name      : r[1] ? String(r[1]) : '',
          studentId : r[2] ? String(r[2]) : '',
          email     : r[3] ? String(r[3]) : '',
          uid       : r[4] ? String(r[4]) : '',
        }));
      }
      result = { members };
    } catch (err) { result = { members: [], error: err.message }; }
  }

  // 공지사항 목록
  else if (action === 'getNotices') {
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet   = ss.getSheetByName(SHEET_NOTICES);
      let notices = [];
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
        notices = rows.filter(r => r[1]).map((r, i) => ({
          id    : r[0] ? String(r[0]) : String(i + 1),
          type  : r[1] ? String(r[1]) : 'normal',
          title : r[2] ? String(r[2]) : '',
          date  : r[3] ? String(r[3]) : '',
          author: r[4] ? String(r[4]) : '정보선생님',
        }));
        notices.reverse(); // 최신순
      }
      result = { notices };
    } catch (err) { result = { notices: [], error: err.message }; }
  }

  // 특정 학생 제출 내역
  else if (action === 'getSubmissions') {
    const email = e.parameter.email || '';
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_SUBMIT);
      let submissions = [];
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
        submissions = rows
          .filter(r => !email || String(r[2]) === email)
          .map(r => ({
            date      : r[0] ? String(r[0]) : '',
            studentId : r[1] ? String(r[1]) : '',
            email     : r[2] ? String(r[2]) : '',
            name      : r[3] ? String(r[3]) : '',
            assignment: r[4] ? String(r[4]) : '',
            link      : r[5] ? String(r[5]) : '',
          }));
      }
      result = { submissions };
    } catch (err) { result = { submissions: [], error: err.message }; }
  }

  // 전체 제출 목록 (관리자)
  else if (action === 'getAllSubmissions') {
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_SUBMIT);
      let submissions = [];
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
        submissions = rows.map(r => ({
          date      : r[0] ? String(r[0]) : '',
          studentId : r[1] ? String(r[1]) : '',
          email     : r[2] ? String(r[2]) : '',
          name      : r[3] ? String(r[3]) : '',
          assignment: r[4] ? String(r[4]) : '',
          link      : r[5] ? String(r[5]) : '',
        }));
      }
      result = { submissions };
    } catch (err) { result = { submissions: [], error: err.message }; }
  }

  else { result = { error: 'Unknown action' }; }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// ── POST ─────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    const type = data.type || 'member';

    // 공지사항 저장
    if (type === 'notice') {
      let sheet = ss.getSheetByName(SHEET_NOTICES);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NOTICES);
        sheet.appendRow(['ID', '유형', '제목', '날짜', '작성자']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#ea4335').setFontColor('#ffffff');
      }
      const id   = String(sheet.getLastRow()); // 순번
      const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).replace(/\. /g, '.').replace(/\.$/, '');
      sheet.appendRow([id, data.noticeType || 'normal', data.title, date, data.author || '정보선생님']);
      return jsonResponse({ result: 'success' });
    }

    // 공지사항 삭제
    if (type === 'deleteNotice') {
      const sheet = ss.getSheetByName(SHEET_NOTICES);
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][0]) === String(data.id)) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 수행평가 제출 저장
    if (type === 'submission') {
      let sheet = ss.getSheetByName(SHEET_SUBMIT);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_SUBMIT);
        sheet.appendRow(['제출일시', '학번', '이메일', '이름', '과제명', '링크/내용']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#34a853').setFontColor('#ffffff');
      }
      sheet.appendRow([
        new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        data.studentId || '', data.email || '', data.name || '',
        data.assignment || '', data.link || '',
      ]);
      return jsonResponse({ result: 'success' });
    }

    // 회원가입 저장
    let sheet = ss.getSheetByName(SHEET_MEMBERS);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['가입일시', '성명', '학번', '이메일', 'Firebase UID']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
    }
    sheet.appendRow([
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data.name      || '',
      data.studentId || '',
      data.email     || '',
      data.uid       || '',
    ]);
    return jsonResponse({ result: 'success' });

  } catch (err) {
    return jsonResponse({ result: 'error', message: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
