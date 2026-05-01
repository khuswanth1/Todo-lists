package com.todo.app.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.todo.app.entity.Task;
import com.todo.app.service.TaskService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "*") //  better for testing (change in prod)
@Tag(name = "Task API", description = "Task management APIs")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    // ✅ CREATE
    @Operation(summary = "Create a new task")
    @PostMapping
    public Task create(@RequestBody Task t){
        return service.create(t);
    }

    // ✅ READ
    @Operation(summary = "Get all tasks for a user")
    @GetMapping
    public List<Task> get(@RequestParam Long userId){
        return service.get(userId);
    }

    // ✅ UPDATE
    @Operation(summary = "Update task by ID")
    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @RequestBody Task t){
        return service.update(id, t);
    }

    // ✅ DELETE
    @Operation(summary = "Delete task by ID")
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id){
        service.delete(id);
        return "Task deleted successfully";
    }
}