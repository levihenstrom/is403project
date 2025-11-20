// seeds/01_seed_resorts_areas_runs.js
const fs = require('fs');
const path = require('path');

/**
 * Simple CSV loader (no commas inside values).
 */
function loadCsv(relativePath) {
  const fullPath = path.join(__dirname, '..', 'data', relativePath);
  const text = fs.readFileSync(fullPath, 'utf8');

  const lines = text.trim().split('\n');
  const headers = lines.shift().split(',').map((h) => h.trim());

  return lines.map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, idx) => (row[h] = cols[idx]));
    return row;
  });
}

function toBool(val) {
  return ['true', '1', 't', 'yes', 'y'].includes(String(val).toLowerCase());
}

/**
 * @param {import("knex").Knex} knex
 */
exports.seed = async function (knex) {
  // Clear child → parent
  await knex('runs').del();
  await knex('areas').del();
  await knex('resorts').del();

  // -----------------------------
  // 1) RESORTS
  // -----------------------------
  const resortsCsv = loadCsv('resorts.csv');

  const resortData = resortsCsv.map((r) => ({
    resort_name: r['resort_name'],
    city: r.city,
    state: r.state,
    total_acres: parseInt(r.total_acres, 10),
    canyon_name: r.canyon_name,
    website: r.website,
    ski_patrol_phone: r.ski_patrol_phone,
    has_night_skiing: toBool(r.night_skiing),
  }));

  const insertedResorts = await knex('resorts')
    .insert(resortData)
    .returning(['resort_id']);

  const resortIdByIndex = {};
  insertedResorts.forEach((r, idx) => {
    const id = r.resort_id ?? r;
    resortIdByIndex[idx + 1] = id;
  });

  // -----------------------------
  // 2) AREAS
  // -----------------------------
  const areasCsv = loadCsv('area.csv');

  const areaData = areasCsv.map((a) => ({
    resort_id: resortIdByIndex[parseInt(a.resort_id, 10)],
    base_area: a.base_area,
    area_name: a.area_name,
  }));

  const insertedAreas = await knex('areas')
    .insert(areaData)
    .returning(['area_id']);

  const areaIdByIndex = {};
  insertedAreas.forEach((a, idx) => {
    const id = a.area_id ?? a;
    areaIdByIndex[idx + 1] = id;
  });

  // -----------------------------
  // 3) RUNS
  // -----------------------------
  const runCsvs = [
    ...loadCsv('beaver-runs.csv'),
    ...loadCsv('snowbird-runs.csv'),
    ...loadCsv('sundance-runs.csv'),
  ];

  const runData = runCsvs.map((r) => ({
    area_id: areaIdByIndex[parseInt(r.area_id, 10)],
    run_name: r.run_name,
    difficulty: r.difficulty,
    is_open: toBool(r.is_open),
    is_terrain_park: toBool(r.is_terrain_park),
    backcountry_access: toBool(r.backcountry_access),
    bootpack_req: toBool(r.bootpack_req),
  }));

  await knex('runs').insert(runData);

  // users & reports remain empty (user-generated)
};
