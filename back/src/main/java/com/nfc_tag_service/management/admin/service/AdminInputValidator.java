package com.nfc_tag_service.management.admin.service;

import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class AdminInputValidator {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s])\\S{10,64}$"
    );
    private static final Pattern PHONE_PATTERN = Pattern.compile("^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    public String normalizeLoginId(String loginId) {
        String normalized = loginId == null ? "" : loginId.trim();
        if (normalized.isEmpty() || normalized.length() > 100) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        return normalized;
    }

    public String normalizeName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.isEmpty() || normalized.length() > 100) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        return normalized;
    }

    public String normalizePhone(String phone) {
        String normalized = phone == null ? "" : phone.trim().replaceAll("\\s+", "");
        if (!PHONE_PATTERN.matcher(normalized).matches()) {
            throw new CustomException(ErrorCode.INVALID_PHONE);
        }
        return normalized.replace("-", "");
    }

    public String normalizeEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (normalized.isEmpty() || normalized.length() > 120 || !EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new CustomException(ErrorCode.INVALID_EMAIL);
        }
        return normalized;
    }

    public void validatePassword(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD_POLICY);
        }
    }

    public void requirePrivacyAgreed(Boolean privacyAgreed) {
        if (privacyAgreed == null || !privacyAgreed) {
            throw new CustomException(ErrorCode.PRIVACY_CONSENT_REQUIRED);
        }
    }
}
