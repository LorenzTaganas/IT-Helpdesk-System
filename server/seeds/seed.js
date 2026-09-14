/**
 * ITFlow Seed Script
 *
 * Run with: npm run seed
 *
 * This creates demo users, departments, and initial data.
 * It is safe to run multiple times — it will clear existing data first.
 *
 * Demo Accounts:
 * ┌─────────────────────────────┬────────────────────────────┬──────────────┐
 * │ Role                        │ Email                      │ Password     │
 * ├─────────────────────────────┼────────────────────────────┼──────────────┤
 * │ Super Admin                 │ superadmin@itflow.local    │ Admin@123    │
 * │ IT Admin                    │ admin@itflow.local         │ Admin@123    │
 * │ IT Support                  │ support@itflow.local       │ Support@123  │
 * │ IT Support 2                │ support2@itflow.local      │ Support@123  │
 * │ Employee (HR)               │ employee@itflow.local      │ Employee@123 │
 * │ + 8 more employees          │ (see below)                │ Employee@123 │
 * └─────────────────────────────┴────────────────────────────┴──────────────┘
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  // ── Clear existing data ──────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await User.deleteMany({});
  await Department.deleteMany({});
  console.log('✅ Cleared Users and Departments.');

  // ── Create Departments ────────────────────────────────────────────────────
  console.log('🏢 Creating departments...');
  const deptData = [
    { name: 'IT', description: 'Information Technology Department' },
    { name: 'Human Resources', description: 'HR and People Management' },
    { name: 'Finance', description: 'Finance and Accounting' },
    { name: 'Marketing', description: 'Marketing and Communications' },
    { name: 'Sales', description: 'Sales and Business Development' },
    { name: 'Operations', description: 'Operations and Administration' },
    { name: 'Customer Service', description: 'Customer Support and Relations' },
  ];

  const departments = await Department.insertMany(deptData);
  const deptMap = {};
  departments.forEach((d) => { deptMap[d.name] = d._id; });
  console.log(`✅ Created ${departments.length} departments.`);

  // ── Create Users ──────────────────────────────────────────────────────────
  console.log('👤 Creating users...');

  const usersToCreate = [
    // ── System Accounts ──────────────────────────────────────────────────
    {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@itflow.local',
      password: 'Admin@123',
      role: 'super_admin',
      department: deptMap['IT'],
      position: 'System Administrator',
    },
    {
      firstName: 'Ricardo',
      lastName: 'Mendoza',
      email: 'admin@itflow.local',
      password: 'Admin@123',
      role: 'it_admin',
      department: deptMap['IT'],
      position: 'IT Manager',
    },
    {
      firstName: 'Mark',
      lastName: 'Santos',
      email: 'support@itflow.local',
      password: 'Support@123',
      role: 'it_support',
      department: deptMap['IT'],
      position: 'IT Support Specialist',
    },
    {
      firstName: 'Jessa',
      lastName: 'Reyes',
      email: 'support2@itflow.local',
      password: 'Support@123',
      role: 'it_support',
      department: deptMap['IT'],
      position: 'IT Support Technician',
    },

    // ── Regular Employees ────────────────────────────────────────────────
    {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'employee@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Human Resources'],
      position: 'HR Officer',
    },
    {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Finance'],
      position: 'Accountant',
    },
    {
      firstName: 'Jose',
      lastName: 'Ramos',
      email: 'jose.ramos@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Sales'],
      position: 'Sales Executive',
    },
    {
      firstName: 'Ana',
      lastName: 'Torres',
      email: 'ana.torres@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Marketing'],
      position: 'Marketing Associate',
    },
    {
      firstName: 'Carlos',
      lastName: 'Villanueva',
      email: 'carlos.villanueva@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Operations'],
      position: 'Operations Coordinator',
    },
    {
      firstName: 'Liza',
      lastName: 'Domingo',
      email: 'liza.domingo@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Customer Service'],
      position: 'Customer Service Representative',
    },
    {
      firstName: 'Patrick',
      lastName: 'Aquino',
      email: 'patrick.aquino@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Finance'],
      position: 'Finance Analyst',
    },
    {
      firstName: 'Claire',
      lastName: 'Bautista',
      email: 'claire.bautista@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Human Resources'],
      position: 'Recruitment Specialist',
    },
    {
      firstName: 'Ramon',
      lastName: 'Ocampo',
      email: 'ramon.ocampo@itflow.local',
      password: 'Employee@123',
      role: 'employee',
      department: deptMap['Sales'],
      position: 'Sales Manager',
    },
  ];

  // Create users one at a time so pre-save hook (hashing + ID gen) runs correctly
  const createdUsers = [];
  for (const userData of usersToCreate) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
    console.log(`  ✓ Created ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`);
  }

  console.log(`\n✅ Seeding complete! Created ${createdUsers.length} users.\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DEMO ACCOUNTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Super Admin  → superadmin@itflow.local  / Admin@123');
  console.log('  IT Admin     → admin@itflow.local        / Admin@123');
  console.log('  IT Support   → support@itflow.local      / Support@123');
  console.log('  Employee     → employee@itflow.local     / Employee@123');
  console.log('═══════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});
