package com.demo;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return List.of(new User("1", "Viswa", "viswa@example.com"));
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return user;
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable String id) {
        // Logic to delete user
    }
}
