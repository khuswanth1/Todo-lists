package com.todo.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.todo.app.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 🔐 Login support
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    // 📱 Optional (if you still want mobile login)
    Optional<User> findByMobile(String mobile);
}