package com.todo.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Backend is running! Visit http://localhost:5173 for the frontend.";
    }

    @GetMapping("/favicon.ico")
    public void favicon() {
        // Empty response to stop 404
    }
}
