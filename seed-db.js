require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Province, District, Station, Vehicle, Ping } = require('./index');

const SEED_DATA_PATH = path.join(__dirname, 'seed.json');

async function seed() {
  try {
    console.log('Reading seed.json...');
    const raw = fs.readFileSync(SEED_DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    console.log('Parsed seed.json successfully.');

    // 1. Clean Collections
    console.log('Cleaning existing collections...');
    await Province.deleteMany({});
    await District.deleteMany({});
    await Station.deleteMany({});
    await Vehicle.deleteMany({});
    await Ping.deleteMany({});
    console.log('Collections cleared.');

    // 2. Seed Provinces
    console.log('Seeding Provinces...');
    const mappedProvinces = data.provinces.map((p) => ({
      province_id: p.id,
      name: p.name,
    }));
    await Province.insertMany(mappedProvinces);
    console.log(`Seeded ${mappedProvinces.length} provinces.`);

    // 3. Seed Districts
    console.log('Seeding Districts...');
    const mappedDistricts = data.districts.map((d) => ({
      district_id: d.id,
      name: d.name,
      province_id: d.province_id,
    }));
    await District.insertMany(mappedDistricts);
    console.log(`Seeded ${mappedDistricts.length} districts.`);

    // 4. Seed Stations
    console.log('Seeding Stations...');
    const mappedStations = data.stations.map((s) => ({
      station_id: s.id,
      name: s.name,
      district_id: s.district_id,
    }));
    await Station.insertMany(mappedStations);
    console.log(`Seeded ${mappedStations.length} stations.`);

    // 5. Seed Vehicles
    console.log('Seeding Vehicles...');
    const mappedVehicles = data.vehicles.map((v) => ({
      vehicle_id: v.id,
      reg_number: v.register_number,
      device_id: v.device_id,
      station_id: v.station_id,
    }));
    await Vehicle.insertMany(mappedVehicles);
    console.log(`Seeded ${mappedVehicles.length} vehicles.`);

    // 6. Seed Pings (Batched to prevent MongoDB payload overflow errors)
    console.log('Seeding Pings...');
    const mappedPings = data.pings.map((p) => ({
      ping_id: p.id,
      vehicle_id: p.vehicle_id,
      timestamp: new Date(p.timestamp),
      lat: p.latitude,
      lng: p.longitude,
      speed: p.speed !== undefined ? p.speed : 0,
    }));

    // Batch in chunks of 5000 records
    const chunkSize = 5000;
    for (let i = 0; i < mappedPings.length; i += chunkSize) {
      const chunk = mappedPings.slice(i, i + chunkSize);
      await Ping.insertMany(chunk);
      console.log(`Seeded pings ${i + 1} to ${Math.min(i + chunkSize, mappedPings.length)}...`);
    }
    console.log(`Seeded all ${mappedPings.length} location pings successfully.`);

    console.log('\nDatabase seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed with error:', err);
  } finally {
    mongoose.connection.close();
    console.log('Connection to MongoDB closed.');
  }
}

// Wait for mongoose connection in index.js to open, or trigger seed directly if already connected
if (mongoose.connection.readyState === 1) {
  seed();
} else {
  mongoose.connection.once('open', seed);
}
