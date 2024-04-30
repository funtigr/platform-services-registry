import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { PrivateCloudProject, Quota } from '@prisma/client';
import { DefaultCpuOptionsSchema, DefaultMemoryOptionsSchema, DefaultStorageOptionsSchema } from '@/schema';
import FormSelect from '@/components/generic/select/FormSelect';
import ExternalLink from '@/components/generic/button/ExternalLink';

type CpuOptionKeys = z.infer<typeof DefaultCpuOptionsSchema>;
type MemoryOptionKeys = z.infer<typeof DefaultMemoryOptionsSchema>;
type StorageOptionKeys = z.infer<typeof DefaultStorageOptionsSchema>;

type QuotaOptions<K extends string = any> = {
  [key in K]: string;
};

export const defaultCpuOptionsLookup: QuotaOptions<CpuOptionKeys> = {
  CPU_REQUEST_0_5_LIMIT_1_5: '0.5 CPU Request, 1.5 CPU Limit',
  CPU_REQUEST_1_LIMIT_2: '1 CPU Request, 2 CPU Limit',
  CPU_REQUEST_2_LIMIT_4: '2 CPU Request, 4 CPU Limit',
  CPU_REQUEST_4_LIMIT_8: '4 CPU Request, 8 CPU Limit',
  CPU_REQUEST_8_LIMIT_16: '8 CPU Request, 16 CPU Limit',
  CPU_REQUEST_16_LIMIT_32: '16 CPU Request, 32 CPU Limit',
  CPU_REQUEST_32_LIMIT_64: '32 CPU Request, 64 CPU Limit',
  CPU_REQUEST_64_LIMIT_128: '64 CPU Request, 128 CPU Limit',
};

export const defaultMemoryOptionsLookup: QuotaOptions<MemoryOptionKeys> = {
  MEMORY_REQUEST_2_LIMIT_4: '2 GB Request, 4 GB Limit',
  MEMORY_REQUEST_4_LIMIT_8: '4 GB Request, 8 GB Limit',
  MEMORY_REQUEST_8_LIMIT_16: '8 GB Request, 16 GB Limit',
  MEMORY_REQUEST_16_LIMIT_32: '16 GB Request, 32 GB Limit',
  MEMORY_REQUEST_32_LIMIT_64: '32 GB Request, 64 GB Limit',
  MEMORY_REQUEST_64_LIMIT_128: '64 GB Request, 128 GB Limit',
};

export const defaultStorageOptionsLookup: QuotaOptions<StorageOptionKeys> = {
  STORAGE_1: '1 GB',
  STORAGE_2: '2 GB',
  STORAGE_4: '4 GB',
  STORAGE_16: '16 GB',
  STORAGE_32: '32 GB',
  STORAGE_64: '64 GB',
  STORAGE_128: '128 GB',
  STORAGE_256: '256 GB',
  STORAGE_512: '512 GB',
};

type QuotaOptionsLookup = {
  cpu: QuotaOptions;
  memory: QuotaOptions;
  storage: QuotaOptions;
};

const quotaOptionsLookup: QuotaOptionsLookup = {
  cpu: defaultCpuOptionsLookup,
  memory: defaultMemoryOptionsLookup,
  storage: defaultStorageOptionsLookup,
};

function QuotaInput({
  quotaName,
  nameSpace,
  licensePlate,
  selectOptions,
  disabled,
  quota,
}: {
  quotaName: 'cpu' | 'memory' | 'storage';
  nameSpace: 'production' | 'test' | 'development' | 'tools';
  licensePlate: string;
  selectOptions: QuotaOptions;
  disabled: boolean;
  quota: string | null;
}) {
  const {
    register,
    formState: { errors },
    getValues,
  } = useFormContext();

  // Get the current quota value
  const initialValues = getValues();
  const initialQuota = initialValues[nameSpace + 'Quota'];
  const currentQuota = initialQuota?.[quotaName];

  // Make quotaName start with uppercase letter
  const quotaNameStartUpperCase = quotaName.charAt(0).toUpperCase() + quotaName.slice(1);

  return (
    <div className="mb-4">
      <FormSelect
        id={quotaName + nameSpace}
        label={quotaName.toUpperCase()}
        disabled={disabled}
        options={[
          { label: `Select ${quotaNameStartUpperCase}`, value: '', disabled: true },
          ...Object.entries(selectOptions).map(([value, label]) => ({ label, value })),
          ...(Object.keys(selectOptions).includes(currentQuota) ? [] : [{ label: currentQuota, value: currentQuota }]),
        ]}
        defaultValue=""
        selectProps={register(nameSpace + 'Quota.' + quotaName)}
      />
      {(errors?.[nameSpace + 'Quota'] as { [key: string]: any })?.[quotaName] && (
        <p className="text-red-400 mt-3 text-sm leading-6">
          Select the {quotaName} for the {nameSpace} namespace
        </p>
      )}
      {quota ? (
        <div>
          <p className="mt-3 text-sm leading-6 text-gray-700">
            <b>Current {quotaName}: </b>
            {selectOptions[quota] || currentQuota}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function Quotas({
  licensePlate,
  disabled,
  currentProject,
}: {
  licensePlate: string;
  disabled: boolean;
  currentProject?: PrivateCloudProject | null | undefined;
}) {
  const namespaceSuffixes = {
    production: '-prod',
    tools: '-tools',
    test: '-test',
    development: '-dev',
  };
  return (
    <div className="border-b border-gray-900/10 pb-14">
      <h2 className="font-bcsans text-base lg:text-lg 2xl:text-2xl font-semibold leading-6 text-gray-900 2xl:mt-14">
        3. Quotas
      </h2>
      <p className="font-bcsans text-base leading-6 mt-5">
        All quota increase requests require <b> Platform Services Team’s </b>
        approval, and must have supporting information as per the{' '}
        <ExternalLink href="https://docs.developer.gov.bc.ca/request-quota-increase-for-openshift-project-set/">
          Quota Increase Request Process
        </ExternalLink>
        . Any Quota Requests without supporting information
        <b> will not </b> be processed.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-x-8 xl:gap-x-16 gap-y-8 sm:grid-cols-8 ">
        {(['production', 'test', 'tools', 'development'] as const).map((nameSpace) => (
          <div className="sm:col-span-2" key={nameSpace}>
            <h3 className="font-bcsans text-base 2xl:text-lg font-semibold leading-7 text-gray-900">
              {nameSpace.charAt(0).toUpperCase() + nameSpace.slice(1)} Namespace
            </h3>

            <ExternalLink
              href={`https://console.apps.${currentProject?.cluster}.devops.gov.bc.ca/k8s/cluster/projects/${licensePlate}${namespaceSuffixes[nameSpace]}`}
            >
              {licensePlate}
              {namespaceSuffixes[nameSpace] || ''}
            </ExternalLink>

            {(['cpu', 'memory', 'storage'] as const).map((quotaName) => (
              <QuotaInput
                key={quotaName}
                quotaName={quotaName}
                selectOptions={quotaOptionsLookup[quotaName]}
                licensePlate={licensePlate}
                nameSpace={nameSpace}
                disabled={disabled}
                quota={(currentProject as { [key: string]: any })?.[nameSpace + 'Quota'][quotaName]}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
