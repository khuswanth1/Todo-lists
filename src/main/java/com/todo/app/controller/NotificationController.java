package com.todo.app.controller;

import org.springframework.web.bind.annotation.*;
import com.todo.app.service.NotificationService;

@RestController
@RequestMapping("/notify")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notify;

    public NotificationController(NotificationService notify) {
        this.notify = notify;
    }

    // ✅ Manual trigger API
    @GetMapping("/test")
    public String test(){
        notify.email("Reminder running...");
        notify.push("khuswanthraojadav@gmail.com", "System Test", "This is a manual trigger test notification.", "https://cdn-icons-png.flaticon.com/512/190/190411.png", "http://localhost:5173/dashboard");
        return "Notification sent (Email & Push)";
    }
}