import { MockedFunction } from 'jest-mock';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { POST as createRequest } from '@/app/api/private-cloud/products/route';
import { PUT } from '@/app/api/private-cloud/provision/[licencePlate]/route';
import { POST as decisionRequest } from '@/app/api/private-cloud/requests/[id]/decision/route';
import prisma from '@/core/prisma';
import { findMockUserByIDIR, generateTestSession } from '@/helpers/mock-users';
import { DefaultCpuOptionsSchema, DefaultMemoryOptionsSchema, DefaultStorageOptionsSchema } from '@/schema';

const BASE_URL = 'http://localhost:3000';

const createRequestBody = {
  name: 'Sample Project',
  description: 'This is a sample project description.',
  cluster: 'SILVER', // Assuming CLUSTER_A is a valid enum value for Cluster
  ministry: 'AGRI', // Assuming AGRI is a valid enum value for Ministry
  projectOwner: findMockUserByIDIR('JOHNDOE'),
  primaryTechnicalLead: findMockUserByIDIR('JAMESSMITH'),
  commonComponents: {
    addressAndGeolocation: {
      planningToUse: true,
      implemented: false,
    },
    workflowManagement: {
      planningToUse: false,
      implemented: true,
    },
    formDesignAndSubmission: {
      planningToUse: true,
      implemented: true,
    },
    identityManagement: {
      planningToUse: false,
      implemented: false,
    },
    paymentServices: {
      planningToUse: true,
      implemented: false,
    },
    documentManagement: {
      planningToUse: false,
      implemented: true,
    },
    endUserNotificationAndSubscription: {
      planningToUse: true,
      implemented: false,
    },
    publishing: {
      planningToUse: false,
      implemented: true,
    },
    businessIntelligence: {
      planningToUse: true,
      implemented: false,
    },
    other: 'Some other services',
    noServices: false,
  },
  golddrEnabled: true,
};

const quota = {
  cpu: DefaultCpuOptionsSchema.enum.CPU_REQUEST_0_5_LIMIT_1_5,
  memory: DefaultMemoryOptionsSchema.enum.MEMORY_REQUEST_2_LIMIT_4,
  storage: DefaultStorageOptionsSchema.enum.STORAGE_1,
};

const adminChanges = {
  name: 'New name from admin',
  description: 'New description from admin',
  projectOwner: findMockUserByIDIR('JOHNDOE'),
  testQuota: {
    cpu: 'CPU_REQUEST_8_LIMIT_16',
    memory: 'MEMORY_REQUEST_4_LIMIT_8',
    storage: 'STORAGE_2',
  },
};

const decisionBody = {
  decision: 'APPROVED',
  decisionComment: 'Approved by admin',
  ...createRequestBody,
  productionQuota: quota,
  toolsQuota: quota,
  developmentQuota: quota,
  ...adminChanges,
};

const adminRequestedProjectBody = { ...createRequestBody, ...adminChanges };

const mockedGetServerSession = getServerSession as unknown as MockedFunction<typeof getServerSession>;

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next-auth', () => ({
  default: jest.fn(), // for default export
  NextAuth: jest.fn(), // for named export
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

describe('Create Private Cloud Request Route', () => {
  let createRequestId: string;
  let createRequestLicencePlate: string;
  let PROVISION_API_URL: string;

  beforeAll(async () => {
    // await cleanUp();

    const mockSession = await generateTestSession('admin.system@gov.bc.ca');
    mockedGetServerSession.mockResolvedValue(mockSession);

    // Make a create request
    const createRequestObject = new NextRequest(`${BASE_URL}/api/private-cloud/products`, {
      method: 'POST',
      body: JSON.stringify(createRequestBody),
    });

    await createRequest(createRequestObject);

    // Get the request id
    const request = await prisma.privateCloudRequest.findFirst();

    if (!request) {
      throw new Error('Request not found for provision test.');
    }

    createRequestId = request.id;
    createRequestLicencePlate = request.licencePlate;

    // Make a decision request
    const DECISION_API_URL = `${BASE_URL}/api/private-cloud/requests/${createRequestId}/decision`;

    const decisionRequestObject = new NextRequest(DECISION_API_URL, {
      method: 'POST',
      body: JSON.stringify(decisionBody),
    });

    await decisionRequest(decisionRequestObject, {
      params: { id: createRequestId },
    });

    // Create the proviiion request url
    PROVISION_API_URL = `${BASE_URL}/api/provision/private-cloud/${createRequestLicencePlate}`;
  });

  afterAll(async () => {
    // await cleanUp();
  });

  // test("should return 401 if user is not authenticated", async () => {
  //   mockedGetServerSession.mockResolvedValue(null);

  //   const req = new NextRequest(API_URL, {
  //     method: "PUT",
  //   });

  //   const response = await PUT(req, {
  //     params: { licencePlate: createRequestLicencePlate },
  //   });

  //   expect(response.status).toBe(401);
  // });

  // test("should return 403 if not an admin", async () => {
  //   mockedGetServerSession.mockResolvedValue({
  //     user: {
  //       email: "oamar.kanji@gov.bc.ca",
  //       roles: [],
  //     },
  //   });

  //   const req = new NextRequest(API_URL, {
  //     method: "POST",
  //     body: JSON.stringify(createRequestBody),
  //   });

  //   const response = await PUT(req, {
  //     params: { licencePlate: createRequestLicencePlate },
  //   });

  //   expect(response.status).toBe(403);
  // });

  test('should return 200 if provision is successful', async () => {
    const req = new NextRequest(PROVISION_API_URL, {
      method: 'PUT',
    });

    const response = await PUT(req, {
      params: { licencePlate: createRequestLicencePlate },
    });
    expect(response.status).toBe(200);
  });

  test('should be a project in the db', async () => {
    const project = await prisma.privateCloudProject.findFirst({
      where: { licencePlate: createRequestLicencePlate },
      include: {
        projectOwner: true,
        primaryTechnicalLead: true,
        secondaryTechnicalLead: true,
      },
    });

    if (!project) {
      throw new Error('Project not found in db');
    }

    expect(project).toBeTruthy();
    expect(project.licencePlate).toBe(createRequestLicencePlate);
    expect(project.name).toBe(decisionBody.name);
    expect(project.description).toBe(decisionBody.description);
    expect(project.cluster).toBe(decisionBody.cluster);
    expect(project.ministry).toBe(decisionBody.ministry);
    expect(project.projectOwner.email).toBe(decisionBody.projectOwner.email);
    expect(project.primaryTechnicalLead.email).toBe(decisionBody.primaryTechnicalLead.email);
    expect(project.secondaryTechnicalLead).toBe(null);
    expect(project.commonComponents).toBeTruthy();
    expect(project.testQuota).toStrictEqual(decisionBody.testQuota);
    expect(project.productionQuota).toStrictEqual(decisionBody.productionQuota);
    expect(project.toolsQuota).toStrictEqual(decisionBody.toolsQuota);
    expect(project.developmentQuota).toStrictEqual(decisionBody.developmentQuota);
  });

  test('the request should be marked as provisioned and not be active', async () => {
    const request = await prisma.privateCloudRequest.findFirst({
      where: { licencePlate: createRequestLicencePlate },
    });

    if (!request) {
      throw new Error('Request not found in db');
    }

    expect(request.decisionStatus).toBe('PROVISIONED');
    expect(request.active).toBe(false);
  });
});
