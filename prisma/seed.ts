import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ── Idempotent Seed Helpers ─────────────────────────────────────────

export async function seedCompany(
  client: PrismaClient,
  name: string,
): Promise<{ id: number; name: string; status: number }> {
  const company = await client.company.upsert({
    where: { id: 1 },
    create: { id: 1, name, status: 1 },
    update: {}, // no-op — preserve existing row
  });

  return company;
}

export async function seedAdminUser(
  client: PrismaClient,
  companyId: number,
  email: string,
  password: string,
): Promise<{
  id: number;
  companyId: number;
  email: string;
  passwordHash: string;
  role: number;
  status: number;
}> {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    hashLength: 32,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const user = await client.user.upsert({
    where: { email },
    create: {
      companyId,
      email,
      passwordHash: hash,
      role: 0, // admin
      status: 1, // active
    },
    update: {}, // no-op — preserve existing row
  });

  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
  };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generatePhone(seed: number): string {
  const a = String(Math.floor(seededRandom(seed) * 900) + 100);
  const b = String(Math.floor(seededRandom(seed + 1) * 900) + 100);
  return `${a} ${b}`;
}

function generateAddress(i: number, lastName: string): string {
  let city: string;
  if (i % 3 === 0) {
    city = 'Madrid';
  } else if (i % 3 === 1) {
    city = 'Barcelona';
  } else {
    city = 'Valencia';
  }
  return `Calle ${lastName} ${i + 1}, ${city}`;
}

function generateNotes(i: number): string | null {
  if (i % 4 === 0) return null;
  let msg: string;
  if (i % 2 === 0) {
    msg = 'Prefiere citas por la mañana.';
  } else {
    msg = 'Suele traer a su mascota cada 4-6 semanas.';
  }
  return `Cliente desde ${2021 + (i % 4)}. ${msg}`;
}

function generatePetNotes(i: number, petName: string): string | null {
  if (i % 3 === 0) return null;
  let trait: string;
  if (i % 2 === 0) {
    trait = 'Requiere manejo especial.';
  } else {
    trait = 'Muy dócil y tranquilo.';
  }
  return `Notas de ${petName}: ${trait}`;
}

function generatePetWeight(i: number): number | null {
  if (i % 8 === 0) return null;
  return Number((1 + seededRandom(i * 100 + 200) * 40).toFixed(1));
}

async function main() {
  console.log('🌱 Seeding pfmaster database…\n');

  /* ── Company & Admin User (idempotent) ── */
  const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
  if (!SEED_ADMIN_PASSWORD) {
    console.warn('⚠️  SEED_ADMIN_PASSWORD not set — default company will be created but no admin user.');
  }

  const company = await seedCompany(prisma, 'Bark & Bubbles');
  console.log(`✅ Company "${company.name}" (id=${company.id}) ready`);

  if (SEED_ADMIN_PASSWORD) {
    const admin = await seedAdminUser(prisma, company.id, 'admin@peluclic.com', SEED_ADMIN_PASSWORD);
    console.log(`✅ Admin user "${admin.email}" (id=${admin.id}) ready`);
  } else {
    console.log('⚠️  Skipping admin user creation — set SEED_ADMIN_PASSWORD to create the admin user.');
  }

  /* ── Clients ── */
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'María García',
        email: 'maria.g@email.com',
        phone: '+34 600 123 456',
        phone2: '+34 911 234 567',
        address: 'Calle Mayor 12, Madrid',
        notes: 'Clienta habitual desde 2022. Prefiere corte corto en verano. Su perro Max tiene alergia a ciertos champús.',
        lastServiceDate: new Date('2026-06-15'),
        status: 1,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Carlos Ruiz',
        email: 'c.ruiz@email.com',
        phone: '+34 611 987 654',
        phone2: '+34 922 876 543',
        address: 'Avenida de la Playa 45, Valencia',
        notes: 'Viene cada 6 semanas. Siempre pide cita los viernes por la tarde. Su gato Rocky es muy nervioso.',
        lastServiceDate: new Date('2026-06-28'),
        status: 1,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Laura López',
        email: 'laura.l@email.com',
        phone: '+34 622 345 678',
        phone2: null,
        address: 'Calle Luna 8, Sevilla',
        notes: 'Clienta nueva desde mayo 2026. Tiene una coneja (Bella) que necesita cuidados especiales.',
        lastServiceDate: new Date('2026-07-03'),
        status: 1,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Miguel Fernández',
        email: 'miguel.f@email.com',
        phone: '+34 633 111 222',
        phone2: '+34 633 111 333',
        address: 'Plaza del Sol 3, Barcelona',
        notes: 'Dueño de un loro (Coco). Necesita servicio de corte de uñas y pico cada 2 meses. Muy puntual.',
        lastServiceDate: new Date('2026-07-10'),
        status: 1,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Ana Martínez',
        email: 'ana.m@email.com',
        phone: '+34 644 444 555',
        phone2: null,
        address: 'Calle Río 67, Bilbao',
        notes: null,
        lastServiceDate: null,
        status: 1,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Pedro Sánchez',
        email: 'pedro.s@email.com',
        phone: '+34 655 666 777',
        phone2: null,
        address: null,
        notes: null,
        lastServiceDate: null,
        status: 0, // inactive
      },
    }),
  ]);

  console.log(`✅ ${clients.length} clients created`);

  /* ── More clients (for pagination testing) ── */
  const extraClients = [];
  const firstNames = [
    'Alejandro', 'Beatriz', 'Carmen', 'Diego', 'Elena', 'Francisco', 'Gloria', 'Héctor',
    'Isabel', 'Javier', 'Karla', 'Luis', 'Mónica', 'Nicolás', 'Olga', 'Pablo',
    'Rosa', 'Sergio', 'Teresa', 'Víctor',
  ];
  const lastNames = [
    'Torres', 'Ramírez', 'Flores', 'Díaz', 'Morales', 'Ortiz', 'Herrera', 'Castro',
    'Vargas', 'Reyes', 'Guzmán', 'Mendoza', 'Silva', 'Peña', 'Rojas', 'Navarro',
    'Delgado', 'Cruz', 'León', 'Campos',
  ];

  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const hasPhone2 = i % 3 !== 0;
    const hasAddress = i % 2 === 0;

    extraClients.push(
      prisma.client.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: `+34 6${String(i + 10).padStart(2, '0')} ${generatePhone(i * 100)}`,
          phone2: hasPhone2
            ? `+34 9${String(i + 20).padStart(2, '0')} ${generatePhone(i * 100 + 50)}`
            : null,
          address: hasAddress ? generateAddress(i, lastName) : null,
          notes: generateNotes(i),
          lastServiceDate: i % 5 !== 0 ? new Date(2026, 6, i + 1) : null,
          status: i === 19 ? 0 : 1, // last one inactive
        },
      })
    );
  }

  const createdExtraClients = await Promise.all(extraClients);
  const allClients = [...clients, ...createdExtraClients];
  console.log(`✅ ${createdExtraClients.length} extra clients created (${allClients.length} total)`);

  /* ── Pets ── */
  const [maria, carlos, laura, miguel, ana] = clients;

  const pets = await Promise.all([
    prisma.pet.create({
      data: {
        client_id: maria.id,
        name: 'Max',
        species: 'Perro',
        breed: 'Golden Retriever',
        sex: 1, // male
        dateOfBirth: new Date('2020-03-15'),
        weightKg: 32.5,
        notes: 'Alergia a champús con perfume. Usar solo productos hipoalergénicos.',
        status: 1,
      },
    }),
    prisma.pet.create({
      data: {
        client_id: maria.id,
        name: 'Luna',
        species: 'Gato',
        breed: 'Siamés',
        sex: 2, // female
        dateOfBirth: new Date('2021-08-22'),
        weightKg: 4.2,
        notes: 'Muy tranquila. No le gusta el secador.',
        status: 1,
      },
    }),
    prisma.pet.create({
      data: {
        client_id: carlos.id,
        name: 'Rocky',
        species: 'Gato',
        breed: 'Persa',
        sex: 1, // male
        dateOfBirth: new Date('2019-11-01'),
        weightKg: 5.8,
        notes: 'Muy nervioso con extraños. Necesita manejo suave. Avisar si se estresa.',
        status: 1,
      },
    }),
    prisma.pet.create({
      data: {
        client_id: laura.id,
        name: 'Bella',
        species: 'Conejo',
        breed: 'Mini Lop',
        sex: 2, // female
        dateOfBirth: new Date('2025-01-10'),
        weightKg: 1.8,
        notes: 'Coneja enana. Necesita corte de uñas frecuente. Manejar con cuidado — huesos frágiles.',
        status: 1,
      },
    }),
    prisma.pet.create({
      data: {
        client_id: miguel.id,
        name: 'Coco',
        species: 'Ave',
        breed: 'Agapornis',
        sex: 1, // male
        dateOfBirth: new Date('2024-06-05'),
        weightKg: 0.05,
        notes: 'Loro pequeño. Viene para corte de uñas y pico. Habla un poco.',
        status: 1,
      },
    }),
    prisma.pet.create({
      data: {
        client_id: ana.id,
        name: 'Toby',
        species: 'Perro',
        breed: 'Bulldog Francés',
        sex: 1, // male
        dateOfBirth: new Date('2022-12-20'),
        weightKg: 12.0,
        notes: null,
        status: 1,
      },
    }),
    prisma.pet.create({
      data: {
        client_id: carlos.id,
        name: 'Nala',
        species: 'Perro',
        breed: 'Border Collie',
        sex: 2, // female
        dateOfBirth: new Date('2023-04-10'),
        weightKg: 18.0,
        notes: 'Muy activa. Necesita paseo antes del servicio para que esté calmada.',
        status: 1,
      },
    }),
  ]);

  console.log(`✅ ${pets.length} pets created`);

  /* ── More pets (for pagination) ── */
  const extraPets = [];
  const petSpecies = ['Perro', 'Gato', 'Perro', 'Gato', 'Conejo', 'Ave', 'Perro', 'Gato'];
  const petBreeds = ['Labrador', 'Angora', 'Pastor Alemán', 'Maine Coon', 'Holland Lop', 'Periquito', 'Beagle', 'Sphynx'];
  const petNames = ['Simba', 'Nala', 'Toby', 'Milo', 'Coco', 'Kira', 'Zeus', 'Lola', 'Bruno', 'Mia', 'Thor', 'Daisy',
    'Rex', 'Chispa', 'Duke', 'Sasha', 'Oso', 'Cleo', 'Leo', 'Frida'];

  for (let i = 0; i < 20; i++) {
    const owner = allClients[i % allClients.length];
    extraPets.push(
      prisma.pet.create({
        data: {
          client_id: owner.id,
          name: petNames[i],
          species: petSpecies[i % petSpecies.length],
          breed: petBreeds[i % petBreeds.length],
          sex: (i % 3) as 0 | 1 | 2, // 0=unknown, 1=male, 2=female
          dateOfBirth: new Date(2020 + (i % 6), i % 12, (i % 28) + 1),
          weightKg: generatePetWeight(i),
          notes: generatePetNotes(i, petNames[i]),
          status: i === 19 ? 0 : 1,
        },
      })
    );
  }

  const createdExtraPets = await Promise.all(extraPets);
  const allPets = [...pets, ...createdExtraPets];
  console.log(`✅ ${createdExtraPets.length} extra pets created (${allPets.length} total)`);

  /* ── Services ── */
  const [max, luna, rocky, bella, coco, toby, nala] = pets;

  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Baño completo',
        description: 'Baño con champú hipoalergénico, secado y cepillado. Incluye limpieza de oídos.',
        durationMinutes: 45,
        price: 3500, // €35.00
        petId: max.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte de pelo',
        description: 'Corte completo según raza y preferencia del cliente. Incluye deslanado si es necesario.',
        durationMinutes: 60,
        price: 4500, // €45.00
        petId: luna.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte de uñas',
        description: 'Corte y limado de uñas para perros, gatos y pequeños mamíferos.',
        durationMinutes: 15,
        price: 1200, // €12.00
        petId: null,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Limpieza dental',
        description: 'Limpieza bucal sin anestesia. Eliminación de sarro y placa bacteriana.',
        durationMinutes: 30,
        price: 5500, // €55.00
        petId: rocky.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Baño medicinal',
        description: 'Baño con productos dermatológicos recetados. Para pieles sensibles o con afecciones.',
        durationMinutes: 40,
        price: 4000, // €40.00
        petId: bella.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Desparasitación',
        description: 'Tratamiento antiparasitario interno y externo. Según peso y especie.',
        durationMinutes: 10,
        price: 1800, // €18.00
        petId: null,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Peluquería completa',
        description: 'Baño + corte de pelo + corte de uñas + limpieza de oídos. Pack completo.',
        durationMinutes: 90,
        price: 6500, // €65.00
        petId: toby.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Cepillado profesional',
        description: 'Cepillado exhaustivo para eliminar pelo muerto. Ideal para razas de pelo largo.',
        durationMinutes: 30,
        price: 2000, // €20.00
        petId: nala.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte de uñas para aves',
        description: 'Corte de uñas y pico para aves pequeñas. Manejo especializado.',
        durationMinutes: 20,
        price: 1500, // €15.00
        petId: coco.id,
        status: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Limpieza de oídos',
        description: 'Limpieza profunda de conducto auditivo. Recomendado para razas con orejas caídas.',
        durationMinutes: 15,
        price: 1000, // €10.00
        petId: max.id,
        status: 1,
      },
    }),
  ]);

  console.log(`✅ ${services.length} services created`);

  /* ── More services (for pagination) ── */
  const extraServices = [];
  const serviceNames = [
    'Baño premium', 'Corte a tijera', 'Peinado creativo', 'Tinte natural',
    'Spa canino', 'Corte higiénico', 'Masaje relajante', 'Planchado',
    'Baño express', 'Corte a máquina', 'Deslanado', 'Perfume profesional',
  ];

  for (let i = 0; i < 12; i++) {
    const pet = allPets[i % allPets.length];
    extraServices.push(
      prisma.service.create({
        data: {
          name: serviceNames[i],
          description: `Servicio profesional de ${serviceNames[i].toLowerCase()} adaptado a cada mascota. Incluye revisión general.`,
          durationMinutes: [15, 20, 30, 45, 60, 90][i % 6],
          price: [1200, 1800, 2500, 3500, 4500, 5500][i % 6], // cents
          petId: i % 4 === 0 ? null : pet.id, // some unlinked
          status: 1,
        },
      })
    );
  }

  const createdExtraServices = await Promise.all(extraServices);
  const allServices = [...services, ...createdExtraServices];
  console.log(`✅ ${createdExtraServices.length} extra services created (${allServices.length} total)`);

  /* ── Company Settings (singleton) ── */
  const settings = await prisma.companySettings.create({
    data: {
      companyName: 'Bark & Bubbles',
      workdays: [1, 2, 3, 4, 5],
      workStartTime: '09:00',
      workEndTime: '17:00',
      defaultLang: 0,
    },
  });
  console.log(`✅ Company settings created (id=${settings.id})`);

  /* ── Summary ── */
  console.log('\n📊 Seed complete!');
  console.log(`   ${allClients.length} clients (2 inactive)`);
  console.log(`   ${allPets.length} pets`);
  console.log(`   ${allServices.length} services`);
  console.log('   ✅ Pagination ready — 20+ items per entity');
}

// Only run when executed directly (e.g. `tsx prisma/seed.ts`), not when imported by tests
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('prisma/seed')) {
  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
