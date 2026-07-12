const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());

const SEED_DATA_PATH = path.join(__dirname, 'seed.json');
let seedData = null;
const deviceKeys = {};

function loadData() {
  try {
    const raw = fs.readFileSync(SEED_DATA_PATH, 'utf8');
    seedData = JSON.parse(raw);
    console.log('Loaded seed data from seed.json successfully.');

    // Populate deviceKeys dynamically
    seedData.vehicles.forEach((v) => {
      const key = `v-${String(v.id).padStart(2, '0')}`;
      deviceKeys[key] = `key_v${String(v.id).padStart(2, '0')}`;
    });
  } catch (err) {
    console.error('Failed to load seed data:', err);
    process.exit(1);
  }
}
loadData();

function saveData() {
  try {
    fs.writeFileSync(SEED_DATA_PATH, JSON.stringify(seedData, null, 2), 'utf8');
    console.log('Saved seed data successfully.');
  } catch (err) {
    console.error('Failed to save seed data:', err);
  }
}

// Health Check (GET /)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    session: 'N86007CEM S2',
  });
});

// GET /provinces
app.get('/provinces', (req, res) => {
  const mapped = seedData.provinces.map((p) => ({
    province_id: p.id,
    name: p.name,
  }));
  res.json(mapped);
});

// GET /provinces/:id
app.get('/provinces/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const province = seedData.provinces.find((p) => p.id === id);

  if (!province) {
    return res.status(404).json({ error: 'Province not found' });
  }

  res.json({
    province_id: province.id,
    name: province.name,
  });
});

// GET /districts
app.get('/districts', (req, res) => {
  const { province_id } = req.query;
  let districts = seedData.districts;

  if (province_id) {
    const provId = parseInt(province_id, 10);
    districts = districts.filter((d) => d.province_id === provId);
  }

  const mapped = districts.map((d) => ({
    district_id: d.id,
    name: d.name,
    province_id: d.province_id,
  }));
  res.json(mapped);
});

// GET /districts/:id
app.get('/districts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const district = seedData.districts.find((d) => d.id === id);

  if (!district) {
    return res.status(404).json({ error: 'District not found' });
  }

  res.json({
    district_id: district.id,
    name: district.name,
    province_id: district.province_id,
  });
});

// GET /stations
app.get('/stations', (req, res) => {
  const { district_id } = req.query;
  let stations = seedData.stations;

  if (district_id) {
    const distId = parseInt(district_id, 10);
    stations = stations.filter((s) => s.district_id === distId);
  }

  const mapped = stations.map((s) => ({
    station_id: s.id,
    name: s.name,
    district_id: s.district_id,
  }));
  res.json(mapped);
});

// GET /stations/:id
app.get('/stations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const station = seedData.stations.find((s) => s.id === id);

  if (!station) {
    return res.status(404).json({ error: 'Station not found' });
  }

  res.json({
    station_id: station.id,
    name: station.name,
    district_id: station.district_id,
  });
});

// GET /vehicles
app.get('/vehicles', (req, res) => {
  const { station_id, district_id, province_id } = req.query;
  let vehicles = seedData.vehicles;

  if (station_id) {
    const statId = parseInt(station_id, 10);
    vehicles = vehicles.filter((v) => v.station_id === statId);
  } else if (district_id) {
    const distId = parseInt(district_id, 10);
    const stationIds = new Set(
      seedData.stations.filter((s) => s.district_id === distId).map((s) => s.id),
    );
    vehicles = vehicles.filter((v) => stationIds.has(v.station_id));
  } else if (province_id) {
    const provId = parseInt(province_id, 10);
    const districtIds = new Set(
      seedData.districts.filter((d) => d.province_id === provId).map((d) => d.id),
    );
    const stationIds = new Set(
      seedData.stations.filter((s) => districtIds.has(s.district_id)).map((s) => s.id),
    );
    vehicles = vehicles.filter((v) => stationIds.has(v.station_id));
  }

  const mapped = vehicles.map((v) => ({
    vehicle_id: v.id,
    reg_number: v.register_number,
    device_id: v.device_id,
    station_id: v.station_id,
  }));
  res.json(mapped);
});

// GET /vehicles/:vehicleId
app.get('/vehicles/:vehicleId', (req, res) => {
  const vId = req.params.vehicleId;

  const vehicle = seedData.vehicles.find(
    (v) =>
      v.id === parseInt(vId, 10) ||
      v.register_number.toLowerCase() === vId.toLowerCase() ||
      v.device_id.toLowerCase() === vId.toLowerCase(),
  );

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // Find last_ping: filter pings where vehicle_id matches, sort by timestamp descending, take [0]
  const pings = seedData.pings.filter((p) => p.vehicle_id === vehicle.id);
  let lastPing = null;

  if (pings.length > 0) {
    // Sort descending by timestamp
    pings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const p = pings[0];
    lastPing = {
      ping_id: p.id,
      vehicle_id: p.vehicle_id,
      timestamp: p.timestamp,
      lat: p.latitude,
      lng: p.longitude,
      speed: 0,
    };
  }

  res.json({
    vehicle_id: vehicle.id,
    reg_number: vehicle.register_number,
    device_id: vehicle.device_id,
    station_id: vehicle.station_id,
    last_ping: lastPing,
  });
});

// GET /vehicles/:id/pings
app.get('/vehicles/:id/pings', (req, res) => {
  const vId = req.params.id;

  const vehicle = seedData.vehicles.find(
    (v) =>
      v.id === parseInt(vId, 10) ||
      v.register_number.toLowerCase() === vId.toLowerCase() ||
      v.device_id.toLowerCase() === vId.toLowerCase(),
  );

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  const pings = seedData.pings.filter((p) => p.vehicle_id === vehicle.id);
  const mapped = pings.map((p) => ({
    ping_id: p.id,
    vehicle_id: p.vehicle_id,
    timestamp: p.timestamp,
    lat: p.latitude,
    lng: p.longitude,
    speed: 0,
  }));
  res.json(mapped);
});

// GET /vehicles/:vehicleId/last-position
app.get('/vehicles/:vehicleId/last-position', (req, res) => {
  const vId = req.params.vehicleId;

  const vehicle = seedData.vehicles.find(
    (v) =>
      v.id === parseInt(vId, 10) ||
      v.register_number.toLowerCase() === vId.toLowerCase() ||
      v.device_id.toLowerCase() === vId.toLowerCase(),
  );

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  const pings = seedData.pings.filter((p) => p.vehicle_id === vehicle.id);

  if (pings.length === 0) {
    return res.status(404).json({ error: 'No pings found for this vehicle' });
  }

  // Sort descending by timestamp
  pings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const p = pings[0];

  res.json({
    vehicle_id: p.vehicle_id,
    timestamp: p.timestamp,
    lat: p.latitude,
    lng: p.longitude,
    speed: 0,
  });
});

// POST /vehicles/:vehicleId/pings
app.post('/vehicles/:vehicleId/pings', (req, res) => {
  // 1. Require X-API-Key header (401 if header is absent)
  const apiKey = req.header('X-API-Key');
  if (!apiKey) {
    res.setHeader('WWW-Authenticate', 'ApiKey realm="vehicles"');
    return res.status(401).json({ error: 'Unauthorized: X-API-Key header is missing' });
  }

  // 2. 404 if vehicleId not in vehicles array
  const vId = req.params.vehicleId;
  let numericId = parseInt(vId, 10);
  if (isNaN(numericId) && vId.startsWith('v-')) {
    numericId = parseInt(vId.substring(2), 10);
  }

  const vehicle = seedData.vehicles.find(
    (v) =>
      v.id === numericId ||
      v.register_number.toLowerCase() === vId.toLowerCase() ||
      v.device_id.toLowerCase() === vId.toLowerCase(),
  );

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // 3. 403 if key does not match deviceKeys[vehicleId]
  const lookupKey = `v-${String(vehicle.id).padStart(2, '0')}`;
  if (apiKey !== deviceKeys[lookupKey]) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key for this vehicle' });
  }

  // 4. 400 if body missing latitude, longitude, or speed
  const { latitude, longitude, speed } = req.body;
  if (latitude === undefined || longitude === undefined || speed === undefined) {
    return res.status(400).json({ error: 'Bad Request: Missing latitude, longitude, or speed' });
  }

  // 5. Server sets timestamp
  const timestamp = new Date().toISOString();

  // 6. Push ping to array
  const maxPingId = seedData.pings.reduce((max, p) => (p.id > max ? p.id : max), 0);
  const newPingId = maxPingId + 1;

  const newPing = {
    id: newPingId,
    vehicle_id: vehicle.id,
    latitude: Number(latitude),
    longitude: Number(longitude),
    timestamp,
    speed: Number(speed),
  };

  seedData.pings.push(newPing);
  saveData();

  // 7. Set Location header: /vehicles/:vehicleId/pings/:pingId
  res.setHeader('Location', `/vehicles/${vehicle.id}/pings/${newPingId}`);

  // 8. Set ETag and Last-Modified headers
  const crypto = require('crypto');
  const responseJson = {
    ping_id: newPing.id,
    vehicle_id: newPing.vehicle_id,
    timestamp: newPing.timestamp,
    lat: newPing.latitude,
    lng: newPing.longitude,
    speed: newPing.speed,
  };
  const responseBody = JSON.stringify(responseJson);
  const etag = crypto.createHash('md5').update(responseBody).digest('base64');
  res.setHeader('ETag', `W/"${etag}"`);
  res.setHeader('Last-Modified', new Date(timestamp).toUTCString());

  // 9. Return 201 Created
  res.status(201).json(responseJson);
});




function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use, automatically trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
startServer(DEFAULT_PORT);
