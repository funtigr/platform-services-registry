import prisma from '@/core/prisma';

export default async function listOp() {
  const products = await prisma.privateCloudProject.findMany({
    where: {},
    skip: 0,
    take: 2,
  });
  return products;
}
