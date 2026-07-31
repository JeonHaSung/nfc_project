package com.nfc_tag_service.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {


    A_B("", "", HttpStatus.NOT_FOUND),
    C_D("", "", HttpStatus.BAD_REQUEST), // 400
    E_F("", "", HttpStatus.FORBIDDEN), // 403

    INVALID_STORE_INPUT("S2", "매장 등록 정보가 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    INVALID_TAG_INPUT("T2", "태그 등록 정보가 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    INVALID_INPUT("A001", "요청 값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD_POLICY("A002", "비밀번호는 10~64자이며 대문자, 소문자, 숫자, 특수문자를 각각 포함해야 합니다.", HttpStatus.BAD_REQUEST),
    DUPLICATE_LOGIN_ID("A003", "이미 사용 중인 아이디입니다.", HttpStatus.CONFLICT),
    CURRENT_PASSWORD_MISMATCH("A004", "현재 비밀번호가 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS("A005", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED("A006", "인증이 필요합니다.", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("A007", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
    INVALID_CSRF_TOKEN("A012", "보안 토큰이 만료되었습니다. 페이지를 새로고침해 주세요.", HttpStatus.FORBIDDEN),
    ADMIN_NOT_FOUND("A008", "관리자 계정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    MASTER_ACCOUNT_PROTECTED("A009", "MASTER 계정은 수정하거나 삭제할 수 없습니다.", HttpStatus.FORBIDDEN),
    ACCOUNT_SUSPENDED("A010", "사용 정지된 계정입니다.", HttpStatus.FORBIDDEN),
    PRIVACY_CONSENT_REQUIRED("A011", "개인정보 수집·이용에 동의해야 가입할 수 있습니다.", HttpStatus.BAD_REQUEST),
    INVALID_PHONE("A013", "휴대폰 번호 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL("A014", "이메일 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    TAG_NOT_READY("T4", "아직 공장 발주되지 않은 태그입니다.", HttpStatus.BAD_REQUEST),
    TAG_ALREADY_ASSIGNED("T5", "이미 매장에 등록된 태그입니다.", HttpStatus.CONFLICT),
    TAG_INVALID_STATUS("T6", "태그 상태가 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    STORAGE_UPLOAD_FAILED("F1", "엑셀 파일 저장에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    EXCEL_ORDER_NOT_FOUND("F2", "발주 엑셀 파일을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    //------
    STORE_ID_NOTFOUND("S1", "스토어ID를 찾을 수 없음", HttpStatus.NOT_FOUND),
    TAG_ID_NOTFOUND("T1", "태그ID를 찾을 수 없음", HttpStatus.NOT_FOUND),
    //이외오류
    INTERNAL_SERVER_ERROR("S001", "서버 내부 오류가 발생했습니다. 불편을 드려서 죄송합니다.", HttpStatus.INTERNAL_SERVER_ERROR),

    TAG_UPDATE_ERROR("T3", "수정사항이 없습니다.", HttpStatus.BAD_REQUEST);
    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return this.code;
    }

    public String getMessage() {
        return this.message;
    }

    public HttpStatus getHttpStatus() {
        return this.httpStatus;
    }

}
