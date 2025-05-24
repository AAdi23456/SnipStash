package com.snipstash.repository;

import com.snipstash.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUserId(Long userId);
    
    @Query("SELECT f FROM Folder f LEFT JOIN FETCH f.snippets WHERE f.id = :id")
    Folder findByIdWithSnippets(@Param("id") Long id);
    
    boolean existsByUserIdAndName(Long userId, String name);
} 