package com.nfc_tag_service.management.tag.dto;

public record TagOpenResult(TagOpenAction action, String location) {
    public enum TagOpenAction {
        REDIRECT,
        ONBOARDING,
        NOT_READY,
        NOT_FOUND
    }

    public static TagOpenResult redirect(String url) {
        return new TagOpenResult(TagOpenAction.REDIRECT, url);
    }

    public static TagOpenResult onboarding(String url) {
        return new TagOpenResult(TagOpenAction.ONBOARDING, url);
    }

    public static TagOpenResult notReady(String url) {
        return new TagOpenResult(TagOpenAction.NOT_READY, url);
    }

    public static TagOpenResult notFound(String url) {
        return new TagOpenResult(TagOpenAction.NOT_FOUND, url);
    }
}
