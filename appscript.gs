// ================================================
// Google Apps Script - 회원가입 & 수행평가 제출 관리
// 연결된 스프레드시트 ID: 1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c
// ================================================

const SPREADSHEET_ID = '1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c';
const SHEET_MEMBERS  = 'Sheet1';       // 회원 목록 시트
const SHEET_SUBMIT   = 'Submissions';  // 수행평가 제출 시트

// ── GET: 회원 목록 / 제출 내역 조회 ──────────────────────────
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
        const rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
        members = rows
          .filter(row => row[2])
          .map(row => ({
            date : row[0] ? String(row[0]) : '',
            name : row[1] ? String(row[1]) : '',
            email: row[2] ? String(row[2]) : '',
            uid  : row[3] ? String(row[3]) : '',
          }));
      }
      result = { members };
    } catch (err) {
      result = { members: [], error: err.message };
    }
  }

  // 특정 학생 제출 내역 (대시보드)
  else if (action === 'getSubmissions') {
    const email = e.parameter.email || '';
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_SUBMIT);
      if (!sheet) {
        result = { submissions: [] };
      } else {
        const lastRow = sheet.getLastRow();
        let submissions = [];
        if (lastRow > 1) {
          const rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
          submissions = rows
            .filter(row => !email || String(row[2]) === email)
            .map(row => ({
              date      : row[0] ? String(row[0]) : '',
              studentId : row[1] ? String(row[1]) : '',
              email     : row[2] ? String(row[2]) : '',
              name      : row[3] ? String(row[3]) : '',
              assignment: row[4] ? String(row[4]) : '',
              link      : row[5] ? String(row[5]) : '',
            }));
        }
        result = { submissions };
      }
    } catch (err) {
      result = { submissions: [], error: err.message };
    }
  }

  // 전체 제출 목록 (관리자)
  else if (action === 'getAllSubmissions') {
    try {
      const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_SUBMIT);
      if (!sheet) {
        result = { submissions: [] };
      } else {
        const lastRow = sheet.getLastRow();
        let submissions = [];
        if (lastRow > 1) {
          const rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
          submissions = rows.map(row => ({
            date      : row[0] ? String(row[0]) : '',
            studentId : row[1] ? String(row[1]) : '',
            email     : row[2] ? String(row[2]) : '',
            name      : row[3] ? String(row[3]) : '',
            assignment: row[4] ? String(row[4]) : '',
            link      : row[5] ? String(row[5]) : '',
          }));
        }
        result = { submissions };
      }
    } catch (err) {
      result = { submissions: [], error: err.message };
    }
  }

  else {
    result = { error: 'Unknown action' };
  }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// ── POST: 회원가입 저장 / 수행평가 제출 저장 ────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    const type = data.type || 'member';

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
        data.studentId  || '',
        data.email      || '',
        data.name       || '',
        data.assignment || '',
        data.link       || '',
      ]);
      return jsonResponse({ result: 'success' });
    }

    // 회원가입 저장
    let sheet = ss.getSheetByName(SHEET_MEMBERS);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['가입일시', '성명', '이메일', 'Firebase UID']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
    }
    sheet.appendRow([
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data.name  || '',
      data.email || '',
      data.uid   || '',
    ]);
    return jsonResponse({ result: 'success' });

  } catch (err) {
    return jsonResponse({ result: 'error', message: err.message });
  }
}

// ── 공통 JSON 응답 ────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 테스트용 함수 ─────────────────────────────────────────────
function testMember() {
  const mock = { postData: { contents: JSON.stringify({
    type: 'member', name: '테스트학생', email: 'test@school.com', uid: 'uid-test-001'
  })}};
  Logger.log(doPost(mock).getContent());
}

function testSubmission() {
  const mock = { postData: { contents: JSON.stringify({
    type: 'submission', studentId: '30101', email: 'test@school.com',
    name: '홍길동', assignment: '[1차] 나만의 웹 프로필', link: 'https://github.com/test'
  })}};
  Logger.log(doPost(mock).getContent());
}
