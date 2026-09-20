package com.nfc_tag_service.management.redirecting;

import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class RedirectingLocales {

    public static final String KO = "ko";
    public static final String EN = "en";
    public static final String JA = "ja";
    public static final String ZH = "zh";
    public static final String FR = "fr";
    public static final List<String> ALL = List.of(KO, EN, JA, ZH, FR);

    private RedirectingLocales() {
    }

    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return KO;
        }
        String locale = raw.trim().toLowerCase(Locale.ROOT);
        int dash = locale.indexOf('-');
        if (dash > 0) {
            locale = locale.substring(0, dash);
        }
        return ALL.contains(locale) ? locale : KO;
    }

    public static String pick(Map<String, String> labels, String locale) {
        if (labels == null || labels.isEmpty()) {
            return "";
        }
        String wanted = labels.get(normalize(locale));
        if (StringUtils.hasText(wanted)) {
            return wanted.trim();
        }
        String korean = labels.get(KO);
        if (StringUtils.hasText(korean)) {
            return korean.trim();
        }
        return labels.values().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .findFirst()
                .orElse("");
    }

    public static Map<String, String> copy(Map<String, String> labels) {
        Map<String, String> copied = new LinkedHashMap<>();
        if (labels == null) {
            return copied;
        }
        for (String locale : ALL) {
            String value = labels.get(locale);
            if (StringUtils.hasText(value)) {
                copied.put(locale, value.trim());
            }
        }
        return copied;
    }
}
