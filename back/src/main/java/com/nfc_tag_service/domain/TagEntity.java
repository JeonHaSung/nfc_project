package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
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

    @Column(name = "store_id", length = 20)
    private String storeId;

    @Column(name = "category", length = 30, nullable = false)
    private String category;

    @Column(name = "nickname", length = 30)
    private String nickname;

    @Column(name = "tag_url", columnDefinition = "TEXT", nullable = false)
    private String tagUrl;

    @Column(name = "hit_count", nullable = false)
    private Long hitCount = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TagStatus status = TagStatus.CREATED;

    @Column(name = "factory_order_seq")
    private Long factoryOrderSeq;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint")
    private boolean del = false;

    public void delete() {
        this.del = true;
    }

    @Builder
    public TagEntity(
            String id,
            String storeId,
            String category,
            String nickname,
            String tagUrl,
            TagStatus status,
            Long hitCount,
            Long factoryOrderSeq
    ) {
        this.id = id;
        this.storeId = storeId;
        this.category = category;
        this.nickname = nickname;
        this.tagUrl = tagUrl;
        this.status = status != null ? status : TagStatus.CREATED;
        this.hitCount = hitCount != null ? hitCount : 0L;
        this.factoryOrderSeq = factoryOrderSeq;
    }

    public void markFactoryOrdered(long orderSeq) {
        this.status = TagStatus.FACTORY_ORDERED;
        this.factoryOrderSeq = orderSeq;
    }

    public void assignToStore(String storeId, String nickname) {
        this.storeId = storeId;
        this.nickname = nickname;
        this.status = TagStatus.ASSIGNED;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void incrementHitCount() {
        if (this.hitCount == null) {
            this.hitCount = 0L;
        }
        this.hitCount += 1;
    }

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
}
