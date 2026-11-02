async function main() {
  await import('dotenv/config')
  const { PrismaClient } = await import('@prisma/client')
  const p = new PrismaClient()
  try{
    const rows = await p.appointment.findMany({take:50, orderBy:{createdAt:'desc'}})
    const summary = rows.map(r=>({id:r.id, organizationId:r.organizationId, startNull: r.startTime==null, endNull: r.endTime==null, start:r.startTime, end:r.endTime, status:r.status}))
    console.log(JSON.stringify(summary,null,2))
  }catch(e){console.error(e)}finally{await p.$disconnect()}
}

void main()
