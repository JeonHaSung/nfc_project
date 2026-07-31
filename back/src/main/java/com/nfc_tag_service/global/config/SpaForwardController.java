package com.nfc_tag_service.global.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/company",
            "/products",
            "/guide",
            "/support",
            "/onboarding",
            "/onboarding/{*path}",
            "/tag/not-ready",
            "/tag/not-found",
            "/admin/login",
            "/admin/management",
            "/admin/management/{*path}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
