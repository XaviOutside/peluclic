import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding pfmaster database…\n');

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
    const hasNotes = i % 4 !== 0;

    extraClients.push(
      prisma.client.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: `+34 6${String(i + 10).padStart(2, '0')} ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 900) + 100)}`,
          phone2: hasPhone2 ? `+34 9${String(i + 20).padStart(2, '0')} ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 900) + 100)}` : null,
          address: hasAddress
            ? `Calle ${lastName} ${i + 1}, ${i % 3 === 0 ? 'Madrid' : i % 3 === 1 ? 'Barcelona' : 'Valencia'}`
            : null,
          notes: hasNotes
            ? `Cliente desde ${2021 + (i % 4)}. ${i % 2 === 0 ? 'Prefiere citas por la mañana.' : 'Suele traer a su mascota cada 4-6 semanas.'}`
            : null,
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
          weightKg: i % 8 === 0 ? null : Number((1 + Math.random() * 40).toFixed(1)),
          notes: i % 3 === 0 ? null : `Notas de ${petNames[i]}: ${i % 2 === 0 ? 'Requiere manejo especial.' : 'Muy dócil y tranquilo.'}`,
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

  /* ── Summary ── */
  console.log('\n📊 Seed complete!');
  console.log(`   ${allClients.length} clients (2 inactive)`);
  console.log(`   ${allPets.length} pets`);
  console.log(`   ${allServices.length} services`);
  console.log('   ✅ Pagination ready — 20+ items per entity');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
