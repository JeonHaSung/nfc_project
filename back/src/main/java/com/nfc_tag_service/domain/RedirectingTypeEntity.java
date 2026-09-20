package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "redirecting_types")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RedirectingTypeEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "redirecting_type_id")
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "color", nullable = false, length = 20)
    private String color;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "redirecting_type_i18n",
            joinColumns = @JoinColumn(name = "type_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_redirecting_type_i18n",
                    columnNames = {"type_id", "locale"}
            )
    )
    @MapKeyColumn(name = "locale", length = 8)
    @Column(name = "label", nullable = false, length = 200)
    private Map<String, String> labels = new LinkedHashMap<>();

    public static RedirectingTypeEntity create(String code, String color, int sortOrder, Map<String, String> labels) {
        RedirectingTypeEntity entity = new RedirectingTypeEntity();
        entity.code = code;
        entity.color = color;
        entity.sortOrder = sortOrder;
        entity.replaceLabels(labels);
        return entity;
    }

    public void update(String color, int sortOrder, Map<String, String> labels) {
        this.color = color;
        this.sortOrder = sortOrder;
        replaceLabels(labels);
    }

    private void replaceLabels(Map<String, String> labels) {
        this.labels.clear();
        if (labels != null) {
            this.labels.putAll(labels);
        }
    }
}
