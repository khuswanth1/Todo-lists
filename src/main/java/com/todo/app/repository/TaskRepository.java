package com.todo.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.todo.app.entity.Task;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    List<Task> findByParentTaskId(Long parentTaskId);
    List<Task> findByStatusNot(String status);
}