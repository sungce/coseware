// ================================================
// Google Apps Script - 회원가입 데이터 수신 & 조회
// 연결된 스프레드시트 ID: 1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c
// ================================================

const SPREADSHEET_ID = '1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c';
const SHEET_NAME     = 'Sheet1';

// 회원 목록 조회 (GET) - 관리자 페이지에서 호출
function doGet(e) {
  const action   = e.parameter.action;
  const callback = e.parameter.callback; // JSONP 콜백

  if (action === 'getMembers') {
    try {
      const sheet   = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      const lastRow = sheet.getLastRow();
      let members   = [];

      if (lastRow > 1) {
        const rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
        members = rows
          .filter(row => row[2]) // 이메일 있는 행만
          .map(row => ({
            date : row[0] ? String(row[0]) : '',
            name : row[1] ? String(row[1]) : '',
            email: row[2] ? String(row[2]) : '',
            uid  : row[3] ? String(row[3]) : '',
          }));
      }

      const result = JSON.stringify({ members });

      // JSONP 요청이면 콜백으로 감싸서 반환
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }

      return ContentService
        .createTextOutput(result)
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      const result = JSON.stringify({ members: [], error: err.message });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 회원 가입 데이터 저장 (POST)
function doPost(e) {
  try {
    const sheet = SpreadsheetApp
      .openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_NAME);

    // 1행이 비어있으면 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['가입일시', '성명', '이메일', 'Firebase UID']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
    }

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data.name,
      data.email,
      data.uid
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

// 배포 전 테스트용 함수
function testDoPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        name:  '테스트학생',
        email: 'test@school.com',
        uid:   'test-uid-12345'
      })
    }
  };
  Logger.log(doPost(mockEvent).getContent());
}

