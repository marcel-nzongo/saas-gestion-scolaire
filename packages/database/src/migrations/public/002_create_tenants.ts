import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('subdomain', 100).notNullable().unique();
    table.string('schema_name', 100).notNullable().unique();
    table.uuid('plan_id').references('id').inTable('plans');
    table
      .enum('status', ['trial', 'active', 'suspended', 'cancelled'])
      .defaultTo('trial');
    table.string('country_code', 2).defaultTo('SN');
    table.string('timezone', 50).defaultTo('Africa/Dakar');
    table.string('locale', 10).defaultTo('fr');
    table.string('currency', 3).defaultTo('XOF');
    table.integer('max_students').defaultTo(50);
    table.integer('storage_quota_gb').defaultTo(2);
    table.string('logo_url', 500);
    table.string('address', 500);
    table.string('phone', 20);
    table.string('email', 255);
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('trial_ends_at');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tenants');
}
