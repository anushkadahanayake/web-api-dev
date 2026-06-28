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
  res.json(seedData.provinces);
});

// GET /provinces/:provinceId
app.get('/provinces/:provinceId', (req, res) => {
  const id = parseInt(req.params.provinceId, 10);
  const province = seedData.provinces.find((p) => p.id === id);

  if (!province) {
    return res.status(404).json({ error: 'Province not found' });
  }

  res.json(province);
});

// GET /districts
app.get('/districts', (req, res) => {
  const { province_id } = req.query;
  let districts = seedData.districts;

  if (province_id) {
    const provId = parseInt(province_id, 10);
    districts = districts.filter((d) => d.province_id === provId);
  }

  res.json(districts);
});

// GET /districts/:districtId
app.get('/districts/:districtId', (req, res) => {
  const id = parseInt(req.params.districtId, 10);
  const district = seedData.districts.find((d) => d.id === id);

  if (!district) {
    return res.status(404).json({ error: 'District not found' });
  }

  res.json(district);
});

// GET /stations
app.get('/stations', (req, res) => {
  const { district_id } = req.query;
  let stations = seedData.stations;

  if (district_id) {
    const distId = parseInt(district_id, 10);
    stations = stations.filter((s) => s.district_id === distId);
  }

  res.json(stations);
});

// GET /stations/:stationId
app.get('/stations/:stationId', (req, res) => {
  const id = parseInt(req.params.stationId, 10);
  const station = seedData.stations.find((s) => s.id === id);

  if (!station) {
    return res.status(404).json({ error: 'Station not found' });
  }

  res.json(station);
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

  res.json(vehicles);
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

  res.json(vehicle);
});

// GET /vehicles/:vehicleId/pings
app.get('/vehicles/:vehicleId/pings', (req, res) => {
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
  res.json(pings);
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
