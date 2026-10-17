package com.tripnest.dto;

import com.tripnest.model.Trip;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Standard API Response payload for Trip resources.
 */
public class TripResponse {

    private String id;
    private String userEmail;
    private String title;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budgetAmount;
    private String budgetCurrency;
    private Integer travelersCount;
    private String status;
    private String notes;
    private String coverImage;
    private Instant createdAt;
    private Instant updatedAt;

    public TripResponse() {}

    public static TripResponse fromEntity(Trip trip) {
        TripResponse res = new TripResponse();
        res.setId(trip.getId());
        res.setUserEmail(trip.getUserEmail());
        res.setTitle(trip.getTitle());
        res.setDestination(trip.getDestination());
        res.setStartDate(trip.getStartDate());
        res.setEndDate(trip.getEndDate());
        res.setBudgetAmount(trip.getBudgetAmount());
        res.setBudgetCurrency(trip.getBudgetCurrency());
        res.setTravelersCount(trip.getTravelersCount());
        res.setStatus(trip.getStatus());
        res.setNotes(trip.getNotes());
        res.setCoverImage(trip.getCoverImage());
        res.setCreatedAt(trip.getCreatedAt());
        res.setUpdatedAt(trip.getUpdatedAt());
        return res;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Double getBudgetAmount() { return budgetAmount; }
    public void setBudgetAmount(Double budgetAmount) { this.budgetAmount = budgetAmount; }

    public String getBudgetCurrency() { return budgetCurrency; }
    public void setBudgetCurrency(String budgetCurrency) { this.budgetCurrency = budgetCurrency; }

    public Integer getTravelersCount() { return travelersCount; }
    public void setTravelersCount(Integer travelersCount) { this.travelersCount = travelersCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
