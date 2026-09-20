package com.nfc_tag_service.management.redirecting;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(20)
@RequiredArgsConstructor
public class RedirectingTypeBootstrap implements ApplicationRunner {

    private final RedirectingTypeSeedService redirectingTypeSeedService;

    @Override
    public void run(ApplicationArguments args) {
        redirectingTypeSeedService.seedAndBackfill();
    }
}
