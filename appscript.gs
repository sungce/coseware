// ================================================
// Google Apps Script - 정보 클래스룸 통합 관리
// 연결된 스프레드시트 ID: 1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c
// ================================================

const SPREADSHEET_ID  = '1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c';
const SHEET_MEMBERS   = 'Sheet1';      // 회원 목록
const SHEET_SUBMIT    = 'Submissions'; // 수행평가 제출
const SHEET_NOTICES   = 'Notices';     // 공지사항
const SHEET_MATERIALS = 'Materials';   // 학습자료

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
      const sheet = ss.getSheetByName(SHEET_NOTICES);
      let notices = [];
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
        notices = rows.filter(r => r[2]).map((r, i) => ({
          id     : r[0] ? String(r[0]) : String(i + 1),
          type   : r[1] ? String(r[1]) : 'normal',
          title  : r[2] ? String(r[2]) : '',
          content: r[3] ? String(r[3]) : '',
          date   : r[4] ? String(r[4]) : '',
          author : r[5] ? String(r[5]) : '정보선생님',
        }));
        notices.reverse();
      }
      result = { notices };
    } catch (err) { result = { notices: [], error: err.message }; }
  }

  // 학습자료 목록 (단원별)
  else if (action === 'getMaterials') {
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_MATERIALS);
      let materials = [];
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
        materials = rows.filter(r => r[2]).map(r => ({
          id      : r[0] ? String(r[0]) : '',
          unit    : r[1] ? String(r[1]) : '',
          title   : r[2] ? String(r[2]) : '',
          content : r[3] ? String(r[3]) : '',
          fileName: r[4] ? String(r[4]) : '',
          fileUrl : r[5] ? String(r[5]) : '',
          date    : r[6] ? String(r[6]) : '',
        }));
      }
      result = { materials };
    } catch (err) { result = { materials: [], error: err.message }; }
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

    // 학습자료 저장
    if (type === 'material') {
      let sheet = ss.getSheetByName(SHEET_MATERIALS);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_MATERIALS);
        sheet.appendRow(['ID', '단원', '제목', '내용', '파일명', '파일URL', '등록일']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#0f9d58').setFontColor('#ffffff');
      }
      const id   = String(sheet.getLastRow());
      const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).replace(/\. /g, '.').replace(/\.$/, '');
      sheet.appendRow([id, data.unit || '', data.title || '', data.content || '', data.fileName || '', data.fileUrl || '', date]);
      return jsonResponse({ result: 'success' });
    }

    // 학습자료 삭제
    if (type === 'deleteMaterial') {
      const sheet = ss.getSheetByName(SHEET_MATERIALS);
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][0]) === String(data.id)) { sheet.deleteRow(i + 1); break; }
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 공지사항 수정
    if (type === 'updateNotice') {
      const sheet = ss.getSheetByName(SHEET_NOTICES);
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === String(data.id)) {
            sheet.getRange(i + 1, 2).setValue(data.noticeType || 'normal');
            sheet.getRange(i + 1, 3).setValue(data.title || '');
            sheet.getRange(i + 1, 4).setValue(data.content || '');
            break;
          }
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 공지사항 저장
    if (type === 'notice') {
      let sheet = ss.getSheetByName(SHEET_NOTICES);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NOTICES);
        sheet.appendRow(['ID', '유형', '제목', '내용', '날짜', '작성자']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ea4335').setFontColor('#ffffff');
      }
      const id   = String(sheet.getLastRow());
      const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).replace(/\. /g, '.').replace(/\.$/, '');
      sheet.appendRow([id, data.noticeType || 'normal', data.title, data.content || '', date, data.author || '정보선생님']);
      return jsonResponse({ result: 'success' });
    }

    // 공지사항 삭제
    if (type === 'deleteNotice') {
      const sheet = ss.getSheetByName(SHEET_NOTICES);
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][0]) === String(data.id)) { sheet.deleteRow(i + 1); break; }
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

    // 제출 수정
    if (type === 'updateSubmission') {
      const sheet = ss.getSheetByName(SHEET_SUBMIT);
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow()-1, 6).getValues();
        for (let i = 0; i < rows.length; i++) {
          if (String(rows[i][2]) === String(data.email) && String(rows[i][0]) === String(data.date)) {
            sheet.getRange(i+2, 2).setValue(data.studentId  || '');
            sheet.getRange(i+2, 3).setValue(data.email      || '');
            sheet.getRange(i+2, 4).setValue(data.name       || '');
            sheet.getRange(i+2, 5).setValue(data.assignment || '');
            sheet.getRange(i+2, 6).setValue(data.link       || '');
            break;
          }
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 제출 삭제
    if (type === 'deleteSubmission') {
      const sheet = ss.getSheetByName(SHEET_SUBMIT);
      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow()-1, 6).getValues();
        for (let i = rows.length-1; i >= 0; i--) {
          if (String(rows[i][2]) === String(data.email) &&
              String(rows[i][4]) === String(data.assignment)) {
            sheet.deleteRow(i+2);
            break;
          }
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 회원 정보 수정
    if (type === 'updateMember') {
      const sheet   = ss.getSheetByName(SHEET_MEMBERS);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
        for (let i = 0; i < rows.length; i++) {
          if (String(rows[i][3]) === String(data.email) || String(rows[i][4]) === String(data.uid)) {
            sheet.getRange(i + 2, 2).setValue(data.name      || '');
            sheet.getRange(i + 2, 3).setValue(data.studentId || '');
            sheet.getRange(i + 2, 4).setValue(data.email     || '');
            break;
          }
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 회원 삭제
    if (type === 'deleteMember') {
      const sheet   = ss.getSheetByName(SHEET_MEMBERS);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
        for (let i = rows.length - 1; i >= 0; i--) {
          if (String(rows[i][3]) === String(data.email) || String(rows[i][4]) === String(data.uid)) {
            sheet.deleteRow(i + 2);
            break;
          }
        }
      }

      // Firebase Auth에서도 삭제 (UID가 있을 경우)
      if (data.uid) {
        try {
          const FIREBASE_API_KEY = 'AIzaSyAIiqU7pLdcibQM3u7Jy88-jSZahIM_jMM';
          // Admin SDK가 없으므로 Identity Toolkit API로 삭제 시도
          const url = `https://identitytoolkit.googleapis.com/v1/projects/book-c2d05/accounts/${data.uid}?key=${FIREBASE_API_KEY}`;
          UrlFetchApp.fetch(url, { method: 'delete', muteHttpExceptions: true });
        } catch(e) { /* Firebase Auth 삭제 실패는 무시 (관리자 권한 필요) */ }
      }

      return jsonResponse({ result: 'success' });
    }

    // 회원가입 저장
    let sheet = ss.getSheetByName(SHEET_MEMBERS);
    // 헤더가 없거나 5열 미만이면 헤더 재설정
    if (sheet.getLastRow() === 0 || sheet.getLastColumn() < 5) {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['가입일시', '성명', '학번', '이메일', 'Firebase UID']);
      } else {
        sheet.getRange(1, 1, 1, 5).setValues([['가입일시', '성명', '학번', '이메일', 'Firebase UID']]);
      }
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
