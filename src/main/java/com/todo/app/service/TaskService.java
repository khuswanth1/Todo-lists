package com.todo.app.service;

import org.springframework.stereotype.Service;
import java.util.List;

import com.todo.app.entity.Task;
import com.todo.app.repository.TaskRepository;

@Service
public class TaskService {

    private final TaskRepository repo;
    private final com.todo.app.repository.UserRepository userRepository;
    private final EmailService emailService;

    public TaskService(TaskRepository repo, com.todo.app.repository.UserRepository userRepository, EmailService emailService) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public Task create(Task t) {
        if (t.getTitle() == null || t.getTitle().isBlank()) {
            throw new RuntimeException("Task title cannot be empty");
        }

        if (t.getStatus() == null) {
            t.setStatus("TODO");
        }

        Task savedTask = repo.save(t);

        // ✅ Notify User about newly added task (ON CREATE)
        if (savedTask.getUserId() != null) {
            userRepository.findById(savedTask.getUserId()).ifPresent(user -> {
                emailService.sendEmail(
                    user.getEmail(),
                    "🚀 Mission Initiated: " + savedTask.getTitle(),
                    "Hello " + user.getName() + ",\n\nA new mission has been added to your log: \"" + savedTask.getTitle() + "\".\n\nStrategic success is expected. Go get 'em! 🎯"
                );
            });
        }

        return savedTask;
    }

    public List<Task> get(Long userId) {
        return repo.findByUserId(userId);
    }

    public Task update(Long id, Task updatedTask) {
        Task task = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String oldStatus = task.getStatus();

        if (updatedTask.getTitle() != null) task.setTitle(updatedTask.getTitle());
        if (updatedTask.getDescription() != null) task.setDescription(updatedTask.getDescription());
        if (updatedTask.getDueTime() != null) task.setDueTime(updatedTask.getDueTime());
        if (updatedTask.getStatus() != null) task.setStatus(updatedTask.getStatus());
        if (updatedTask.getPriority() != null) task.setPriority(updatedTask.getPriority());
        if (updatedTask.getParentTaskId() != null) task.setParentTaskId(updatedTask.getParentTaskId());

        Task savedTask = repo.save(task);
        boolean statusChangedToDone = "DONE".equals(savedTask.getStatus()) && !"DONE".equals(oldStatus);

        if (savedTask.getUserId() != null) {
            userRepository.findById(savedTask.getUserId()).ifPresent(user -> {
                if (statusChangedToDone) {
                    emailService.sendEmail(
                        user.getEmail(),
                        "Mission Accomplished: " + savedTask.getTitle(),
                        "Congratulations " + user.getName() + ",\n\nThe mission \"" + savedTask.getTitle() + "\" has been successfully completed.\n\nGreat work."
                    );
                } else {
                    emailService.sendEmail(
                        user.getEmail(),
                        "Mission Updated: " + savedTask.getTitle(),
                        "Hello " + user.getName() + ",\n\nThe parameters for your mission \"" + savedTask.getTitle() + "\" have been updated.\n\nStatus: " + savedTask.getStatus() + "\nPriority: " + savedTask.getPriority()
                    );
                }
            });
        }

        return savedTask;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Task not found");
        }
        // ✅ Cascade Delete: Remove all milestones/subtasks belonging to this task
        List<Task> subtasks = repo.findByParentTaskId(id);
        if (subtasks != null && !subtasks.isEmpty()) {
            repo.deleteAll(subtasks);
        }

        repo.deleteById(id);
    }
}