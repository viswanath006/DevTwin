package com.demo;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UserTest {

    @Test
    public void testUserCreation() {
        User user = new User("u1", "Viswa", "viswa@example.com");
        assertEquals("Viswa", user.getName());
        assertEquals("viswa@example.com", user.getEmail());
    }

    @Test
    public void testUserIdNotNull() {
        User user = new User("u2", "Alice", "alice@example.com");
        assertNotNull(user.getId());
    }
}
