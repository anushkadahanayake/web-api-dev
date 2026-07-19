# Police TukTuk API - Project Overview

This document serves as the technical reference for the Police TukTuk REST API project.

---

## 🏗️ Architecture & Data Layer

- **Framework**: Minimal Node.js + Express.js app.
- **Database**: MongoDB (hosted on Atlas Cluster) with `mongoose` ODM.
- **Data Models**: Defined in `index.js` for `Province`, `District`, `Station`, `Vehicle`, and `Ping`.
- **Connection Caching**: A global database connection middleware is registered in `index.js`. This guarantees that the database connection is established before handling any incoming HTTP request, ensuring full compatibility and preventing buffering timeouts in Serverless environments (Vercel).
- **Port Management**: Dynamic port allocation is implemented in `index.js`. If port `3000` is occupied, it automatically attempts fallback ports (`3001`, `3002`, etc.) to prevent startup crashes.

---

## 🛣️ API Routing Registry

All route paths use lowercase naming conventions and hyphen separators. Response payloads are served as clean JSON objects without envelope wrappers.

### 1. General
- **`GET /`**: Health check.
  - **Response**: `{"status": "ok", "session": "N86007CEM S2"}`

### 2. Provinces
- **`GET /provinces`**: Lists all provinces in the system.
  - **Response**: `[{ "province_id": number, "name": string }]`
- **`GET /provinces/:id`**: Gets a single province by its ID. Returns `404` if not found.
  - **Response**: `{ "province_id": number, "name": string }`

### 3. Districts
- **`GET /districts`**: Lists all districts.
  - **Query Filters**: `province_id` (e.g., `GET /districts?province_id=1`).
  - **Response**: `[{ "district_id": number, "name": string, "province_id": number }]`
- **`GET /districts/:id`**: Gets a single district by its ID. Returns `404` if not found.
  - **Response**: `{ "district_id": number, "name": string, "province_id": number }`

### 4. Stations
- **`GET /stations`**: Lists all police stations.
  - **Query Filters**: `district_id` (e.g., `GET /stations?district_id=1`).
  - **Response**: `[{ "station_id": number, "name": string, "district_id": number }]`
- **`GET /stations/:id`**: Gets a single police station by its ID. Returns `404` if not found.
  - **Response**: `{ "station_id": number, "name": string, "district_id": number }`

### 5. Vehicles
- **`GET /vehicles`**: Lists all registered vehicles.
  - **Query Filters** (Area-based filtering):
    - `station_id`: Filter directly by station.
    - `district_id`: Resolves all stations belonging to the district and filters vehicles.
    - `province_id`: Resolves all districts & stations belonging to the province and filters vehicles.
  - **Response**: `[{ "vehicle_id": number, "reg_number": string, "device_id": string, "station_id": number }]`
- **`GET /vehicles/:vehicleId`**: Returns a vehicle composite profile including its most recent location ping.
  - **Lookup Key**: Accepts vehicle `id` (integer), `register_number` (case-insensitive string), or `device_id` (case-insensitive string). Returns `404` if not found.
  - **Logic**: Filters pings, sorts descending by timestamp, and takes the newest ping (`last_ping`). Returns `null` if no pings exist.
  - **Response**:
    ```json
    {
      "vehicle_id": number,
      "reg_number": string,
      "device_id": string,
      "station_id": number,
      "last_ping": {
        "ping_id": number,
        "vehicle_id": number,
        "timestamp": string,
        "lat": number,
        "lng": number,
        "speed": number
      } | null
    }
    ```
- **`GET /vehicles/:id/pings`**: Lists all historical location pings for a specific vehicle.
  - **Lookup Key**: Accepts vehicle `id`, `register_number`, or `device_id`. Returns `404` if not found.
  - **Response**: `[{ "ping_id": number, "vehicle_id": number, "timestamp": string, "lat": number, "lng": number, "speed": number }]`
- **`GET /vehicles/:vehicleId/last-position`**: Returns the coordinate payload of the most recent location ping only, excluding vehicle metadata.
  - **Lookup Key**: Accepts vehicle `id`, `register_number`, or `device_id`.
  - **Logic**: Returns the newest ping. Yields `404` if no pings are recorded.
  - **Response**: `{ "vehicle_id": number, "timestamp": string, "lat": number, "lng": number, "speed": number }`

*Note: The `speed` attribute is currently defaulted to `0` in location pings as it is not present in the static seed data.*

---

## ⚡ Developer Commands

- **Run Server**:
  ```bash
  npm start
  # or
  npm run dev
  ```

- **Seed Database**:
  ```bash
  node seed-db.js
  ```

---

## 🛡️ CI/CD Integration

The workflow is configured at [.github/workflows/ci.yml](file:///Users/anushkadahanayake/web-api-dev/.github/workflows/ci.yml) and performs the following checks:
1. Checks out repository and prepares Node.js environment.
2. Installs dependencies.
3. Launches the application in the background.
4. Performs a smoke test request to `http://localhost:3000/` using `curl` with proxy bypass tags (`no_proxy` and `--noproxy "*"`) to avoid local routing interception issues in restricted network environments.
