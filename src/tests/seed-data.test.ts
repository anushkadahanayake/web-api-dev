import fs from 'fs';
import path from 'path';

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
  province_id: number;
}

interface Station {
  id: number;
  name: string;
  district_id: number;
}

interface Vehicle {
  id: number;
  register_number: string;
  device_id: string;
  station_id: number;
}

interface Ping {
  id: number;
  vehicle_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface SeedData {
  provinces: Province[];
  districts: District[];
  stations: Station[];
  vehicles: Vehicle[];
  pings: Ping[];
}

describe('Police TukTuk Seed Data Integrity and FK Consistency', () => {
  let data: SeedData;
  let pkMaps: {
    provinces: Set<number>;
    districts: Set<number>;
    stations: Set<number>;
    vehicles: Set<number>;
    pings: Set<number>;
  };

  beforeAll(() => {
    const dataPath = path.resolve(__dirname, '../../police_tuktuk_seed_data.json');
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    pkMaps = {
      provinces: new Set(data.provinces.map((x) => x.id)),
      districts: new Set(data.districts.map((x) => x.id)),
      stations: new Set(data.stations.map((x) => x.id)),
      vehicles: new Set(data.vehicles.map((x) => x.id)),
      pings: new Set(data.pings.map((x) => x.id)),
    };
  });

  test('Primary keys should be unique in all tables', () => {
    const checkUnique = (table: keyof SeedData) => {
      const ids = data[table].map((x) => x.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    };

    checkUnique('provinces');
    checkUnique('districts');
    checkUnique('stations');
    checkUnique('vehicles');
    checkUnique('pings');
  });

  test('districts.province_id should refer to a valid province.id', () => {
    data.districts.forEach((d) => {
      const exists = pkMaps.provinces.has(d.province_id);
      if (!exists) {
        throw new Error(
          `District ID ${d.id} ("${d.name}") has invalid province_id: ${d.province_id}`,
        );
      }
      expect(exists).toBe(true);
    });
  });

  test('stations.district_id should refer to a valid district.id', () => {
    data.stations.forEach((s) => {
      const exists = pkMaps.districts.has(s.district_id);
      if (!exists) {
        throw new Error(
          `Station ID ${s.id} ("${s.name}") has invalid district_id: ${s.district_id}`,
        );
      }
      expect(exists).toBe(true);
    });
  });

  test('vehicles.station_id should refer to a valid station.id', () => {
    data.vehicles.forEach((v) => {
      const exists = pkMaps.stations.has(v.station_id);
      if (!exists) {
        throw new Error(
          `Vehicle ID ${v.id} ("${v.register_number}") has invalid station_id: ${v.station_id}`,
        );
      }
      expect(exists).toBe(true);
    });
  });

  test('pings.vehicle_id should refer to a valid vehicle.id', () => {
    data.pings.forEach((p) => {
      const exists = pkMaps.vehicles.has(p.vehicle_id);
      if (!exists) {
        throw new Error(`Ping ID ${p.id} has invalid vehicle_id: ${p.vehicle_id}`);
      }
      expect(exists).toBe(true);
    });
  });
});
