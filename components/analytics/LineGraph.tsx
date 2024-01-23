'use client';

import { Card, LineChart, Title, Subtitle } from '@tremor/react';
import ExportButton from '@/components/buttons/ExportButton';

const valueFormatter = (number: number) => ` ${new Intl.NumberFormat('us').format(number).toString()}`;

export default function Chart({
  index,
  subtitle,
  exportApiEndpoint,
  chartData,
  title,
  categories,
  colors,
}: {
  index: string;
  subtitle: string;
  exportApiEndpoint: string;
  chartData: any;
  title: string;
  categories: string[];
  colors: string[];
}) {
  return (
    <div className="flex flex-col items-end">
      <ExportButton className="mb-4" apiEnpoint={exportApiEndpoint} />
      <Card>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>

        <LineChart
          className="mt-6"
          data={chartData}
          index={index}
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          yAxisWidth={40}
        />
      </Card>
    </div>
  );
}
