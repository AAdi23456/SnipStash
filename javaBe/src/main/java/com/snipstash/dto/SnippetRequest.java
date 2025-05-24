package com.snipstash.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class SnippetRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotBlank(message = "Language is required")
    private String language;

    private String description;
    private Set<String> tags;
    private Set<Long> folderIds;
} 