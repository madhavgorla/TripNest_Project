package com.tripnest.controller;

import com.tripnest.dto.CreateTripRequest;
import com.tripnest.dto.TripResponse;
import com.tripnest.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Trip Operations in Java Spring Boot.
 * Handles creating, retrieving, and deleting trips.
 */
@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    /**
     * Endpoint: POST /api/trips
     * Description: Create a new custom trip in Java backend.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTrip(@Valid @RequestBody CreateTripRequest request) {
        TripResponse created = tripService.createTrip(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Trip successfully created in Java backend");
        response.put("trip", created);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint: DELETE /api/trips/{id}
     * Description: Delete an existing trip by ID in Java backend.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTrip(
            @PathVariable("id") String id,
            @RequestParam(value = "userEmail", required = false) String userEmail) {

        tripService.deleteTrip(id, userEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Trip with ID [" + id + "] was successfully deleted from Java backend");
        response.put("deletedTripId", id);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint: GET /api/trips
     * Description: Retrieve trips list, optionally filtered by user email.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTrips(
            @RequestParam(value = "userEmail", required = false) String userEmail) {

        List<TripResponse> trips = tripService.getTripsByUser(userEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", trips.size());
        response.put("trips", trips);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint: GET /api/trips/{id}
     * Description: Retrieve details for a single trip by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTripById(@PathVariable("id") String id) {
        TripResponse trip = tripService.getTripById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("trip", trip);

        return ResponseEntity.ok(response);
    }
}
