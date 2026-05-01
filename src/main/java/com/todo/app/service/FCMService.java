package com.todo.app.service;

import com.google.firebase.messaging.*;
import com.todo.app.entity.User;
import com.todo.app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class FCMService {

    private final UserRepository userRepository;

    public FCMService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void sendNotificationByEmail(String email, String title, String body, String imageUrl, String link) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String fcmToken = user.getFcmToken();

            if (fcmToken != null && !fcmToken.isEmpty()) {
                sendPushNotification(fcmToken, title, body, imageUrl, link);
            } else {
                System.out.println("⚠️ No FCM token found for user: " + email);
            }
        } else {
            System.out.println("❌ User not found with email: " + email);
        }
    }

    private void sendPushNotification(String token, String title, String body, String imageUrl, String link) {
        try {
            // Default App Icon (Professional Checkmark/Logo)
            String appIcon = "https://cdn-icons-png.flaticon.com/512/906/906334.png"; 

            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .setImage(imageUrl)
                    .build();

            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(notification)
                    .putData("url", link != null ? link : "")
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .setClickAction(link)
                                    .setColor("#4F46E5")
                                    .setTag("todo_update")
                                    .build())
                            .build())
                    .setWebpushConfig(WebpushConfig.builder()
                            .putHeader("Urgency", "high")
                            .setNotification(WebpushNotification.builder()
                                    .setIcon(appIcon)
                                    .setBadge(appIcon)
                                    .setVibrate(new int[]{200, 100, 200})
                                    .setTag("todo_update")
                                    .setRenotify(true)
                                    .build())
                            .setFcmOptions(WebpushFcmOptions.builder()
                                    .setLink(link != null ? link : "http://localhost:5173/dashboard")
                                    .build())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("✅ Successfully sent Rich FCM message: " + response);
        } catch (Exception e) {
            System.err.println("❌ Error sending Rich FCM push notification: " + e.getMessage());
        }
    }
}
