import Tabs, { ITab } from '@/components/generic/Tabs2';

export default function ProductsRequestsTabs({ context }: { context: 'private' | 'public' }) {
  const tabs: ITab[] = [
    {
      label: 'Products',
      name: 'products',
      href: `/${context}-cloud/products/all`,
    },
    {
      label: 'In Progress',
      name: 'in-progress',
      href: `/${context}-cloud/requests/active`,
    },
  ];

  return (
    <div>
      <Tabs tabs={tabs} />
    </div>
  );
}
