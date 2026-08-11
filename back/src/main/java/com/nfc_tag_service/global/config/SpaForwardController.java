package com.nfc_tag_service.global.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @Value("${app.spa-origin:${app.server-domain}}")
    private String spaOrigin;

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
    public String forward(HttpServletRequest request) {
        if (new ClassPathResource("static/index.html").exists()) {
            return "forward:/index.html";
        }

        // local 등 JAR에 SPA가 없을 때 Vite(프론트) 주소로 넘김
        if (StringUtils.hasText(spaOrigin)) {
            String query = request.getQueryString();
            String target = trimTrailingSlash(spaOrigin)
                    + request.getRequestURI()
                    + (StringUtils.hasText(query) ? "?" + query : "");
            return "redirect:" + target;
        }

        return "forward:/index.html";
    }

    private static String trimTrailingSlash(String value) {
        if (value.endsWith("/")) {
            return value.substring(0, value.length() - 1);
        }
        return value;
    }
}
