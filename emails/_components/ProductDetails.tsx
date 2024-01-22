import { Heading, Link, Text } from '@react-email/components';

interface User {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  ministry: string | null;
}

export default function ProductDetails({
  name,
  description,
  ministry,
  po,
  tl1,
  tl2,
}: {
  name: string;
  description: string;
  ministry: string;
  po: User;
  tl1: User;
  tl2?: User | null;
}) {
  return (
    <div>
      <Heading className="text-lg">Product Details</Heading>
      <div>
        <Text className="mb-0 font-semibold h-4">Product Name: </Text>
        <Text className="mt-0 h-4">{name}</Text>
        <Text className="mb-0 font-semibold h-4">Product Description: </Text>
        <Text className="mt-0 h-4">{description}</Text>
        <Text className="mb-0 font-semibold h-4">Ministry: </Text>
        <Text className="mt-0 h-4">{ministry}</Text>
        <Text className="mb-0.5 font-semibold h-4">Product Owner: </Text>
        <Text className="mt-0 mb-1.5 h-4">
          {po.firstName} {po.lastName}
        </Text>
        <Link className="mt-0 h-4" href={`mailto:${po.email}`}>
          {po.email}
        </Link>
        <Text className="mb-0.5 font-semibold h-4">Technical Lead: </Text>
        <Text className="mt-0 mb-1.5 h-4">
          {tl1.firstName} {tl1.lastName}
        </Text>
        <Link className="mt-0 h-4" href={`mailto:${tl1.email}`}>
          {tl1.email}
        </Link>
        {tl2 && (
          <div>
            <Text className="mb-0.5 font-semibold h-4">Secondary Technical Lead: </Text>
            <Text className="mt-0 mb-1.5 h-4">
              {tl2.firstName} {tl2.lastName}
            </Text>
            <Link className="mt-0 h-4" href={`mailto:${tl2.email}`}>
              {tl2.email}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}