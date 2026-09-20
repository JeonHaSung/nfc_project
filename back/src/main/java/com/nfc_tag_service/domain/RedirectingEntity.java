package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;

@Entity
@Table(
        name = "redirectings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_redirectings_tag_type",
                        columnNames = {"tag_id", "redirecting_type"}
                ),
                @UniqueConstraint(
                        name = "uk_redirectings_tag_type_id",
                        columnNames = {"tag_id", "redirecting_type_id"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RedirectingEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "redirecting_id")
    private Long id;

    @Column(name = "tag_id", nullable = false, length = 100)
    private String tagId;

    /** 레거시 코드 컬럼. 신규 연동은 redirecting_type_id 를 사용한다. */
    @Column(name = "redirecting_type", nullable = false, length = 50)
    private String redirectingType;

    @Column(name = "redirecting_type_id")
    private Long redirectingTypeId;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "count", nullable = false)
    private Long count = 0L;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint")
    private boolean del = false;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_quick", columnDefinition = "smallint")
    private Boolean quick = Boolean.FALSE;

    @Builder
    public RedirectingEntity(
            String tagId,
            String redirectingType,
            Long redirectingTypeId,
            String value,
            Long count,
            Boolean quick
    ) {
        this.tagId = tagId;
        this.redirectingType = redirectingType;
        this.redirectingTypeId = redirectingTypeId;
        this.value = value;
        this.count = count != null ? count : 0L;
        this.quick = Boolean.TRUE.equals(quick);
    }

    public void updateValue(String value) {
        this.value = value;
    }

    public void updateQuick(boolean quick) {
        this.quick = quick;
    }

    public boolean isQuick() {
        return Boolean.TRUE.equals(quick);
    }

    public void delete() {
        this.del = true;
    }
}
