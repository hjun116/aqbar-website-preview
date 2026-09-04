/**
 * AQbar 문의 폼 → Google 스프레드시트 연동 + 이메일 알림
 *
 * 설정 방법:
 * 1. Google 스프레드시트를 새로 만듭니다.
 * 2. 첫 번째 시트 이름을 "문의"로 바꿉니다.
 * 3. 확장 프로그램 → Apps Script 를 열고 이 파일 내용을 붙여넣습니다.
 * 4. MY_EMAIL을 알림 받을 본인 이메일로 변경합니다.
 * 5. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 * 6. 배포 후 나온 웹 앱 URL을 contact-config.js 의 webAppUrl 에 넣습니다.
 * 7. 코드를 수정한 뒤에는 배포 → 배포 관리 → 연필 아이콘 → 새 버전으로
 *    다시 배포해야 실제로 반영됩니다.
 */

var SHEET_NAME = '문의';
// 👇 알림을 받을 본인의 이메일 주소로 반드시 변경해 주세요!
var MY_EMAIL = 'stella@aqbar.ai';

function doPost(e) {
  try {
    var sheet = getOrCreateSheet_();
    var data = JSON.parse(e.postData.contents);
    var inquiryType = data.inquiryType === 'hiring' ? '채용 평가 문의' : '조직 진단 문의';
    var sourceEnv = data.source === 'mobile' ? '모바일' : '데스크톱';

    // 1. 스프레드시트에 데이터 기록
    sheet.appendRow([
      new Date(),
      inquiryType,
      data.name || '',
      data.email || '',
      data.company || '',
      sourceEnv
    ]);

    // 2. 이메일 알림 발송
    var subject = "🚨 [새로운 홈페이지 문의 접수] " + (data.company || '회사명 미상') + " - " + inquiryType;

    var message = "홈페이지를 통해 새로운 문의가 접수되었습니다.\n\n" +
                  "📌 문의 유형: " + inquiryType + "\n" +
                  "🏢 회 사 명: " + (data.company || '미입력') + "\n" +
                  "👤 담 당 자: " + (data.name || '미입력') + "\n" +
                  "📧 이 메 일: " + (data.email || '미입력') + "\n" +
                  "💻 접속 환경: " + sourceEnv + "\n\n" +
                  "👇 아래 링크를 눌러 스프레드시트에서 전체 내용을 확인하세요.\n" +
                  SpreadsheetApp.getActiveSpreadsheet().getUrl();

    MailApp.sendEmail(MY_EMAIL, subject, message);

    return jsonResponse_({ status: 'success' });
  } catch (error) {
    return jsonResponse_({ status: 'error', message: String(error) });
  }
}

function doGet() {
  return jsonResponse_({ status: 'ok' });
}

function getOrCreateSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(['접수일시', '문의 유형', '담당자 이름', '회사 이메일', '회사명', '접속 환경']);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function testEmail() {
  MailApp.sendEmail(MY_EMAIL, '알림 테스트', '이메일 알림 테스트입니다.');
}
