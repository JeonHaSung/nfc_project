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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;

@Entity
@Table(
        name = "redirectings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_redirectings_tag_type",
                columnNames = {"tag_id", "redirecting_type"}
        )
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

    @Enumerated(EnumType.STRING)
    @Column(name = "redirecting_type", nullable = false, length = 50)
    private RedirectingType redirectingType;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "count", nullable = false)
    private Long count = 0L;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint default 0")
    private boolean del = false;

    @Builder
    public RedirectingEntity(
            String tagId,
            RedirectingType redirectingType,
            String value,
            Long count
    ) {
        this.tagId = tagId;
        this.redirectingType = redirectingType;
        this.value = value;
        this.count = count != null ? count : 0L;
    }

    public void updateValue(String value) {
        this.value = value;
    }

    public void delete() {
        this.del = true;
    }
}
