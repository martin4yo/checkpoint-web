const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImages() {
  try {
    console.log('🔍 Revisando checkpoints con imágenes...');

    const checkpoints = await prisma.checkpoint.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10,
      select: {
        id: true,
        placeName: true,
        imageUrl: true,
        timestamp: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${checkpoints.length} checkpoints con imágenes:`);
    console.log('');

    checkpoints.forEach((checkpoint, index) => {
      console.log(`${index + 1}. ID: ${checkpoint.id}`);
      console.log(`   👤 Usuario: ${checkpoint.user.name} (${checkpoint.user.email})`);
      console.log(`   📍 Lugar: ${checkpoint.placeName}`);
      console.log(`   🖼️  ImageURL: "${checkpoint.imageUrl}"`);
      console.log(`   📅 Fecha: ${checkpoint.timestamp}`);
      console.log('');
    });

    console.log('🔗 URLs completas que deberían funcionar:');
    checkpoints.forEach((checkpoint, index) => {
      if (checkpoint.imageUrl) {
        const fullUrl = `https://checkpoint.axiomacloud.com${checkpoint.imageUrl}`;
        console.log(`${index + 1}. ${fullUrl}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();