package com.todo.app.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OTPService {

    private final EmailService emailService;
    private final Map<String, String> otpStore = new HashMap<>();

    public OTPService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void send(String email) {
        String otp = generateOTP();

        otpStore.put(email, otp);

        emailService.sendOTP(email, otp);
    }

    public boolean verify(String email, String otp) {
        String stored = otpStore.get(email);

        if (stored != null && stored.equals(otp)) {
            otpStore.remove(email);
            return true;
        }

        return false;
    }

    private String generateOTP() {
        Random r = new Random();
        return String.valueOf(100000 + r.nextInt(900000)); // 6-digit
    }
}