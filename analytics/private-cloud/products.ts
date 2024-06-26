import { $Enums } from '@prisma/client';
import _forEach from 'lodash-es/forEach';
import _uniq from 'lodash-es/uniq';
import prisma from '@/core/prisma';
import { dateToShortDateString, shortDateStringToDate, compareYearMonth } from '@/utils/date';

type ValidCluster = typeof $Enums.Cluster.SILVER | typeof $Enums.Cluster.GOLD | typeof $Enums.Cluster.EMERALD;

export async function productsCreatedPerMonth() {
  const [projects, deleteRequests] = await Promise.all([
    prisma.privateCloudProject.findMany({
      where: {
        cluster: { in: [$Enums.Cluster.SILVER, $Enums.Cluster.GOLD, $Enums.Cluster.EMERALD] },
      },
      select: {
        licencePlate: true,
        cluster: true,
        created: true,
        status: true,
      },
      orderBy: {
        created: 'asc',
      },
    }),
    prisma.privateCloudRequest.findMany({
      where: {
        type: $Enums.RequestType.DELETE,
        decisionStatus: $Enums.DecisionStatus.PROVISIONED,
      },
      select: {
        licencePlate: true,
        created: true,
      },
    }),
  ]);

  const result: {
    [key: string]: {
      all: number;
      [$Enums.Cluster.SILVER]: number;
      [$Enums.Cluster.GOLD]: number;
      [$Enums.Cluster.EMERALD]: number;
    };
  } = {};

  const allShortDateStrs = _uniq(projects.map((proj) => dateToShortDateString(proj.created)));
  const allDates = allShortDateStrs.map(shortDateStringToDate);

  _forEach(allDates, (dt, i) => {
    _forEach(projects, (proj) => {
      if (compareYearMonth(dt, proj.created) < 0) return;
      const deleteRequest = deleteRequests.find((req) => req.licencePlate === proj.licencePlate);

      if (deleteRequest) {
        if (compareYearMonth(dt, deleteRequest.created) === 1) {
          return;
        }
      }

      const key = allShortDateStrs[i];
      if (!result[key]) {
        result[key] = { all: 0, [$Enums.Cluster.SILVER]: 0, [$Enums.Cluster.GOLD]: 0, [$Enums.Cluster.EMERALD]: 0 };
      }

      result[key].all++;
      result[key][proj.cluster as ValidCluster]++;
    });
  });

  return result;
}

export async function numberOfProductsOverTime() {
  const result = await productsCreatedPerMonth();

  const data = Object.entries(result).map(([date, counts]) => ({
    date,
    'All Clusters': counts.all,
    Silver: counts[$Enums.Cluster.SILVER],
    Gold: counts[$Enums.Cluster.GOLD],
    Emerald: counts[$Enums.Cluster.EMERALD],
  }));

  return data;
}
