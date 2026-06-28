const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());

const SEED_DATA_PATH = path.join(__dirname, 'seed.json');
let seedData = null;

function loadData() {
  try {
    const raw = fs.readFileSync(SEED_DATA_PATH, 'utf8');
    seedData = JSON.parse(raw);
    console.log('Loaded seed data from seed.json successfully.');
  } catch (err) {
    console.error('Failed to load seed data:', err);
    process.exit(1);
  }
}
loadData();

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
