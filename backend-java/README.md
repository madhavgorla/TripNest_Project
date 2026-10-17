# TripNest Java Backend Service (Spring Boot)

This directory contains the production-ready Java backend service for **TripNest**, specifically providing robust REST endpoints for **Creating Trips**, **Deleting Trips**, and **Managing Itineraries**.

---

## Architecture Overview

- **Framework**: Spring Boot 3.2+ (Java 17 / 21)
- **Data Access**: Spring Data JPA with Hibernate ORM
- **Database Support**:
  - Out of the box: In-memory **H2 Database** (zero setup needed for testing)
  - Production: **Neon PostgreSQL** or Cloud SQL (simply set `spring.datasource.url` in `application.properties`)
- **Validation**: Jakarta Validation API (`@NotBlank`, `@Email`, etc.)
- **CORS**: Pre-configured to allow cross-origin requests from React/Vite frontends

---

## API Endpoints

### 1. Create a Trip
- **Method**: `POST`
- **Path**: `/api/trips`
- **Request Headers**: `Content-Type: application/json`
- **Sample Request Body**:
```json
{
  "userEmail": "ffdhanush806@gmail.com",
  "title": "Grand Kashmir Alpine & Lake Escape",
  "destination": "Kashmir Valley",
  "startDate": "2026-09-15",
  "endDate": "2026-09-20",
  "budgetAmount": 150000.0,
  "budgetCurrency": "INR",
  "travelersCount": 2,
  "notes": "Include golden hour shikara cruise and Apharwat peak gondola pass.",
  "coverImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Trip successfully created in Java backend",
  "trip": {
    "id": "trip-1725783200000-a1b2c3",
    "userEmail": "ffdhanush806@gmail.com",
    "title": "Grand Kashmir Alpine & Lake Escape",
    "destination": "Kashmir Valley",
    "startDate": "2026-09-15",
    "endDate": "2026-09-20",
    "budgetAmount": 150000.0,
    "budgetCurrency": "INR",
    "travelersCount": 2,
    "status": "Active",
    "notes": "Include golden hour shikara cruise and Apharwat peak gondola pass.",
    "coverImage": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "createdAt": "2026-09-08T07:15:00Z",
    "updatedAt": "2026-09-08T07:15:00Z"
  }
}
```

---

### 2. Delete a Trip
- **Method**: `DELETE`
- **Path**: `/api/trips/{id}?userEmail={userEmail}`
- **Sample Call**:
```bash
curl -X DELETE "http://localhost:8080/api/trips/trip-1725783200000-a1b2c3?userEmail=ffdhanush806@gmail.com"
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Trip with ID [trip-1725783200000-a1b2c3] was successfully deleted from Java backend",
  "deletedTripId": "trip-1725783200000-a1b2c3",
  "timestamp": "2026-09-08T07:16:00Z"
}
```

---

### 3. List User Trips
- **Method**: `GET`
- **Path**: `/api/trips?userEmail=ffdhanush806@gmail.com`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "count": 1,
  "trips": [ ... ]
}
```

---

## How to Run Locally

1. **Prerequisites**: Ensure you have JDK 17+ and Maven installed.
2. **Build and Run**:
```bash
cd backend-java
mvn clean spring-boot:run
```
3. The server starts on **port 8080**.
4. Test with curl:
```bash
curl -X POST http://localhost:8080/api/trips \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"ffdhanush806@gmail.com","title":"Goa Coastal Villa","destination":"Goa","budgetAmount":75000}'
```
