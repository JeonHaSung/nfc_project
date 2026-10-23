package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "store_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreEventEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", length = 100, nullable = false)
    private String storeId;

    /** 이벤트 이름 (한국어, 필수) */
    @Column(name = "name", length = 80, nullable = false)
    private String name;

    @Column(name = "name_en", length = 80)
    private String nameEn;

    @Column(name = "name_ja", length = 80)
    private String nameJa;

    @Column(name = "name_zh", length = 80)
    private String nameZh;

    @Column(name = "name_fr", length = 80)
    private String nameFr;

    /** 손님용 메모 (한국어) */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "description_ja", columnDefinition = "TEXT")
    private String descriptionJa;

    @Column(name = "description_zh", columnDefinition = "TEXT")
    private String descriptionZh;

    @Column(name = "description_fr", columnDefinition = "TEXT")
    private String descriptionFr;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_enabled", columnDefinition = "smallint", nullable = false)
    private boolean enabled = false;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "no_time_limit", columnDefinition = "smallint", nullable = false)
    private boolean noTimeLimit = true;

    /** 태그 시 일부 정보를 노출할지 */
    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "show_on_review_relay", columnDefinition = "smallint", nullable = false)
    private boolean showOnReviewRelay = false;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<StoreEventItemEntity> items = new ArrayList<>();

    @Builder
    public StoreEventEntity(
            String storeId,
            String name,
            String nameEn,
            String nameJa,
            String nameZh,
            String nameFr,
            String description,
            String descriptionEn,
            String descriptionJa,
            String descriptionZh,
            String descriptionFr,
            boolean enabled,
            boolean noTimeLimit,
            boolean showOnReviewRelay,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        this.storeId = storeId;
        this.name = name;
        this.nameEn = nameEn;
        this.nameJa = nameJa;
        this.nameZh = nameZh;
        this.nameFr = nameFr;
        this.description = description;
        this.descriptionEn = descriptionEn;
        this.descriptionJa = descriptionJa;
        this.descriptionZh = descriptionZh;
        this.descriptionFr = descriptionFr;
        this.enabled = enabled;
        this.noTimeLimit = noTimeLimit;
        this.showOnReviewRelay = showOnReviewRelay;
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public void update(
            String name,
            String nameEn,
            String nameJa,
            String nameZh,
            String nameFr,
            String description,
            String descriptionEn,
            String descriptionJa,
            String descriptionZh,
            String descriptionFr,
            boolean enabled,
            boolean noTimeLimit,
            boolean showOnReviewRelay,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        this.name = name;
        this.nameEn = nameEn;
        this.nameJa = nameJa;
        this.nameZh = nameZh;
        this.nameFr = nameFr;
        this.description = description;
        this.descriptionEn = descriptionEn;
        this.descriptionJa = descriptionJa;
        this.descriptionZh = descriptionZh;
        this.descriptionFr = descriptionFr;
        this.enabled = enabled;
        this.noTimeLimit = noTimeLimit;
        this.showOnReviewRelay = showOnReviewRelay;
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void replaceItems(List<StoreEventItemEntity> nextItems) {
        this.items.clear();
        if (nextItems == null) {
            return;
        }
        for (StoreEventItemEntity item : nextItems) {
            item.attach(this);
            this.items.add(item);
        }
    }
}
