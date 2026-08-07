package com.nfc_tag_service;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("local")
class MasterSeedTest {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void seedMasterAccountIfMissing() {
        String loginId = "df";
        if (adminRepository.existsByLoginIdAndDelFalse(loginId)) {
            return;
        }
        adminRepository.save(new AdminEntity(
                loginId,
                "마스터",
                passwordEncoder.encode("df@df"),
                AdminRole.MASTER,
                "01000000000",
                "master@taplink.local",
                null
        ));
    }
}
