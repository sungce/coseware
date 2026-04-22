// ================================================
// Google Apps Script - 회원가입 데이터 수신
// 연결된 스프레드시트 ID: 1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c
// ================================================

const SPREADSHEET_ID = '1EIA8zU82F9UXBOQz-6u92Su1zUFPsT_RFqS0Yuqpz2c';
const SHEET_NAME     = 'Sheet1'; // 실제 시트 탭 이름으로 변경

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

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 배포 전 테스트용 함수 (실행 버튼으로 직접 테스트 가능)
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
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
