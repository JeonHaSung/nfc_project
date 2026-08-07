package com.nfc_tag_service.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

class EmailVerificationEntityTest {

    @Test
    void verificationTracksExpiryAttemptsAndOneTimeConsumption() {
        Instant createdAt = Instant.parse("2026-08-07T12:00:00Z");
        EmailVerificationEntity verification = new EmailVerificationEntity(
                "partner@example.com",
                null,
                EmailVerificationPurpose.SIGNUP,
                "hashed-code",
                createdAt,
                createdAt.plusSeconds(600),
                true
        );

        assertFalse(verification.isExpired(createdAt.plusSeconds(599)));
        assertTrue(verification.isExpired(createdAt.plusSeconds(600)));
        assertFalse(verification.isVerified());
        assertFalse(verification.isConsumed());

        verification.recordWrongAttempt();
        verification.recordWrongAttempt();
        assertEquals(2, verification.getWrongAttempts());

        verification.markVerified(createdAt.plusSeconds(30));
        verification.consume(createdAt.plusSeconds(40));
        assertTrue(verification.isVerified());
        assertTrue(verification.isConsumed());
    }
}
