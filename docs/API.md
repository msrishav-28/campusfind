# CampusFind REST API Specification

This document defines the complete HTTP interface for CampusFind. CampusFind enforces multi-tenant partition isolation across all operational endpoints.

---

## Global Conventions

- **Base URL**: `https://<domain>` (Local development: `http://localhost:3000`)
- **Content-Type**: `application/json` for requests with bodies (except image upload which accepts base64 or multipart).
- **Tenant Scope**: Tenant-scoped routes use the `/:campus` path segment, where `:campus` is the approved campus identifier slug (e.g., `kengeri`).
- **Authentication**:
  - Public operations: Map retrieval, item browsing, item reporting, onboarding submission.
  - User session: Cookie-based HTTP-only session token (`campusfind_session`).
  - Claim / Sensitive operations: Requester campus email verification via Supabase Auth One-Time Password (OTP). No SMS is used under any circumstances.
  - Admin operations: Protected by `x-admin-key` header matching server environment secret `ADMIN_KEY` or `CRON_SECRET`.

---

## 1. System & Authentication Endpoints

### 1.1 Get Active Session
Returns current authenticated user status from the HTTP-only session cookie.

- **Method**: `GET`
- **Route**: `/api/session`
- **Authentication**: None required (cookie parsed if present).
- **Response `200 OK`**:
```json
{
  "authenticated": true,
  "user": {
    "email": "student@christuniversity.in",
    "campusSlug": "kengeri",
    "role": "student"
  }
}
```
- **Response `200 OK` (Unauthenticated)**:
```json
{
  "authenticated": false,
  "user": null
}
```

---

### 1.2 Start Email OTP (Supabase Auth)
Dispatches a 6-digit verification code to the requester's campus email via Supabase Auth (`/auth/v1/otp`). No SMS OTP is sent. In development mode without live email dispatch, code preview is emitted in server logs.

- **Method**: `POST`
- **Route**: `/api/auth/otp/start`
- **Payload**:
```json
{
  "email": "student@christuniversity.in"
}
```
- **Response `200 OK`**:
```json
{
  "challengeId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "student@christuniversity.in"
}
```
- **Response `400 Bad Request`**:
```json
{
  "error": "Please enter your campus email address. Verification codes are delivered via email."
}
```

---

### 1.3 Verify Email OTP
Validates the supplied 6-digit one-time password with Supabase Auth (`/auth/v1/verify`) and establishes an encrypted HTTP-only session cookie.

- **Method**: `POST`
- **Route**: `/api/auth/otp/verify`
- **Payload**:
```json
{
  "challengeId": "123e4567-e89b-12d3-a456-426614174000",
  "code": "583921"
}
```
- **Response `200 OK`**:
```json
{
  "ok": true,
  "userId": "user_8f91b7e4..."
}
```
- **Response `400 Bad Request`**:
```json
{
  "error": "Invalid code"
}
```

---

## 2. Institutional Onboarding & Management

### 2.1 List Approved Campuses
Lists all onboarded academic institutions that have been verified and activated.

- **Method**: `GET`
- **Route**: `/api/campuses`
- **Authentication**: None.
- **Response `200 OK`**:
```json
{
  "campuses": [
    {
      "slug": "kengeri",
      "name": "CHRIST (Deemed to be University), Bangalore Kengeri",
      "institutionType": "university",
      "city": "Bengaluru",
      "status": "approved",
      "center": {
        "lat": 12.8615,
        "lng": 77.4385
      },
      "deskLocation": "Block I Security Counter",
      "placesCount": 8
    }
  ]
}
```

---

### 2.2 Submit Campus Onboarding Application
Allows any university, college, or school administrator to register their institution for isolated CampusFind deployment.

- **Method**: `POST`
- **Route**: `/api/campuses/onboard`
- **Payload**:
```json
{
  "name": "St. Joseph's University",
  "slug": "sju",
  "institutionType": "college",
  "city": "Bengaluru",
  "contactEmail": "admin@sju.edu.in",
  "contactPhone": "+919876543210",
  "centerLat": 12.9622,
  "centerLng": 77.5995,
  "deskLocation": "Auditorium Ground Floor Desk",
  "initialPlaces": [
    {
      "id": "sju-main",
      "name": "Main Administrative Block",
      "lat": 12.9622,
      "lng": 77.5995,
      "aliases": ["admin block", "quadrangle"]
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Campus registered successfully under pending status.",
  "campus": {
    "slug": "sju",
    "name": "St. Joseph's University",
    "status": "pending"
  }
}
```
- **Response `409 Conflict`**:
```json
{
  "error": "Campus slug 'sju' is already registered."
}
```

---

### 2.3 Approve Campus Institution (Administrative)
Activates a pending campus, creating its live partition, map gazetteer, and isolated database routing.

- **Method**: `POST`
- **Route**: `/api/admin/campuses/:slug/approve`
- **Headers**: `x-admin-key: <ADMIN_KEY>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Campus 'sju' approved and activated for live operations.",
  "campus": {
    "slug": "sju",
    "status": "approved"
  }
}
```
- **Response `401 Unauthorized`**:
```json
{
  "error": "Unauthorized. Missing or invalid administrative secret."
}
```

---

## 3. Campus-Scoped Operations

All endpoints in this section enforce tenant isolation via the `:campus` path parameter. If the campus is not approved, the request immediately terminates with `404 Not Found`.

### 3.1 Get Campus Gazetteer & Center
Fetches official landmark coordinates and geographical center for map initialization and point-in-polygon snapping.

- **Method**: `GET`
- **Route**: `/api/:campus/places`
- **Response `200 OK`**:
```json
{
  "campus": "kengeri",
  "name": "CHRIST (Deemed to be University), Bangalore Kengeri",
  "center": {
    "lat": 12.8615,
    "lng": 77.4385
  },
  "places": [
    {
      "id": "block-1",
      "name": "Block I (Engineering & Architecture)",
      "lat": 12.86142,
      "lng": 77.43845,
      "aliases": ["faculty block", "cse dept"]
    }
  ]
}
```

---

### 3.2 List Campus Pins & Items
Retrieves active items pinned within the tenant's campus boundary. Cross-campus records are strictly filtered out at the datastore layer.

- **Method**: `GET`
- **Route**: `/api/:campus/items`
- **Query Parameters**:
  - `status` (optional): `active`, `claimed`, `handed_over`, `expired`.
  - `type` (optional): `lost`, `found`.
  - `query` (optional): Free text search against title, description, and place name.
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "itm_92d7ca81...",
      "campusSlug": "kengeri",
      "type": "found",
      "title": "Black Casio FX-991CW Calculator",
      "description": "Left on 2nd floor desk near Room 204.",
      "category": "electronics",
      "lat": 12.86142,
      "lng": 77.43845,
      "placeName": "Block I",
      "status": "active",
      "createdAt": "2026-09-16T10:00:00.000Z",
      "photos": ["/uploads/img_4a2c...jpg"]
    }
  ]
}
```

---

### 3.3 Create Lost or Found Report
Publishes a new report pin. Automatically runs spatial snapping and executes deterministic match proposal algorithms against opposing pins in the same campus.

- **Method**: `POST`
- **Route**: `/api/:campus/items`
- **Payload**:
```json
{
  "type": "found",
  "title": "Blue Dell Laptop Charger 65W",
  "description": "Barrel pin charger found in Library Reading Room.",
  "category": "electronics",
  "lat": 12.8621,
  "lng": 77.4390,
  "reporterPhone": "+919876543210",
  "photos": []
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "item": {
    "id": "itm_10b8ef42...",
    "campusSlug": "kengeri",
    "type": "found",
    "status": "active",
    "placeName": "Central Library",
    "suggestedMatches": []
  }
}
```

---

### 3.4 Get Item Details
Fetches full public item metadata. Direct contact info of the reporter is masked to prevent unauthorized harassment.

- **Method**: `GET`
- **Route**: `/api/:campus/items/:id`
- **Response `200 OK`**:
```json
{
  "item": {
    "id": "itm_10b8ef42...",
    "campusSlug": "kengeri",
    "type": "found",
    "title": "Blue Dell Laptop Charger 65W",
    "description": "Barrel pin charger found in Library Reading Room.",
    "placeName": "Central Library",
    "lat": 12.8621,
    "lng": 77.4390,
    "status": "active",
    "createdAt": "2026-09-16T10:00:00.000Z"
  }
}
```

---

### 3.5 Submit Ownership Claim
Allows an owner to claim a found item by providing proof of ownership (e.g., serial number, distinctive scratch, lockscreen wallpaper, or contents).

- **Method**: `POST`
- **Route**: `/api/:campus/claims`
- **Payload**:
```json
{
  "itemId": "itm_10b8ef42...",
  "claimantPhone": "+919876543210",
  "claimantName": "Rahul Sharma",
  "proofDescription": "The charger cable has yellow electrical tape wrapped 2 inches from the connector."
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "claimId": "clm_47a1bc82...",
  "status": "pending_review"
}
```

---

### 3.6 Security Desk Management
Security officers and staff manage physical inventory transferred to the campus lost-and-found repository.

#### 3.6.1 View Desk Inventory
- **Method**: `GET`
- **Route**: `/api/:campus/desk/inventory`
- **Headers**: `x-admin-key: <ADMIN_KEY>` (or authenticated security desk session).
- **Response `200 OK`**:
```json
{
  "inventory": [
    {
      "id": "itm_10b8ef42...",
      "title": "Blue Dell Laptop Charger 65W",
      "deskLocation": "Block I Security Counter",
      "deskBin": "Bin E-3",
      "daysInCustody": 4
    }
  ]
}
```

#### 3.6.2 Log Physical Handover
- **Method**: `POST`
- **Route**: `/api/:campus/desk/handover`
- **Headers**: `x-admin-key: <ADMIN_KEY>`
- **Payload**:
```json
{
  "itemId": "itm_10b8ef42...",
  "recipientName": "Rahul Sharma",
  "recipientIdNumber": "2347109",
  "recipientPhone": "+919876543210",
  "officerBadgeNumber": "SEC-804"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "status": "handed_over",
  "handedOverAt": "2026-09-16T12:00:00.000Z"
}
```

---

## 4. Maintenance & Lifecycle Daemons

### 4.1 Automated Item Expiry & Desk Transfer
Daily cron worker that moves items older than 14 days without active claims into the custody of the designated campus security desk.

- **Method**: `POST`
- **Route**: `/api/cron/expire`
- **Headers**: `Authorization: Bearer <CRON_SECRET>` or `x-admin-key: <ADMIN_KEY>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "processedCount": 12,
  "transferredToDesk": 3,
  "expiredCount": 9
}
```

---

## 5. Status Codes & Error Formats

Standard error format:
```json
{
  "error": "Descriptive message detailing the operational failure."
}
```

| HTTP Code | Reason |
|---|---|
| `200 OK` | Request completed successfully. |
| `201 Created` | Resource persisted and assigned unique identifier. |
| `400 Bad Request` | Malformed payload, invalid types, or missing required fields. |
| `401 Unauthorized` | Missing authentication credentials or invalid session token. |
| `403 Forbidden` | Access blocked by tenant isolation or administrative scope checks. |
| `404 Not Found` | Campus partition does not exist or record ID is missing. |
| `409 Conflict` | Unique constraint collision (e.g., campus slug duplicate). |
| `500 Internal Error` | Server fault logged to diagnostic telemetry. |
