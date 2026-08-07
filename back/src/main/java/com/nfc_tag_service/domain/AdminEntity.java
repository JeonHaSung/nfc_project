package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "admins",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_admins_login_id", columnNames = "login_id"),
                @UniqueConstraint(name = "uk_admins_email", columnNames = "email")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, length = 100)
    private String loginId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 120)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private AdminRole role;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_suspended", columnDefinition = "smallint")
    private boolean suspended = false;

    @Column(name = "privacy_agreed_at")
    private LocalDateTime privacyAgreedAt;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint")
    private boolean del = false;

    public AdminEntity(String loginId, String name, String passwordHash, AdminRole role) {
        this(loginId, name, passwordHash, role, null, null, null);
    }

    public AdminEntity(
            String loginId,
            String name,
            String passwordHash,
            AdminRole role,
            String phone,
            String email,
            LocalDateTime privacyAgreedAt
    ) {
        this.loginId = loginId;
        this.name = name;
        this.passwordHash = passwordHash;
        this.role = role;
        this.phone = phone;
        this.email = email;
        this.privacyAgreedAt = privacyAgreedAt;
        this.suspended = false;
        this.del = false;
    }

    public void updateProfile(
            String loginId,
            String name,
            String phone,
            String email
    ) {
        this.loginId = loginId;
        this.name = name;
        this.phone = phone;
        this.email = email;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setSuspended(boolean suspended) {
        this.suspended = suspended;
    }

    /** 계정 삭제 시 개인정보 파기(마스킹) + 비활성화 */
    public void destroyPersonalData() {
        this.name = "삭제회원";
        this.phone = null;
        this.email = null;
        this.privacyAgreedAt = null;
        this.loginId = "deleted_" + this.id + "_" + System.currentTimeMillis();
        this.suspended = true;
        this.del = true;
        this.passwordHash = "{noop}DELETED";
    }
}
