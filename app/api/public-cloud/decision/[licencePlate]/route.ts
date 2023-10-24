import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DecisionStatus, Cluster } from '@prisma/client';
import { string, z } from 'zod';
import { PublicCloudDecisionRequestBodySchema } from '@/schema';
import makeDecisionRequest, {
  PublicCloudRequestWithRequestedProject,
} from '@/requestActions/public-cloud/decisionRequest';
import sendPublicCloudNatsMessage from '@/nats/public-cloud';
// import { sendCreateRequestEmails } from "@/ches/emailHandlers.js";

const ParamsSchema = z.object({
  licencePlate: string(),
});

type Params = z.infer<typeof ParamsSchema>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  // Athentication
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('You do not have the required credentials.', {
      status: 401,
    });
  }

  const { email: authEmail, roles: authRoles } = session.user;

  if (!authRoles.includes('admin')) {
    return new NextResponse('You must be an admin to make a request decision.', {
      status: 403,
    });
  }

  const body = await req.json();

  // Validation
  const parsedParams = ParamsSchema.safeParse(params);
  const parsedBody = PublicCloudDecisionRequestBodySchema.safeParse(body);

  if (!parsedParams.success) {
    console.log(parsedParams.error.message);
    return new Response(parsedParams.error.message, { status: 400 });
  }

  if (!parsedBody.success) {
    console.log(parsedBody.error.message);
    return new Response(parsedBody.error.message, { status: 400 });
  }

  const { licencePlate } = parsedParams.data;
  const { decision, humanComment, ...requestedProjectFormData } = parsedBody.data;

  try {
    const request: PublicCloudRequestWithRequestedProject = await makeDecisionRequest(
      licencePlate,
      decision,
      humanComment,
      requestedProjectFormData,
      authEmail,
    );

    if (!request.requestedProject) {
      return new Response(`Error creating decision request for ${request.licencePlate}.`, {
        status: 200,
      });
    }

    if (request.decisionStatus === DecisionStatus.APPROVED) {
      await sendPublicCloudNatsMessage(request.id, request.type, request.requestedProject);
    }

    return new NextResponse(`Decision request for ${request.licencePlate} succesfully created.`, {
      status: 200,
    });
  } catch (e) {
    console.log(e);
    return new NextResponse('Error creating decision request', { status: 400 });
  }
}