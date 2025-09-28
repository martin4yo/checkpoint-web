import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@checkpoint.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@checkpoint.com',
      password: hashedPassword,
    },
  })

  // Crear lugares de ejemplo
  const places = [
    {
      name: 'Oficina Central',
      address: 'Av. Principal 123, Buenos Aires',
      latitude: -34.603722,
      longitude: -58.381592,
    },
    {
      name: 'Sucursal Norte',
      address: 'Calle Norte 456, Buenos Aires',
      latitude: -34.555819,
      longitude: -58.449978,
    },
    {
      name: 'Almacén Sur',
      address: 'Av. Sur 789, Buenos Aires',
      latitude: -34.650299,
      longitude: -58.465432,
    },
    {
      name: 'Centro de Distribución',
      address: 'Ruta 9 Km 42, Buenos Aires',
      latitude: -34.470829,
      longitude: -58.523456,
    },
    {
      name: 'Punto de Control A',
      address: 'Zona Industrial, Buenos Aires',
      latitude: -34.678901,
      longitude: -58.345678,
    },
  ]

  for (const placeData of places) {
    const existingPlace = await prisma.place.findFirst({
      where: { name: placeData.name }
    })

    if (!existingPlace) {
      await prisma.place.create({
        data: placeData,
      })
    }
  }

  console.log('🌱 Database seeded successfully!')
  console.log('Admin user: admin@checkpoint.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })