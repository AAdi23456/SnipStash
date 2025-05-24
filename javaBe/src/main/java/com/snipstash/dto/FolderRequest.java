package com.snipstash.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FolderRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
} 