package com.todo.app.service;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.todo.app.entity.User;
import com.todo.app.repository.UserRepository;
import com.todo.app.util.JwtUtil;

import java.util.*;

@Service
public class AuthService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final EmailService emailService;
    private final FCMService fcmService;

    // 🔐 store reset tokens temporarily
    private Map<String, String> resetTokens = new HashMap<>();

    public AuthService(UserRepository repo,
            PasswordEncoder encoder,
            EmailService emailService,
            FCMService fcmService) {
        this.repo = repo;
        this.encoder = encoder;
        this.emailService = emailService;
        this.fcmService = fcmService;
    }

    // ✅ SIGNUP
    public String signup(User user, String confirmPassword) {
        if (!user.getPassword().equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        // check duplicate email
        if (repo.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // check duplicate username
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        user.setPassword(encoder.encode(user.getPassword()));

        if (user.getRole() == null) {
            user.setRole("USER");
        }

        repo.save(user);

        // ✅ Send Welcome & Initial Login Notification
        emailService.sendEmail(
            user.getEmail(), 
            "🚀 Welcome to Todo Pro", 
            "Hello " + user.getName() + ",\n\nYour account has been successfully created. You are now logged in and ready to initiate missions.\n\nStrategic success is expected."
        );
        
        fcmService.sendNotificationByEmail(
            user.getEmail(),
            "🚀 Welcome to Todo Pro!",
            "Account created. Session initiated. Good luck, Commander! 🫡",
            "https://cdn-icons-png.flaticon.com/512/1162/1162456.png",
            "http://localhost:5173/dashboard"
        );

        return com.todo.app.util.JwtUtil.generate(user.getEmail());
    }

    // ✅ LOGIN (email OR username)
    public String login(String identifier, String password) {
        String trimmedIdentifier = identifier != null ? identifier.trim().toLowerCase() : "";
        System.out.println("Login attempt for identifier: [" + trimmedIdentifier + "]");

        User user = repo.findByEmail(trimmedIdentifier)
                .or(() -> repo.findByUsername(identifier != null ? identifier.trim() : ""))
                .or(() -> repo.findByUsername(trimmedIdentifier))
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // ✅ Send Login Notification
        emailService.sendEmail(
            user.getEmail(), 
            "🔐 Security Alert: New Login", 
            "Hello " + user.getName() + ",\n\nWe detected a new login to your Todo Pro account. If this wasn't you, please secure your account immediately."
        );
        
        // ✅ Send Push Notification (Professional Rich Style)
        fcmService.sendNotificationByEmail(
            user.getEmail(), 
            "🔐 Security Alert: New Login", 
            "Hello " + user.getName() + ", we detected a new login to your dashboard. Tap to verify this session! 🛡️",
            "https://cdn-icons-png.flaticon.com/512/1162/1162456.png", // Security Shield Icon
            "http://localhost:5173/dashboard"
        );

        return JwtUtil.generate(user.getEmail());
    }

    // ✅ FORGOT PASSWORD
    public String forgot(String email) {

        repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate 6-digit numeric OTP
        StringBuilder otpBuilder = new StringBuilder();
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            otpBuilder.append(rnd.nextInt(10));
        }
        String token = otpBuilder.toString();

        resetTokens.put(token, email);

        emailService.sendEmail(email, "Password Reset OTP", "Your password reset OTP is:\n\n" + token + "\n\nPlease enter this OTP to proceed with resetting your password.");

        return "OTP sent to email";
    }

    // ✅ VERIFY OTP
    public String verifyOtp(String token) {
        if (!resetTokens.containsKey(token)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        return "Valid OTP";
    }

    // ✅ RESET PASSWORD
    public String reset(String token, String newPassword) {

        String email = resetTokens.get(token);

        if (email == null) {
            throw new RuntimeException("Invalid or expired token");
        }

        User user = repo.findByEmail(email).get();

        user.setPassword(encoder.encode(newPassword));
        repo.save(user);

        resetTokens.remove(token);

        return "Password reset successful";
    }

    public User getUserByEmail(String email) {
        return repo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(String email, User data) {
        User user = repo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        boolean significantChange = false;

        if (data.getName() != null && !data.getName().equals(user.getName())) {
            user.setName(data.getName());
            significantChange = true;
        }
        if (data.getMobile() != null && !data.getMobile().equals(user.getMobile())) {
            user.setMobile(data.getMobile());
            significantChange = true;
        }
        if (data.getAge() != null && !data.getAge().equals(user.getAge())) {
            user.setAge(data.getAge());
            significantChange = true;
        }
        if (data.getGender() != null && !data.getGender().equals(user.getGender())) {
            user.setGender(data.getGender());
            significantChange = true;
        }
        if (data.getDob() != null && !data.getDob().equals(user.getDob())) {
            user.setDob(data.getDob());
            significantChange = true;
        }
        if (data.getProfileImage() != null && !data.getProfileImage().equals(user.getProfileImage())) {
            user.setProfileImage(data.getProfileImage());
            significantChange = true;
        }
        
        if (data.getFcmToken() != null && !data.getFcmToken().equals(user.getFcmToken())) {
            user.setFcmToken(data.getFcmToken());
            // Send a test push only when the token actually CHANGES
            fcmService.sendNotificationByEmail(
                user.getEmail(), 
                "✅ Push Notifications Enabled", 
                "You will now receive mission updates on this device.",
                "https://cdn-icons-png.flaticon.com/512/190/190411.png",
                "http://localhost:5173/dashboard"
            );
        }

        User updatedUser = repo.save(user);

        // ✅ Notify user about profile update ONLY if significant fields were changed
        if (significantChange) {
            emailService.sendEmail(user.getEmail(), "Profile Updated Successfully", "Hello " + user.getName() + ",\n\nYour profile has been successfully updated on Todo App.");
        }

        return updatedUser;
    }
}