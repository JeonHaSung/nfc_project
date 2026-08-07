package com.nfc_tag_service.management.admin.service;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.EmailVerificationEntity;
import com.nfc_tag_service.domain.EmailVerificationPurpose;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import com.nfc_tag_service.management.admin.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminRecoveryService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String DIGITS = "23456789";
    private static final String SPECIAL = "!@#$%^&*";
    private static final String ALL = LOWER + UPPER + DIGITS + SPECIAL;

    private final EmailVerificationService verificationService;
    private final EmailVerificationRepository verificationRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResendMailService mailService;
    private final AdminInputValidator inputValidator;

    public void sendResetPasswordCode(String loginId, String email) {
        verificationService.sendResetPasswordCode(loginId, email);
    }

    @Transactional
    public void resetPassword(String rawLoginId, String rawEmail, String code) {
        String loginId = inputValidator.normalizeLoginId(rawLoginId);
        String email = inputValidator.normalizeEmail(rawEmail);
        Long verificationId = verificationService.verifyResetPasswordCode(loginId, email, code);
        EmailVerificationEntity verification = verificationRepository
                .findByIdAndConsumedAtIsNull(verificationId)
                .filter(item -> item.getPurpose() == EmailVerificationPurpose.RESET_PASSWORD)
                .filter(EmailVerificationEntity::isVerified)
                .filter(EmailVerificationEntity::isAccountMatched)
                .filter(item -> !item.isExpired(Instant.now()))
                .filter(item -> email.equals(item.getEmail()))
                .filter(item -> loginId.equals(item.getSubjectLoginId()))
                .orElseThrow(() -> new CustomException(ErrorCode.EMAIL_VERIFICATION_INVALID));
        AdminEntity admin = adminRepository.findByLoginIdAndEmailAndDelFalse(loginId, email)
                .orElseThrow(() -> new CustomException(ErrorCode.RECOVERY_ACCOUNT_NOT_FOUND));

        String temporaryPassword = generateTemporaryPassword();
        inputValidator.validatePassword(temporaryPassword);
        admin.changePassword(passwordEncoder.encode(temporaryPassword));
        mailService.sendTemporaryPassword(email, temporaryPassword);
        verification.consume(Instant.now());
    }

    private String generateTemporaryPassword() {
        char[] password = new char[16];
        password[0] = randomChar(LOWER);
        password[1] = randomChar(UPPER);
        password[2] = randomChar(DIGITS);
        password[3] = randomChar(SPECIAL);
        for (int i = 4; i < password.length; i++) {
            password[i] = randomChar(ALL);
        }
        for (int i = password.length - 1; i > 0; i--) {
            int swapIndex = SECURE_RANDOM.nextInt(i + 1);
            char value = password[i];
            password[i] = password[swapIndex];
            password[swapIndex] = value;
        }
        return new String(password);
    }

    private char randomChar(String characters) {
        return characters.charAt(SECURE_RANDOM.nextInt(characters.length()));
    }
}
