package com.nfc_tag_service.global.type;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Arrays;

@Getter
@AllArgsConstructor
public enum TagCategory {

    QR("QR"),
    NFC("NFC");

    @JsonValue
    private final String name;

    public static String toCode(String inputName) {
        if (inputName == null) return null;

        return Arrays.stream(TagCategory.values())
                .filter(c -> c.getName().equalsIgnoreCase(inputName.trim())
                        || c.name().equalsIgnoreCase(inputName.trim()))
                .findFirst()
                .map(TagCategory::name)
                .orElse(null);
    }
}