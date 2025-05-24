package com.snipstash.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal) {
            return (UserPrincipal) principal;
        }
        
        return null;
    }

    public Long getCurrentUserId() {
        UserPrincipal currentUser = getCurrentUser();
        return currentUser != null ? currentUser.getId() : null;
    }

    public boolean isUserAuthenticated() {
        return getCurrentUser() != null;
    }
} 