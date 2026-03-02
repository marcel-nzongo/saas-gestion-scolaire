import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.decimal('price_monthly', 10, 2).defaultTo(0);
    table.decimal('price_yearly', 10, 2).defaultTo(0);
    table.integer('max_students').notNullable();
    table.integer('max_teachers').notNullable();
    table.integer('max_storage_gb').defaultTo(10);
    table.jsonb('features').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex('plans').insert([
    {
      name: 'Gratuit',
      code: 'free',
      price_monthly: 0,
      price_yearly: 0,
      max_students: 50,
      max_teachers: 5,
      max_storage_gb: 2,
      features: JSON.stringify({
        grades: true,
        attendance: true,
        finance: false,
        notifications: false,
        reports: false,
      }),
    },
    {
      name: 'Standard',
      code: 'standard',
      price_monthly: 29.99,
      price_yearly: 299.99,
      max_students: 500,
      max_teachers: 50,
      max_storage_gb: 20,
      features: JSON.stringify({
        grades: true,
        attendance: true,
        finance: true,
        notifications: true,
        reports: true,
      }),
    },
    {
      name: 'Premium',
      code: 'premium',
      price_monthly: 79.99,
      price_yearly: 799.99,
      max_students: 9999,
      max_teachers: 999,
      max_storage_gb: 100,
      features: JSON.stringify({
        grades: true,
        attendance: true,
        finance: true,
        notifications: true,
        reports: true,
      }),
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plans');
}
