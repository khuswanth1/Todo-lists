package com.todo.app.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                if (resource.exists()) {
                    InputStream serviceAccount = resource.getInputStream();
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .build();

                    FirebaseApp.initializeApp(options);
                    System.out.println("✅ Firebase initialized successfully");
                } else {
                    System.err.println("⚠️ Firebase service account file not found in resources.");
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Firebase Admin initialization failed: " + e.getMessage());
            System.err.println("Note: Push notifications will be disabled. Please ensure firebase-service-account.json is valid.");
        }
    }
}
