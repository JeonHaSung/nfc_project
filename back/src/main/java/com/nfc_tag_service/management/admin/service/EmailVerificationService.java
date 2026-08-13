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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    /** 인증 완료 후 회원가입 제출 가능 시간 */
    public static final Duration SIGNUP_VERIFIED_TTL = Duration.ofMinutes(30);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_WRONG_ATTEMPTS = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailVerificationRepository verificationRepository;
    private final AdminRepository adminRepository;
    private final AdminInputValidator inputValidator;
    private final PasswordEncoder passwordEncoder;
    private final ResendMailService mailService;

    @Transactional(readOnly = true)
    public void checkSignupEmailAvailable(String rawEmail) {
        String email = inputValidator.normalizeEmail(rawEmail);
        if (adminRepository.existsByEmailAndDelFalse(email)) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    @Transactional
    public void sendSignupCode(String rawEmail) {
        String email = inputValidator.normalizeEmail(rawEmail);
        if (adminRepository.existsByEmailAndDelFalse(email)) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }
        Instant now = Instant.now();
        verificationRepository
                .findFirstByEmailAndPurposeAndVerifiedAtIsNotNullAndConsumedAtIsNullOrderByCreatedAtDesc(
                        email,
                        EmailVerificationPurpose.SIGNUP
                )
                .filter(item -> item.getVerifiedAt().plus(SIGNUP_VERIFIED_TTL).isAfter(now))
                .ifPresent(item -> {
                    throw new CustomException(ErrorCode.SIGNUP_EMAIL_ALREADY_VERIFIED);
                });
        createAndSend(email, null, EmailVerificationPurpose.SIGNUP, true);
    }

    @Transactional
    public void sendFindIdCode(String rawEmail) {
        String email = inputValidator.normalizeEmail(rawEmail);
        boolean matched = adminRepository.existsByEmailAndDelFalse(email);
        createAndSend(email, null, EmailVerificationPurpose.FIND_ID, matched);
    }

    @Transactional
    public void sendResetPasswordCode(String rawLoginId, String rawEmail) {
        String loginId = inputValidator.normalizeLoginId(rawLoginId);
        String email = inputValidator.normalizeEmail(rawEmail);
        boolean matched = adminRepository.existsByLoginIdAndEmailAndDelFalse(loginId, email);
        createAndSend(email, loginId, EmailVerificationPurpose.RESET_PASSWORD, matched);
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = CustomException.class
    )
    public void verifySignupCode(String rawEmail, String code) {
        String email = inputValidator.normalizeEmail(rawEmail);
        EmailVerificationEntity verification = verificationRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                        email,
                        EmailVerificationPurpose.SIGNUP
                )
                .orElseThrow(() -> new CustomException(ErrorCode.EMAIL_VERIFICATION_INVALID));
        verifyCode(verification, code, false);
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = CustomException.class
    )
    public String verifyFindIdCode(String rawEmail, String code) {
        String email = inputValidator.normalizeEmail(rawEmail);
        EmailVerificationEntity verification = verificationRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                        email,
                        EmailVerificationPurpose.FIND_ID
                )
                .orElseThrow(() -> new CustomException(ErrorCode.EMAIL_VERIFICATION_INVALID));
        verifyCode(verification, code, true);
        if (!verification.isAccountMatched()) {
            throw new CustomException(ErrorCode.RECOVERY_ACCOUNT_NOT_FOUND);
        }
        return adminRepository.findFirstByEmailAndDelFalseOrderByIdAsc(email)
                .map(AdminEntity::getLoginId)
                .orElseThrow(() -> new CustomException(ErrorCode.RECOVERY_ACCOUNT_NOT_FOUND));
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = CustomException.class
    )
    public Long verifyResetPasswordCode(String rawLoginId, String rawEmail, String code) {
        String loginId = inputValidator.normalizeLoginId(rawLoginId);
        String email = inputValidator.normalizeEmail(rawEmail);
        EmailVerificationEntity verification = verificationRepository
                .findFirstByEmailAndSubjectLoginIdAndPurposeOrderByCreatedAtDesc(
                        email,
                        loginId,
                        EmailVerificationPurpose.RESET_PASSWORD
                )
                .orElseThrow(() -> new CustomException(ErrorCode.EMAIL_VERIFICATION_INVALID));
        verifyCode(verification, code, false);
        if (!verification.isAccountMatched()) {
            verification.consume(Instant.now());
            throw new CustomException(ErrorCode.RECOVERY_ACCOUNT_NOT_FOUND);
        }
        return verification.getId();
    }

    private void createAndSend(
            String email,
            String subjectLoginId,
            EmailVerificationPurpose purpose,
            boolean accountMatched
    ) {
        Instant now = Instant.now();
        latest(email, subjectLoginId, purpose).ifPresent(latest -> {
            if (latest.getCreatedAt().plus(RESEND_COOLDOWN).isAfter(now)) {
                throw new CustomException(ErrorCode.EMAIL_RESEND_COOLDOWN);
            }
        });

        String code = "%06d".formatted(SECURE_RANDOM.nextInt(1_000_000));
        verificationRepository.save(new EmailVerificationEntity(
                email,
                subjectLoginId,
                purpose,
                passwordEncoder.encode(code),
                now,
                now.plus(CODE_TTL),
                accountMatched
        ));
        // 계정 복구 요청은 존재하지 않는 주소에도 동일한 API 응답을 반환하되,
        // 실제 메일은 일치하는 계정에만 보내 Resend가 스팸 릴레이로 악용되지 않게 한다.
        if (purpose == EmailVerificationPurpose.SIGNUP || accountMatched) {
            mailService.sendVerificationCode(email, code);
        }
    }

    private Optional<EmailVerificationEntity> latest(
            String email,
            String subjectLoginId,
            EmailVerificationPurpose purpose
    ) {
        if (subjectLoginId == null) {
            return verificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                    email,
                    purpose
            );
        }
        return verificationRepository
                .findFirstByEmailAndSubjectLoginIdAndPurposeOrderByCreatedAtDesc(
                        email,
                        subjectLoginId,
                        purpose
                );
    }

    private void verifyCode(
            EmailVerificationEntity verification,
            String code,
            boolean consume
    ) {
        Instant now = Instant.now();
        if (verification.isConsumed()) {
            throw new CustomException(ErrorCode.EMAIL_VERIFICATION_CONSUMED);
        }
        if (verification.isExpired(now)) {
            throw new CustomException(ErrorCode.EMAIL_VERIFICATION_EXPIRED);
        }
        if (verification.getWrongAttempts() >= MAX_WRONG_ATTEMPTS) {
            throw new CustomException(ErrorCode.EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED);
        }
        if (code == null || !passwordEncoder.matches(code, verification.getCodeHash())) {
            verification.recordWrongAttempt();
            if (verification.getWrongAttempts() >= MAX_WRONG_ATTEMPTS) {
                throw new CustomException(ErrorCode.EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED);
            }
            throw new CustomException(ErrorCode.EMAIL_VERIFICATION_INVALID);
        }
        if (!verification.isVerified()) {
            verification.markVerified(now);
        }
        if (consume) {
            verification.consume(now);
        }
    }
}
