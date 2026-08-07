package com.nfc_tag_service.management.admin.repository;

import com.nfc_tag_service.domain.EmailVerificationEntity;
import com.nfc_tag_service.domain.EmailVerificationPurpose;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerificationEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailVerificationEntity> findFirstByEmailAndPurposeOrderByCreatedAtDesc(
            String email,
            EmailVerificationPurpose purpose
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailVerificationEntity> findFirstByEmailAndSubjectLoginIdAndPurposeOrderByCreatedAtDesc(
            String email,
            String subjectLoginId,
            EmailVerificationPurpose purpose
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailVerificationEntity>
    findFirstByEmailAndPurposeAndVerifiedAtIsNotNullAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email,
            EmailVerificationPurpose purpose
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailVerificationEntity> findByIdAndConsumedAtIsNull(Long id);
}
