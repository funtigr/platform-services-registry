import { PublicCloudRequestWithRequestedProject } from '@/requestActions/public-cloud/decisionRequest';
import * as React from 'react';
import Header from '../../_components/Header';
import ProductDetails from '../../_components/ProductDetails';
import { Link, Body, Button, Heading, Html, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import ProviderDetails from '../../_components/ProviderDetails';
import Closing from '../../_components/Closing';
import { TailwindConfig } from '../../_components/TailwindConfig';

interface EmailProp {
  request: PublicCloudRequestWithRequestedProject;
}

const RequestApprovalTemplate = ({ request }: EmailProp) => {
  if (!request) return <></>;

  const {
    name,
    description,
    ministry,
    projectOwner,
    primaryTechnicalLead,
    secondaryTechnicalLead,
    provider,
    accountCoding,
    budget,
  } = request.requestedProject;

  return (
    <Html>
      <Tailwind config={TailwindConfig}>
        <div className="border border-solid border-[#eaeaea] rounded my-4 mx-auto p-4 max-w-xl">
          <Header />
          <Body className="bg-white my-auto mx-auto font-sans text-xs text-darkergrey">
            <div className="m-12">
              <div className="pb-6 mt-4 mb-4 border-solid border-0 border-b-1 border-slate-300">
                <Heading className="text-lg text-black">
                  Hurray! Your provisioning request was approved and completed!
                </Heading>
                <Text>Hi {request.requestedProject.projectOwner.firstName}, </Text>
                <Text className="">
                  Your request for a new project set for your product on the Public Cloud Landing Zone is complete. If
                  you have any more questions, reach out to the Platform Services team in the RocketChat channel{' '}
                  <Link className="mt-0 h-4" href={`https://chat.developer.gov.bc.ca/channel/devops-operations`}>
                    #devops&#8209;operations
                  </Link>
                </Text>
                <Text className="">
                  The Product Owner and the Technical Lead have been provisioned with admin access to the namespaces and
                  can add other users as necessary. Please note that if a Product Owner or a Technical Lead is removed
                  as a project contact in the Platform Registry, they will lose their access to the project set. The new
                  Product or Technical Lead provided on the product details page will gain administrative access to the
                  namespaces.
                </Text>
                <Button
                  href="https://registry.developer.gov.bc.ca/public-cloud/products/all"
                  className="bg-bcorange rounded-md px-4 py-2 text-white"
                >
                  Log in to Console
                </Button>
              </div>
              <div className="pb-6 mt-4 mb-4 border-solid border-0 border-b-1 border-slate-300">
                <ProductDetails
                  name={name}
                  description={description}
                  ministry={ministry}
                  po={projectOwner}
                  tl1={primaryTechnicalLead}
                  tl2={secondaryTechnicalLead}
                />
              </div>
              <div className="pb-6 mt-4 mb-4 border-solid border-0 border-b-1 border-slate-300">
                <ProviderDetails provider={provider} accountCoding={accountCoding} budget={budget} />
              </div>
              <div>
                <Closing email="Cloud.Pathfinder@gov.bc.ca" />
              </div>
            </div>
          </Body>
        </div>
      </Tailwind>
    </Html>
  );
};

export default RequestApprovalTemplate;