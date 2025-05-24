package com.snipstash.repository;

import com.snipstash.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
    
    @Query("SELECT t FROM Tag t JOIN t.snippets s WHERE s.user.id = :userId GROUP BY t")
    List<Tag> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT t.name FROM Tag t JOIN t.snippets s WHERE s.user.id = :userId " +
           "GROUP BY t.name ORDER BY COUNT(s) DESC")
    List<String> findMostUsedTagsByUser(@Param("userId") Long userId);
} 