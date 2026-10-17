package com.tripnest.repository;

import com.tripnest.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Trip entities.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, String> {

    List<Trip> findByUserEmailIgnoreCaseOrderByCreatedAtDesc(String userEmail);

    Optional<Trip> findByIdAndUserEmailIgnoreCase(String id, String userEmail);

    void deleteByIdAndUserEmailIgnoreCase(String id, String userEmail);
}
