package com.nfc_tag_service.global.config;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;
import tools.jackson.databind.ObjectMapper;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepository.setCookieName("XSRF-TOKEN");
        csrfRepository.setHeaderName("X-XSRF-TOKEN");
        csrfRepository.setCookiePath("/");
        CsrfTokenRequestAttributeHandler csrfRequestHandler =
                new CsrfTokenRequestAttributeHandler();
        csrfRequestHandler.setCsrfRequestAttributeName(null);

        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(csrfRequestHandler))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/management/auth/csrf",
                                "/management/auth/login",
                                "/management/auth/signup",
                                "/management/auth/email/**",
                                "/management/auth/recovery/**",
                                "/tag/open",
                                "/tag/not-ready",
                                "/tag/not-found",
                                "/onboarding/tag"
                        ).permitAll()
                        // SPA 온보딩 화면은 비로그인 접근 허용 (로그인/회원가입 UI)
                        .requestMatchers(HttpMethod.GET, "/onboarding", "/onboarding/complete").permitAll()
                        .requestMatchers(
                                "/management/admin/accounts",
                                "/management/admin/accounts/**",
                                "/management/tag/generate",
                                "/management/tag/factory-list",
                                "/management/tag/factory-progress",
                                "/management/tag/excel",
                                "/management/tag/excel-orders",
                                "/management/tag/excel-orders/**",
                                "/management/tag/del",
                                "/management/store/update",
                                "/management/store/del"
                        ).hasAuthority("ROLE_MASTER")
                        // 온보딩 API만 로그인 필요 (매장 등록/카드 연결)
                        .requestMatchers(
                                "/onboarding/my-stores",
                                "/onboarding/register-store",
                                "/onboarding/attach-card"
                        ).authenticated()
                        .requestMatchers("/management/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                writeError(response, ErrorCode.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, exception) ->
                                writeError(
                                        response,
                                        exception instanceof InvalidCsrfTokenException
                                                || exception instanceof MissingCsrfTokenException
                                                ? ErrorCode.INVALID_CSRF_TOKEN
                                                : ErrorCode.ACCESS_DENIED
                                )))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse response, ErrorCode error)
            throws java.io.IOException {
        response.setStatus(error.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(java.nio.charset.StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.fail(
                error.getHttpStatus().value(),
                error.getCode(),
                error.getMessage()
        ));
    }
}
