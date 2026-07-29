package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "tags")
@NoArgsConstructor
@Getter
public class TagEntity extends BaseTimeEntity implements Persistable<String> {

    @Id
    @Column(name = "tag_id", length = 20, nullable = false)
    private String id;

    @Column(name = "store_id", length = 20, nullable = false)
    private String storeId;

    @Column(name = "category", length = 30, nullable = false)
    private String category;

    @Column(name = "nickname", length = 30)
    private String nickname;

    @Column(name = "tag_url", columnDefinition = "TEXT", nullable = false)
    private String tagUrl;

    @Column(name = "hit_count", nullable = false)
    private Long hitCount = 0L;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_used", columnDefinition = "smallint")
    private boolean isUsed = true;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint")
    private boolean del = false;

    public void delete() {
        this.del = true;
    }

    @Builder
    public TagEntity(String id, String storeId, String category,
                     String nickname,String tagUrl,
                     Boolean isUsed, Long hitCount) {
        this.id = id;
        this.storeId = storeId;
        this.category = category;
        this.nickname = nickname;
        this.tagUrl = tagUrl;
        this.isUsed = (isUsed != null) ? isUsed : true;
        this.hitCount = (hitCount != null) ? hitCount : 0L;
    }

    public void updateTag(String nickname, boolean isUsed) {
        this.nickname = nickname;
        this.isUsed = isUsed;
    }

    // 카운트 1 증가 메서드
    public void incrementHitCount() {
        if (this.hitCount == null) {
            this.hitCount = 0L;
        }
        this.hitCount += 1;
    }

    // ==========================================
    // Persistable 구현
    // ==========================================

    @Transient
    private boolean isNewFlag = true;

    @Override
    public String getId() {
        return this.id;
    }

    @Override
    public boolean isNew() {
        return this.isNewFlag;
    }

    @PostPersist
    public void markNotNew() {
        this.isNewFlag = false;
    }
    // ==========================================
}