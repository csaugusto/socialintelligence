#!/usr/bin/env node
/**
 * Crear un usuario en la base de datos.
 *
 * Uso:
 *   node scripts/create-user.js <email> <password> [clientId] [role]
 *
 * Roles:
 *   superadmin — acceso total al sistema (solo para el operador del SaaS)
 *   admin      — admin de un cliente específico
 *   editor     — editor de un cliente específico
 *
 * Ejemplos:
 *   node scripts/create-user.js yo@empresa.com MiPass123 - superadmin
 *   node scripts/create-user.js jefe@medio.com Pass456 <clientId> admin
 *   node scripts/create-user.js editor@medio.com Pass789 <clientId> editor
 *
 * Si no se especifica clientId usa el cliente default (solo válido para superadmin).
 * Usa "-" como placeholder de clientId si quieres especificar role sin clientId.
 */

require('dotenv').config();

const [,, email, password, clientId, role] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/create-user.js <email> <password> [clientId] [role]');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL no está configurado en .env');
  process.exit(1);
}

const db = require('../src/db/index.js');

async function main() {
  try {
    const user = await db.createUser({
      email,
      password,
      clientId: (!clientId || clientId === '-') ? db.DEFAULT_CLIENT_ID : clientId,
      role: role || 'superadmin',
    });
    console.log('Usuario creado:');
    console.log(`  ID:        ${user.id}`);
    console.log(`  Email:     ${user.email}`);
    console.log(`  Role:      ${user.role}`);
    console.log(`  Client ID: ${user.client_id}`);
    console.log(`  Creado:    ${user.created_at}`);
  } catch (err) {
    if (err.code === '23505') {
      console.error(`Error: ya existe un usuario con el email "${email}"`);
    } else {
      console.error('Error creando usuario:', err.message);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
