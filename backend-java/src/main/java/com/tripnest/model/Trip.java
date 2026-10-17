package com.tripnest.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * JPA Entity representing a Trip / Custom Itinerary in TripNest.
 */
@Entity
@Table(name = "tripnest_trips")
public class Trip {

    @Id
    @Column(length = 64, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_email", nullable = false, length = 128)
    private String userEmail;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "destination", nullable = false, length = 128)
    private String destination;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "budget_amount")
    private Double budgetAmount;

    @Column(name = "budget_currency", length = 8)
    private String budgetCurrency = "INR";

    @Column(name = "travelers_count")
    private Integer travelersCount = 1;

    @Column(name = "status", length = 32)
    private String status = "Active"; // Active, Completed, Cancelled

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "cover_image", length = 512)
    private String coverImage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    // Default constructor for JPA
    public Trip() {}

    public Trip(String id, String userEmail, String title, String destination,
                LocalDate startDate, LocalDate endDate, Double budgetAmount,
                String budgetCurrency, Integer travelersCount, String notes, String coverImage) {
        this.id = id;
        this.userEmail = userEmail;
        this.title = title;
        this.destination = destination;
        this.startDate = startDate;
        this.endDate = endDate;
        this.budgetAmount = budgetAmount;
        this.budgetCurrency = budgetCurrency != null ? budgetCurrency : "INR";
        this.travelersCount = travelersCount != null ? travelersCount : 1;
        this.notes = notes;
        this.coverImage = coverImage;
        this.status = "Active";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
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
