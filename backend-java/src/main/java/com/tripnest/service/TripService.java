package com.tripnest.service;

import com.tripnest.dto.CreateTripRequest;
import com.tripnest.dto.TripResponse;
import com.tripnest.exception.TripNotFoundException;
import com.tripnest.model.Trip;
import com.tripnest.repository.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class TripService {

    private final TripRepository tripRepository;

    public TripService(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    /**
     * Create a new Trip in database.
     */
    public TripResponse createTrip(CreateTripRequest request) {
        String id = "trip-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6);

        Trip trip = new Trip(
                id,
                request.getUserEmail().toLowerCase().trim(),
                request.getTitle().trim(),
                request.getDestination().trim(),
                request.getStartDate(),
                request.getEndDate(),
                request.getBudgetAmount() != null ? request.getBudgetAmount() : 0.0,
                request.getBudgetCurrency() != null ? request.getBudgetCurrency() : "INR",
                request.getTravelersCount() != null ? request.getTravelersCount() : 1,
                request.getNotes(),
                request.getCoverImage() != null ? request.getCoverImage() :
                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
        );

        Trip saved = tripRepository.save(trip);
        return TripResponse.fromEntity(saved);
    }

    /**
     * Delete a trip by its ID and optional user email security check.
     */
    public void deleteTrip(String tripId, String userEmail) {
        Trip trip;
        if (userEmail != null && !userEmail.isBlank()) {
            trip = tripRepository.findByIdAndUserEmailIgnoreCase(tripId, userEmail.toLowerCase().trim())
                    .orElseThrow(() -> new TripNotFoundException("Trip not found with ID: " + tripId + " for user: " + userEmail));
        } else {
            trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new TripNotFoundException("Trip not found with ID: " + tripId));
        }

        tripRepository.delete(trip);
    }

    /**
     * Fetch all trips for a given user email.
     */
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return tripRepository.findAll().stream()
                    .map(TripResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return tripRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(userEmail.toLowerCase().trim())
                .stream()
                .map(TripResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Fetch single trip details by ID.
     */
    @Transactional(readOnly = true)
    public TripResponse getTripById(String id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new TripNotFoundException("Trip not found with ID: " + id));
        return TripResponse.fromEntity(trip);
    }
}
