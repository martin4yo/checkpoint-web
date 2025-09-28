const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    const checkpointCount = await prisma.checkpoint.count()
    console.log(`Total checkpoints: ${checkpointCount}`)

    if (checkpointCount > 0) {
      const latestCheckpoints = await prisma.checkpoint.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          place: { select: { name: true } }
        }
      })

      console.log('\nÚltimos 5 checkpoints:')
      latestCheckpoints.forEach((checkpoint, index) => {
        console.log(`${index + 1}. ${checkpoint.placeName} - ${checkpoint.user.name} - ${new Date(checkpoint.timestamp).toLocaleString()}`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()