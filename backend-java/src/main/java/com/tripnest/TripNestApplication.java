package com.tripnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * TripNest Enterprise Java Backend Application
 * Provides RESTful endpoints for Trip creation, deletion, retrieval, and status management.
 */
@SpringBootApplication
public class TripNestApplication {

    public static void main(String[] args) {
        SpringApplication.run(TripNestApplication.class, args);
        System.out.println("🚀 TripNest Java Backend is running on port 8080!");
    }

    /**
     * Configure Global CORS to allow seamless communication with the React frontend
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
