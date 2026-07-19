require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

// Basic Authentication Middleware
function basicAuth(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Police API"');
    return res.status(401).json({ error: 'Unauthorized: Basic authentication required' });
  }

  const credentials = authHeader.substring(6);
  const decoded = Buffer.from(credentials, 'base64').toString('utf8');
  const parts = decoded.split(':');
  const username = parts[0];
  const password = parts.slice(1).join(':');

  if (username !== 'police' || password !== 'nibm2024') {
    return res.status(403).json({ error: 'Forbidden: Invalid credentials' });
  }

  next();
}

// Apply basicAuth to all GET routes except the health check (/)
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path !== '/') {
    return basicAuth(req, res, next);
  }
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

// Mongoose Schemas & Models
const provinceSchema = new mongoose.Schema({
  province_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
});
const Province = mongoose.model('Province', provinceSchema);

const districtSchema = new mongoose.Schema({
  district_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  province_id: { type: Number, required: true },
});
const District = mongoose.model('District', districtSchema);

const stationSchema = new mongoose.Schema({
  station_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  district_id: { type: Number, required: true },
});
const Station = mongoose.model('Station', stationSchema);

const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: Number, required: true, unique: true },
  reg_number: { type: String, required: true, unique: true },
  device_id: { type: String, required: true, unique: true },
  station_id: { type: Number, required: true },
});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

const pingSchema = new mongoose.Schema({
  ping_id: { type: Number, required: true, unique: true },
  vehicle_id: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, required: true, default: 0 },
});
const Ping = mongoose.model('Ping', pingSchema);

// Export app (Vercel expects default export to be Express app) and attach models for seeding
app.models = { Province, District, Station, Vehicle, Ping };
module.exports = app;


// Health Check (GET /)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    session: 'N86007CEM S2',
  });
});

// GET /provinces
app.get('/provinces', async (req, res) => {
  try {
    const provinces = await Province.find({}, 'province_id name -_id');
    res.json(provinces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /provinces/:id
app.get('/provinces/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const province = await Province.findOne({ province_id: id }, 'province_id name -_id');

    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }

    res.json(province);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /districts
app.get('/districts', async (req, res) => {
  try {
    const { province_id } = req.query;
    const filter = {};

    if (province_id) {
      filter.province_id = parseInt(province_id, 10);
    }

    const districts = await District.find(filter, 'district_id name province_id -_id');
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /districts/:id
app.get('/districts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const district = await District.findOne({ district_id: id }, 'district_id name province_id -_id');

    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stations
app.get('/stations', async (req, res) => {
  try {
    const { district_id } = req.query;
    const filter = {};

    if (district_id) {
      filter.district_id = parseInt(district_id, 10);
    }

    const stations = await Station.find(filter, 'station_id name district_id -_id');
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stations/:id
app.get('/stations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const station = await Station.findOne({ station_id: id }, 'station_id name district_id -_id');

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles
app.get('/vehicles', async (req, res) => {
  try {
    const { station_id, district_id, province_id } = req.query;
    const filter = {};

    if (station_id) {
      filter.station_id = parseInt(station_id, 10);
    } else if (district_id) {
      const distId = parseInt(district_id, 10);
      const stations = await Station.find({ district_id: distId });
      filter.station_id = { $in: stations.map((s) => s.station_id) };
    } else if (province_id) {
      const provId = parseInt(province_id, 10);
      const districts = await District.find({ province_id: provId });
      const stations = await Station.find({
        district_id: { $in: districts.map((d) => d.district_id) },
      });
      filter.station_id = { $in: stations.map((s) => s.station_id) };
    }

    const vehicles = await Vehicle.find(
      filter,
      'vehicle_id reg_number device_id station_id -_id',
    );
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles/:vehicleId
app.get('/vehicles/:vehicleId', async (req, res) => {
  try {
    const vId = req.params.vehicleId;
    const numericId = parseInt(vId, 10);
    const query = {
      $or: [
        { vehicle_id: isNaN(numericId) ? -1 : numericId },
        { reg_number: new RegExp(`^${vId}$`, 'i') },
        { device_id: new RegExp(`^${vId}$`, 'i') },
      ],
    };

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Find last_ping: filter pings where vehicle_id matches, sort by timestamp descending, take [0]
    const lastPingDoc = await Ping.findOne({ vehicle_id: vehicle.vehicle_id }).sort({
      timestamp: -1,
    });
    let lastPing = null;

    if (lastPingDoc) {
      lastPing = {
        ping_id: lastPingDoc.ping_id,
        vehicle_id: lastPingDoc.vehicle_id,
        timestamp: lastPingDoc.timestamp.toISOString(),
        lat: lastPingDoc.lat,
        lng: lastPingDoc.lng,
        speed: lastPingDoc.speed,
      };
    }

    res.json({
      vehicle_id: vehicle.vehicle_id,
      reg_number: vehicle.reg_number,
      device_id: vehicle.device_id,
      station_id: vehicle.station_id,
      last_ping: lastPing,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles/:id/pings
app.get('/vehicles/:id/pings', async (req, res) => {
  try {
    const vId = req.params.id;
    const numericId = parseInt(vId, 10);
    const query = {
      $or: [
        { vehicle_id: isNaN(numericId) ? -1 : numericId },
        { reg_number: new RegExp(`^${vId}$`, 'i') },
        { device_id: new RegExp(`^${vId}$`, 'i') },
      ],
    };

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const pings = await Ping.find(
      { vehicle_id: vehicle.vehicle_id },
      'ping_id vehicle_id timestamp lat lng speed -_id',
    );
    const mapped = pings.map((p) => ({
      ping_id: p.ping_id,
      vehicle_id: p.vehicle_id,
      timestamp: p.timestamp.toISOString(),
      lat: p.lat,
      lng: p.lng,
      speed: p.speed,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vehicles/:vehicleId/last-position
app.get('/vehicles/:vehicleId/last-position', async (req, res) => {
  try {
    const vId = req.params.vehicleId;
    const numericId = parseInt(vId, 10);
    const query = {
      $or: [
        { vehicle_id: isNaN(numericId) ? -1 : numericId },
        { reg_number: new RegExp(`^${vId}$`, 'i') },
        { device_id: new RegExp(`^${vId}$`, 'i') },
      ],
    };

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const p = await Ping.findOne({ vehicle_id: vehicle.vehicle_id }).sort({
      timestamp: -1,
    });
    if (!p) {
      return res.status(404).json({ error: 'No pings found for this vehicle' });
    }

    res.json({
      vehicle_id: p.vehicle_id,
      timestamp: p.timestamp.toISOString(),
      lat: p.lat,
      lng: p.lng,
      speed: p.speed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /vehicles/:vehicleId/pings
app.post('/vehicles/:vehicleId/pings', async (req, res) => {
  try {
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

    const query = {
      $or: [
        { vehicle_id: isNaN(numericId) ? -1 : numericId },
        { reg_number: new RegExp(`^${vId}$`, 'i') },
        { device_id: new RegExp(`^${vId}$`, 'i') },
      ],
    };

    const vehicle = await Vehicle.findOne(query);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // 3. 403 if key does not match deviceKeys[vehicleId]
    const expectedKey = `key_v${String(vehicle.vehicle_id).padStart(2, '0')}`;
    if (apiKey !== expectedKey) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Invalid API key for this vehicle' });
    }

    // 4. 400 if body missing latitude, longitude, or speed
    const { latitude, longitude, speed } = req.body;
    if (latitude === undefined || longitude === undefined || speed === undefined) {
      return res
        .status(400)
        .json({ error: 'Bad Request: Missing latitude, longitude, or speed' });
    }

    // 5. Server sets timestamp
    const timestamp = new Date();

    // 6. Push ping to database (generate next ping_id)
    const maxPing = await Ping.findOne().sort({ ping_id: -1 });
    const newPingId = maxPing ? maxPing.ping_id + 1 : 1;

    const newPing = new Ping({
      ping_id: newPingId,
      vehicle_id: vehicle.vehicle_id,
      lat: Number(latitude),
      lng: Number(longitude),
      timestamp,
      speed: Number(speed),
    });

    await newPing.save();

    // 7. Set Location header: /vehicles/:vehicleId/pings/:pingId
    res.setHeader('Location', `/vehicles/${vehicle.vehicle_id}/pings/${newPingId}`);

    // 8. Set ETag and Last-Modified headers
    const crypto = require('crypto');
    const responseJson = {
      ping_id: newPing.ping_id,
      vehicle_id: newPing.vehicle_id,
      timestamp: newPing.timestamp.toISOString(),
      lat: newPing.lat,
      lng: newPing.lng,
      speed: newPing.speed,
    };
    const responseBody = JSON.stringify(responseJson);
    const etag = crypto.createHash('md5').update(responseBody).digest('base64');
    res.setHeader('ETag', `W/"${etag}"`);
    res.setHeader('Last-Modified', timestamp.toUTCString());

    // 9. Return 201 Created
    res.status(201).json(responseJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

if (require.main === module) {
  const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);
  startServer(DEFAULT_PORT);
}
