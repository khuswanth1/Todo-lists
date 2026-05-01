package com.todo.app.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("📧 EmailService initialized with sender: " + fromEmail);
    }

    @Async
    public void sendOTP(String toEmail, String otp) {
        sendEmail(toEmail, "Your OTP Code", "Your OTP is: " + otp);
    }

    @Async
    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            System.err.println("⚠️ Skipping email: Recipient address is null or empty.");
            return;
        }

        try {
            System.out.println("📤 Attempting to send email to: " + to + " (Subject: " + subject + ")");
            MimeMessage message = mailSender.createMimeMessage();
            // Use false for non-multipart to avoid overhead
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("❌ FAILED to send email to: " + to);
            System.err.println("Error Type: " + e.getClass().getSimpleName());
            System.err.println("Error Message: " + e.getMessage());
        }
    }
}