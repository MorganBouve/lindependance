import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Starting backfill of appointment.price from Service.price...')
    // Find all appointments with price null/0 — adjust criteria if needed
    const appts = await prisma.appointment.findMany({ include: { service: true } })
    let updated = 0
    for (const a of appts) {
      const currentPrice = a.price
      const servicePrice = a.service?.price
      if (currentPrice.isZero() && servicePrice != null) {
        await prisma.appointment.update({ where: { id: a.id }, data: { price: servicePrice } })
        updated++
      }
    }
    console.log(`Backfill complete. Updated ${updated} appointments.`)
  } catch (err) {
    console.error('Backfill failed', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) main()
