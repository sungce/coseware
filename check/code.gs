const SHEET_NAME = 'Sheet1'; // 시트 이름 확인

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // 들어온 데이터 파싱
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'saveProgress') {
    const { classId, grade, num, unitId, lessonId, memo, updatedAt } = data.payload;
    
    // 기존에 해당 학급(classId)의 데이터가 있는지 찾기
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === classId) {
        rowIndex = i + 1; // Apps Script는 1-based index
        break;
      }
    }

    if (rowIndex > -1) {
      // 기존 기록이 있으면 업데이트 (2열~7열 업데이트)
      sheet.getRange(rowIndex, 4, 1, 4).setValues([[unitId, lessonId, memo, updatedAt]]);
    } else {
      // 새로운 기록이면 추가
      sheet.appendRow([classId, grade, num, unitId, lessonId, memo, updatedAt]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // 웹앱에서 데이터를 불러올 때 사용 (전체 진도 데이터 반환)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  
  const progressData = {};
  
  // 첫 줄(헤더) 제외하고 데이터 객체로 변환
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    progressData[row[0]] = {
      unitId: row[3],
      lessonId: row[4],
      memo: row[5],
      updatedAt: row[6]
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(progressData)).setMimeType(ContentService.MimeType.JSON);
}
