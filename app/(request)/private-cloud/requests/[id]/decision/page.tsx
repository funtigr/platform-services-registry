"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { DecisionRequestBodySchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PreviousButton from "@/components/buttons/Previous";
import { useSession } from "next-auth/react";
import CreateModal from "@/components/modal/Create";
import { useRouter } from "next/navigation";
import ProjectDescription from "@/components/form/ProjectDescription";
import TeamContacts from "@/components/form/TeamContacts";
import Quotas from "@/components/form/Quotas";
import { useQuery } from "@tanstack/react-query";
import SubmitButton from "@/components/buttons/SubmitButton";
import CommonComponents from "@/components/form/CommonComponents";

async function fetchRequestedProject(id: string): Promise<object> {
  const res = await fetch(`/api/requests/private-cloud/${id}`);
  if (!res.ok) {
    throw new Error("Network response was not ok for fetch user image");
  }

  // Re format data to work with form
  const { requestedProject } = await res.json();

  // Secondaty technical lead should only be included if it exists
  if (requestedProject.secondaryTechnicalLead === null) {
    delete requestedProject.secondaryTechnicalLead;
  }

  // Remove null values from common components
  for (const component of Object.entries(requestedProject.commonComponents)) {
    if (component[1] === null) {
      delete requestedProject.commonComponents[component[0]];
    }
  }

  return requestedProject;
}

export default function RequestDecision({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession({
    required: true,
  });

  const { push } = useRouter();

  const [open, setOpen] = useState(false);
  const [secondTechLead, setSecondTechLead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data } = useQuery<any, Error>(
    ["requestedProject", params.id],
    () => fetchRequestedProject(params.id),
    {
      enabled: !!params.id,
    }
  );

  const methods = useForm({
    resolver: zodResolver(DecisionRequestBodySchema),
    values: { comment: "", decision: "", ...data },
  });

  console.log("watch", methods.watch());

  console.log("errors", methods.formState.errors);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    console.log("on submit data", data);
    try {
      const response = await fetch(
        `/api/requests/private-cloud/${params.id}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      console.log("response", response);

      if (!response.ok) {
        throw new Error("Network response was not ok for create request");
      }

      const result = await response.json();

      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }

    setIsLoading(false);
    push("/private-cloud/requests");
  };

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
            <ProjectDescription />
            <TeamContacts
              secondTechLead={secondTechLead}
              secondTechLeadOnClick={secondTechLeadOnClick}
              projectOwnerDefaultEmail={data?.projectOwner?.email}
              primaryTechnicalLeadDefaultEmail={
                data?.primaryTechnicalLead?.email
              }
              secondaryTechnicalLeadDefaultEmail={
                data?.secondaryTechnicalLead?.email
              }
            />
            <Quotas licensePlate="ac4r5" />
          </div>
          <div className="mt-16 flex items-center justify-start gap-x-6">
            <PreviousButton />
            <SubmitButton
              text="REJECT REQUEST"
              onClick={() => methods.setValue("decision", "REJECTED")}
            />
            <SubmitButton
              text="APPROVE REQUEST"
              onClick={() => methods.setValue("decision", "APPROVED")}
            />
          </div>
        </form>
      </FormProvider>
      <CreateModal
        open={open}
        setOpen={setOpen}
        handleSubmit={methods.handleSubmit(onSubmit)}
        isLoading={isLoading}
      />
    </div>
  );
}