package com.nfc_tag_service.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TagExperienceTypeConverter
        implements AttributeConverter<TagExperienceType, String> {

    @Override
    public String convertToDatabaseColumn(TagExperienceType attribute) {
        return attribute == null
                ? TagExperienceType.STANDARD.name()
                : attribute.name();
    }

    @Override
    public TagExperienceType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return TagExperienceType.STANDARD;
        }
        String normalized = dbData.trim().toUpperCase();
        if ("SPECIAL".equals(normalized)) {
            return TagExperienceType.PREMIUM;
        }
        return TagExperienceType.valueOf(normalized);
    }
}
