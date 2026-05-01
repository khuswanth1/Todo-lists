
package com.todo.app.service;

import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final EmailService emailService;
    private final FCMService fcmService;

    public NotificationService(EmailService emailService, FCMService fcmService) {
        this.emailService = emailService;
        this.fcmService = fcmService;
    }

    public void email(String msg) {
        System.out.println("EMAIL: " + msg);
        emailService.sendEmail("khuswanthraojadav@gmail.com", "Notification", msg);
    }

    public void push(String email, String title, String body, String imageUrl, String link) {
        fcmService.sendNotificationByEmail(email, title, body, imageUrl, link);
    }

    public void sms(String msg) {
        System.out.println("SMS: " + msg);
    }
}
