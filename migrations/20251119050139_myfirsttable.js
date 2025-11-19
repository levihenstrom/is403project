/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1) Resorts
    await knex.schema.createTable('resorts', function (table) {
      table.increments('resort_id').primary();               // serial
      table.string('resort_name', 100).notNullable();
      table.string('city', 50);
      table.string('state', 2);
      table.string('website', 200);
      table.integer('total_acres');
      table.string('canyon_name', 50);
      table.string('ski_patrol_phone', 12);
      table.boolean('has_night_skiing').defaultTo(false);
      table.timestamp('date_created').defaultTo(knex.fn.now());
    });
  
    // 2) Areas (FK → resorts)
    await knex.schema.createTable('areas', function (table) {
      table.increments('area_id').primary();                 // serial
      table
        .integer('resort_id')
        .notNullable()
        .references('resort_id')
        .inTable('resorts')
        .onDelete('CASCADE');
      table.string('base_area', 50);
      table.string('zone_name', 50);
      table.timestamp('date_created').defaultTo(knex.fn.now());
    });
  
    // 3) Runs (FK → areas)
    await knex.schema.createTable('runs', function (table) {
      table.increments('run_id').primary();                  // serial
      table
        .integer('area_id')
        .notNullable()
        .references('area_id')
        .inTable('areas')
        .onDelete('CASCADE');
      table.string('run_name', 100).notNullable();
      table.string('difficulty', 20);
      table.string('condition', 100);
      table.boolean('is_open').defaultTo(true);
      table.boolean('is_terrain_park').defaultTo(false);
      table.boolean('backcountry_access').defaultTo(false);
      table.boolean('bootpack_req').defaultTo(false);
      table.timestamp('date_created').defaultTo(knex.fn.now());
    });
  
    // 4) Users (fav_resort FK → resorts, email AK)
    await knex.schema.createTable('users', function (table) {
      table.increments('user_id').primary();                 // serial
      table.string('username', 50).notNullable();
      table.string('email', 100).notNullable().unique();     // AK = alternate key
      table.text('password').notNullable();
      table.string('first_name', 50);
      table.string('last_name', 50);
      table.date('birthday');
      table
        .integer('fav_resort')
        .references('resort_id')
        .inTable('resorts')
        .onDelete('SET NULL');                               // or CASCADE if you prefer
      table.timestamp('date_created').defaultTo(knex.fn.now());
    });
  
    // 5) Reports (FK → runs, users)
    await knex.schema.createTable('reports', function (table) {
      table.increments('report_id').primary();               // serial
      table
        .integer('run_id')
        .notNullable()
        .references('run_id')
        .inTable('runs')
        .onDelete('CASCADE');
      table
        .integer('user_id')
        .notNullable()
        .references('user_id')
        .inTable('users')
        .onDelete('CASCADE');
  
      table.boolean('obstacle').defaultTo(false);
      table.text('description');
      table.text('image_url');
  
      table.boolean('groomed').defaultTo(false);
      table.boolean('icy').defaultTo(false);
      table.boolean('powder').defaultTo(false);
      table.boolean('moguls').defaultTo(false);
      table.boolean('granular').defaultTo(false);
      table.boolean('thin_cover').defaultTo(false);
      table.boolean('packed').defaultTo(false);
      table.boolean('wet').defaultTo(false);
  
      table.timestamp('date_reported').defaultTo(knex.fn.now());
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function (knex) {
    // Drop in reverse dependency order
    await knex.schema.dropTableIfExists('reports');
    await knex.schema.dropTableIfExists('users');
    await knex.schema.dropTableIfExists('runs');
    await knex.schema.dropTableIfExists('areas');
    await knex.schema.dropTableIfExists('resorts');
  };