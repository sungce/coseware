// ============================================================
//  정보교과 학습 기록 Apps Script
//  - 새 Google Sheets 에 연결해서 사용합니다.
//  - SPREADSHEET_ID 를 새 시트의 ID 로 교체하세요.
// ============================================================

const LEARNING_SPREADSHEET_ID = 'YOUR_NEW_SPREADSHEET_ID';  // ← 여기를 교체

const SHEET_ACTIVITY = 'Activities';   // 수행 활동 저장
const SHEET_SELFCHECK = 'SelfChecks';  // 자기 평가 저장
const SHEET_DONE     = 'Completed';    // 완료 표시 저장

const SHEET_PERF     = 'Performance';  // 과정 중심 활동 저장


  var params = e.parameter;
  var cb     = params.callback || 'callback';

  // 학생별 학습 기록 조회
  if (params.action === 'getRecords') {
    try {
      var ss   = SpreadsheetApp.openById(LEARNING_SPREADSHEET_ID);
      var result = { activities: [], selfchecks: [], completed: [], performance: [] };

      var shA = ss.getSheetByName(SHEET_ACTIVITY);
      if (shA && shA.getLastRow() > 1) {
        result.activities = shA.getRange(2, 1, shA.getLastRow()-1, shA.getLastColumn())
          .getValues().filter(r => r[0]).map(r => ({
            date: r[0], userName: r[1], studentId: r[2], lessonKey: r[3], lessonName: r[4], answers: r[5]
          }));
      }

      var shS = ss.getSheetByName(SHEET_SELFCHECK);
      if (shS && shS.getLastRow() > 1) {
        result.selfchecks = shS.getRange(2, 1, shS.getLastRow()-1, shS.getLastColumn())
          .getValues().filter(r => r[0]).map(r => ({
            date: r[0], userName: r[1], studentId: r[2], lessonKey: r[3], lessonName: r[4], answers: r[5]
          }));
      }

      var shD = ss.getSheetByName(SHEET_DONE);
      if (shD && shD.getLastRow() > 1) {
        result.completed = shD.getRange(2, 1, shD.getLastRow()-1, shD.getLastColumn())
          .getValues().filter(r => r[0]).map(r => ({
            date: r[0], userName: r[1], studentId: r[2], unit: r[3], lessonNum: r[4], lessonName: r[5]
          }));
      }

      var shP = ss.getSheetByName(SHEET_PERF);
      if (shP && shP.getLastRow() > 1) {
        result.performance = shP.getRange(2, 1, shP.getLastRow()-1, shP.getLastColumn())
          .getValues().filter(r => r[0]).map(r => ({
            date: r[0], userName: r[1], studentId: r[2], unit: r[3], saveKey: r[4], answers: r[5]
          }));
      }

      return ContentService
        .createTextOutput(cb + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);

    } catch(err) {
      return ContentService
        .createTextOutput(cb + '({"error":"' + err.message + '"})')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
  }

  // 전체 학생 요약
  if (params.action === 'getSummary') {
    try {
      var ss  = SpreadsheetApp.openById(LEARNING_SPREADSHEET_ID);
      var shD = ss.getSheetByName(SHEET_DONE);
      var summary = {};
      if (shD && shD.getLastRow() > 1) {
        var rows = shD.getRange(2,1,shD.getLastRow()-1,5).getValues().filter(r=>r[0]);
        rows.forEach(r => {
          var name = r[1];
          if (!summary[name]) summary[name] = { name, count: 0, latest: '' };
          summary[name].count++;
          if (!summary[name].latest || r[0] > summary[name].latest) summary[name].latest = r[0];
        });
      }
      var arr = Object.values(summary).sort((a,b) => b.count - a.count);
      return ContentService
        .createTextOutput(cb + '(' + JSON.stringify({ summary: arr }) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } catch(err) {
      return ContentService
        .createTextOutput(cb + '({"error":"' + err.message + '"})')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
  }

  return ContentService
    .createTextOutput(cb + '({"error":"unknown action"})')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.openById(LEARNING_SPREADSHEET_ID);
    var date = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    var userName = data.userName || '익명';

    // 과정 중심 활동 저장
    if (data.type === 'perf') {
      var sh = getOrCreateSheet(ss, SHEET_PERF, ['날짜','학생명','학번','대단원','저장키','활동내용']);
      sh.appendRow([date, userName, data.studentId || '', data.unit || '',
                    data.saveKey || '', JSON.stringify(data.answers || {})]);
    }

    // 수행 활동 저장
    if (data.type === 'act') {
      var sh = getOrCreateSheet(ss, SHEET_ACTIVITY, ['날짜','학생명','학번','소단원키','소단원명','답변내용']);
      sh.appendRow([date, userName, data.studentId || '', data.lessonKey || '', data.lessonName || '',
                    JSON.stringify(data.answers || {})]);
    }

    // 자기 평가 저장
    if (data.type === 'sc') {
      var sh = getOrCreateSheet(ss, SHEET_SELFCHECK, ['날짜','학생명','학번','소단원키','소단원명','평가내용']);
      sh.appendRow([date, userName, data.studentId || '', data.lessonKey || '', data.lessonName || '',
                    JSON.stringify(data.answers || {})]);
    }

    // 완료 표시 저장
    if (data.type === 'done') {
      var sh = getOrCreateSheet(ss, SHEET_DONE, ['날짜','학생명','학번','대단원','소단원번호','소단원명']);
      sh.appendRow([date, userName, data.studentId || '', data.unit || '', data.lessonNum || '', data.lessonName || '']);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f9d58')
      .setFontColor('#ffffff');
  }
  return sh;
}
