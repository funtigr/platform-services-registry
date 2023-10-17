import { NextRequest, NextResponse } from "next/server";
import {
  DecisionStatus,
  PrivateCloudRequest,
  PrivateCloudRequestedProject,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { string, z } from "zod";
// import { sendProvisionedEmails } from "../ches/emailHandlers.js";

// See this for pagination: https://github.com/Puppo/it-s-prisma-time/blob/10-pagination/src/index.ts

export type PrivateCloudRequestWithRequestedProject =
  Prisma.PrivateCloudRequestGetPayload<{
    include: {
      requestedProject: true;
    };
  }>;

const ParamsSchema = z.object({
  licencePlate: string(),
});

type Params = z.infer<typeof ParamsSchema>;

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const parsedParams = ParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return new NextResponse(parsedParams.error.message, { status: 400 });
  }

  const { licencePlate } = params;

  try {
    const request: PrivateCloudRequestWithRequestedProject | null =
      await prisma.privateCloudRequest.findFirst({
        where: {
          decisionStatus: DecisionStatus.APPROVED,
          licencePlate,
          active: true,
        },
        include: {
          requestedProject: true,
        },
      });

    if (!request) {
      console.log("No provision request found for project: " + licencePlate);
      return new NextResponse("No requetst found for this licece plate.", {
        status: 404,
      });
    }

    const updateRequest = prisma.privateCloudRequest.update({
      where: {
        id: request.id,
      },
      data: {
        decisionStatus: DecisionStatus.PROVISIONED,
        active: false,
      },
    });

    const { id, ...requestedProject } = request.requestedProject;

    // Upsert the project with the requested project data. If admin requested project data exists, use that instead.
    const upsertProject = prisma.privateCloudProject.upsert({
      where: {
        licencePlate: licencePlate,
      },
      update: requestedProject as PrivateCloudRequestedProject,
      create: requestedProject as PrivateCloudRequestedProject,
    });

    await prisma.$transaction([updateRequest, upsertProject]);

    // sendProvisionedEmails(request);
    return new NextResponse(
      `Successfuly marked ${licencePlate} as provisioned.`,
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error.message);
    return new NextResponse(error.message, { status: 500 });
  }
}