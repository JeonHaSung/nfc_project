package com.nfc_tag_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
        name = "email_verifications",
        indexes = {
                @Index(
                        name = "idx_email_verification_lookup",
                        columnList = "email,purpose,created_at"
                ),
                @Index(
                        name = "idx_email_verification_reset_lookup",
                        columnList = "email,subject_login_id,purpose,created_at"
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailVerificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 120)
    private String email;

    @Column(name = "subject_login_id", length = 100)
    private String subjectLoginId;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 30)
    private EmailVerificationPurpose purpose;

    @Column(name = "code_hash", nullable = false, length = 100)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "wrong_attempts", nullable = false)
    private int wrongAttempts;

    @Column(name = "account_matched", nullable = false)
    private boolean accountMatched;

    public EmailVerificationEntity(
            String email,
            String subjectLoginId,
            EmailVerificationPurpose purpose,
            String codeHash,
            Instant createdAt,
            Instant expiresAt,
            boolean accountMatched
    ) {
        this.email = email;
        this.subjectLoginId = subjectLoginId;
        this.purpose = purpose;
        this.codeHash = codeHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.accountMatched = accountMatched;
    }

    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }

    public boolean isVerified() {
        return verifiedAt != null;
    }

    public boolean isConsumed() {
        return consumedAt != null;
    }

    public void recordWrongAttempt() {
        wrongAttempts++;
    }

    public void markVerified(Instant now) {
        verifiedAt = now;
    }

    public void consume(Instant now) {
        consumedAt = now;
    }
}
