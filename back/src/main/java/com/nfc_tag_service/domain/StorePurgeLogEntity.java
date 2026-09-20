package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "store_purge_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StorePurgeLogEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_purge_log_id")
    private Long id;

    @Column(name = "actor_name", nullable = false, length = 100)
    private String actorName;

    @Column(name = "actor_email", length = 120)
    private String actorEmail;

    @Column(name = "actor_phone", length = 20)
    private String actorPhone;

    @Column(name = "store_name", nullable = false, length = 200)
    private String storeName;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    public StorePurgeLogEntity(
            String actorName,
            String actorEmail,
            String actorPhone,
            String storeName,
            String reason
    ) {
        this.actorName = actorName;
        this.actorEmail = actorEmail;
        this.actorPhone = actorPhone;
        this.storeName = storeName;
        this.reason = reason;
    }
}
