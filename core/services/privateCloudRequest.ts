import { Prisma, PrismaClient, $Enums } from '@prisma/client';
import { Session } from 'next-auth';
import { ModelService } from '../modelService';

export class PrivateCloudRequestService extends ModelService<Prisma.PrivateCloudRequestWhereInput> {
  async readFilter() {
    let baseFilter!: Prisma.PrivateCloudRequestWhereInput;
    if (!this.session.isAdmin) {
      const res = await this.client.privateCloudRequestedProject.findMany({
        select: { id: true },
      });

      const ids = res.map(({ id }) => id);

      baseFilter = {
        requestedProjectId: { in: ids },
      };
    }

    return baseFilter;
  }

  async writeFilter() {
    let baseFilter!: Prisma.PrivateCloudRequestWhereInput;
    if (!this.session.isAdmin) {
      baseFilter = {
        // Adding a dummy query to ensure no documents match
        created: new Date(),
      };
    }

    return baseFilter;
  }

  async decorate(doc: any) {
    doc._permissions = {
      view: true,
    };

    return doc;
  }
}