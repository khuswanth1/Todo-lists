package com.todo.app.controller;

import org.springframework.web.bind.annotation.*;
import com.todo.app.entity.User;
import com.todo.app.service.AuthService;
import com.todo.app.service.EmailService;
import com.todo.app.service.FCMService;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService service;
    private final EmailService emailService;
    private final FCMService fcmService;

    public AuthController(AuthService service, EmailService emailService, FCMService fcmService) {
        this.service = service;
        this.emailService = emailService;
        this.fcmService = fcmService;
    }

    // ✅ SIGNUP
    @PostMapping("/signup")
    public String signup(@RequestBody SignupRequest request) {
        return service.signup(request.getUser(), request.getConfirmPassword());
    }

    public static class SignupRequest {
        private User user;
        private String confirmPassword;

        public User getUser() {
            return user;
        }

        public void setUser(User user) {
            this.user = user;
        }

        public String getConfirmPassword() {
            return confirmPassword;
        }

        public void setConfirmPassword(String confirmPassword) {
            this.confirmPassword = confirmPassword;
        }
    }

    // ✅ LOGIN (email OR username)
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return service.login(request.getIdentifier(), request.getPassword());
    }

    public static class LoginRequest {
        private String identifier;
        private String password;

        public LoginRequest() {}

        public String getIdentifier() {
            return identifier;
        }

        public void setIdentifier(String identifier) {
            this.identifier = identifier;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    // ✅ FORGOT PASSWORD
    @PostMapping("/forgot")
    public String forgot(@RequestBody Map<String, String> body) {
        return service.forgot(body.get("email"));
    }

    // ✅ VERIFY OTP
    @PostMapping("/verify-otp")
    public String verifyOtp(@RequestBody Map<String, String> body) {
        return service.verifyOtp(body.get("otp"));
    }

    // ✅ RESET PASSWORD
    @PostMapping("/reset")
    public String reset(@RequestBody Map<String, String> body) {
        return service.reset(body.get("token"), body.get("newPassword"));
    }

    // ✅ GET USER PROFILE
    @GetMapping("/profile")
    public User getProfile(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        String email = com.todo.app.util.JwtUtil.validate(token.replace("Bearer ", ""));
        return service.getUserByEmail(email);
    }

    // ✅ UPDATE USER PROFILE
    @PostMapping("/update-profile")
    public User updateProfile(@RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody User profileData) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        String email = com.todo.app.util.JwtUtil.validate(token.replace("Bearer ", ""));
        return service.updateProfile(email, profileData);
    }

    // ✅ SEND EMAIL NOTIFICATION
    @PostMapping("/send-email")
    public String sendEmail(@RequestBody Map<String, String> body) {
        emailService.sendEmail(
                body.get("to"),
                body.get("subject"),
                body.get("message"));
        return "Email sent successfully";
    }

    // ✅ SEND PUSH NOTIFICATION
    @PostMapping("/send-push")
    public String sendPush(@RequestBody Map<String, String> body) {
        fcmService.sendNotificationByEmail(
                body.get("email"),
                body.get("title"),
                body.get("message"),
                body.get("image"),
                body.get("link"));
        return "Push sent successfully";
    }
}