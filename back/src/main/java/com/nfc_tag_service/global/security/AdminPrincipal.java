package com.nfc_tag_service.global.security;

import com.nfc_tag_service.domain.AdminRole;

public record AdminPrincipal(Long id, AdminRole role) {
}
