"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { PrivateCloudDecisionRequestBodySchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PreviousButton from "@/components/buttons/Previous";
import { useSession } from "next-auth/react";
import CreateModal from "@/components/modal/CreatePrivateCloud";
import { useRouter } from "next/navigation";
import ProjectDescription from "@/components/form/ProjectDescriptionPrivate";

import TeamContacts from "@/components/form/TeamContacts";
import Quotas from "@/components/form/Quotas";
import { useQuery } from "@tanstack/react-query";
import SubmitButton from "@/components/buttons/SubmitButton";
import { PrivateCloudRequestWithCurrentAndRequestedProject } from "@/app/api/private-cloud/request/[id]/route";
import { PrivateCloudProject } from "@prisma/client";

async function fetchRequestedProject(
  id: string
): Promise<PrivateCloudRequestWithCurrentAndRequestedProject> {
  const res = await fetch(`/api/private-cloud/request/${id}`);
  if (!res.ok) {
    throw new Error("Network response was not ok for fetch user image");
  }

  // Re format data to work with form
  const data = await res.json();

  // Secondaty technical lead should only be included if it exists
  if (data.requestedProject.secondaryTechnicalLead === null) {
    delete data.requestedProject.secondaryTechnicalLead;
  }

  return data;
}

export default function RequestDecision({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession({
    required: true,
  });

  const [open, setOpen] = useState(false);
  const [isDisabled, setDisabled] = useState(false);
  const [secondTechLead, setSecondTechLead] = useState(false);

  const { data } = useQuery<
    PrivateCloudRequestWithCurrentAndRequestedProject,
    Error
  >(["requestedProject", params.id], () => fetchRequestedProject(params.id), {
    enabled: !!params.id,
  });

  const methods = useForm({
    resolver: zodResolver(PrivateCloudDecisionRequestBodySchema),
    values: { comment: "", decision: "", ...data?.requestedProject },
  });

  useEffect(() => {
    if (data && data.decisionStatus !== "PENDING") {
      setDisabled(true);
    }
  }, [data]);

  const secondTechLeadOnClick = () => {
    setSecondTechLead(!secondTechLead);
    if (secondTechLead) {
      methods.unregister("secondaryTechnicalLead");
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => setOpen(true))}>
          <div className="space-y-12">
            <ProjectDescription
              disabled={isDisabled}
              clusterDisabled={data?.type !== "CREATE"}
            />
            <TeamContacts
              disabled={isDisabled}
              secondTechLead={secondTechLead}
              secondTechLeadOnClick={secondTechLeadOnClick}
            />
            <Quotas
              licensePlate={data?.licencePlate as string}
              disabled={isDisabled}
              currentProject={data?.project as PrivateCloudProject}
            />
          </div>
          <div className="mt-16 flex items-center justify-start gap-x-6">
            <PreviousButton />
          </div>
        </form>
      </FormProvider>
    </div>
  );

}
