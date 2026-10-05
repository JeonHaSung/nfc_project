package com.nfc_tag_service.management.dashBoard;

public final class HitTimeFormat {

    private HitTimeFormat() {
    }

    public static String hourLabel(Integer hour) {
        if (hour == null || hour < 0 || hour > 23) {
            return null;
        }
        return String.format("%02d:00", hour);
    }

    public static String weekdayStem(String dayOfWeek) {
        if (dayOfWeek == null || dayOfWeek.isBlank()) {
            return null;
        }
        String value = dayOfWeek.trim();
        return value.endsWith("요일") ? value.substring(0, value.length() - 2) : value;
    }
}
