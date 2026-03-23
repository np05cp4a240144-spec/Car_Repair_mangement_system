const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing minStock values for all parts...');
  
  try {
    const allParts = await prisma.part.findMany();
    
    console.log(`Processing ${allParts.length} parts...`);
    let updatedCount = 0;

    for (const part of allParts) {
      let needsUpdate = false;
      let newMinStock = part.minStock || 5;

      if (!part.minStock || part.minStock === 0) {
        newMinStock = part.maxStock ? Math.ceil(part.maxStock * 0.2) : 5;
        if (newMinStock < 1) newMinStock = 5;
        needsUpdate = true;
      }

      let status = 'OK';
      if (part.stock <= newMinStock) status = 'Low';
      if (part.stock <= 2) status = 'Critical';

      if (needsUpdate || status !== part.status) {
        await prisma.part.update({
          where: { id: part.id },
          data: { 
            minStock: newMinStock,
            status 
          }
        });
        
        console.log(`✓ Updated ${part.name} (${part.sku}): minStock = ${newMinStock}, status = ${status}`);
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} parts successfully!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
