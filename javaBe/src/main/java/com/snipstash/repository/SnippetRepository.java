package com.snipstash.repository;

import com.snipstash.model.Snippet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {
    Page<Snippet> findByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT s FROM Snippet s WHERE s.user.id = :userId " +
           "AND (LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.content) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Snippet> searchByUser(@Param("userId") Long userId, @Param("search") String search, Pageable pageable);
    
    @Query("SELECT s FROM Snippet s JOIN s.tags t " +
           "WHERE s.user.id = :userId AND t.name IN :tags " +
           "GROUP BY s HAVING COUNT(DISTINCT t.name) = :tagCount")
    Page<Snippet> findByUserIdAndTags(@Param("userId") Long userId, @Param("tags") List<String> tags, 
                                     @Param("tagCount") long tagCount, Pageable pageable);
    
    Page<Snippet> findByUserIdAndLanguage(Long userId, String language, Pageable pageable);
} 