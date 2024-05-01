import { $Enums, Cluster } from '@prisma/client';
import { sendPrivateCloudNatsMessage } from '@/services/nats';
import { PrivateCloudRequestWithProjectAndRequestedProject } from '@/request-actions/private-cloud/decision-request';

interface User {
  email?: string;
}

export async function sendRequestNatsMessage(
  updatedRequest: PrivateCloudRequestWithProjectAndRequestedProject,
  updateData: {
    projectOwner: User;
    primaryTechnicalLead: User;
    secondaryTechnicalLead: User | null;
  },
) {
  const contactsChanged =
    updateData.projectOwner.email !== updatedRequest.requestedProject.projectOwner.email ||
    updateData.primaryTechnicalLead.email !== updatedRequest.requestedProject.primaryTechnicalLead.email ||
    updateData.secondaryTechnicalLead?.email !== updatedRequest.requestedProject?.secondaryTechnicalLead?.email;

  await sendPrivateCloudNatsMessage(
    updatedRequest.id,
    updatedRequest.type,
    updatedRequest.requestedProject,
    contactsChanged,
  );

  // For GOLD requests
  if (updatedRequest.requestedProject.cluster === Cluster.GOLD) {
    const productData = { ...updatedRequest.requestedProject, cluster: Cluster.GOLDDR };

    // 1. Handle CREATE request
    if (updatedRequest.type === $Enums.RequestType.CREATE) {
      // 1.1. send GOLDDR nats message only if the flag is selected
      if (updatedRequest.requestedProject.golddrEnabled) {
        await sendPrivateCloudNatsMessage(updatedRequest.id, updatedRequest.type, productData, contactsChanged);
      }
    }
    // 2. Handle DELETE request
    else if (updatedRequest.type === $Enums.RequestType.DELETE) {
      // 2.1. send GOLDDR nats message only if the flag is selected
      if (updatedRequest.project?.golddrEnabled) {
        await sendPrivateCloudNatsMessage(updatedRequest.id, updatedRequest.type, productData, contactsChanged);
      }
    }
    // 3. Handle EDIT request
    else if (updatedRequest.type === $Enums.RequestType.EDIT) {
      // 3.1. enable GOLDDR after creation of product.
      if (!updatedRequest.project?.golddrEnabled && updatedRequest.requestedProject.golddrEnabled) {
        await sendPrivateCloudNatsMessage(updatedRequest.id, $Enums.RequestType.CREATE, productData, contactsChanged);
      }
      // 3.2. disable GOLDDR after creation of product.
      else if (updatedRequest.project?.golddrEnabled && !updatedRequest.requestedProject.golddrEnabled) {
        await sendPrivateCloudNatsMessage(updatedRequest.id, $Enums.RequestType.DELETE, productData, contactsChanged);
      }
      // 3.3. update GOLDDR if still enabled
      else if (updatedRequest.project?.golddrEnabled && updatedRequest.requestedProject.golddrEnabled) {
        await sendPrivateCloudNatsMessage(updatedRequest.id, $Enums.RequestType.EDIT, productData, contactsChanged);
      }
    }
  }
}