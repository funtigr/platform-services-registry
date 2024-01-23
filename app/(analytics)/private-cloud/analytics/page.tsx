import CombinedAreaGraph from '@/components/analytics/CombinedAreaGraph';
import LineGraph from '@/components/analytics/LineGraph';
import Histogram from '@/components/analytics/Histogram';
import { combinedQuotaEditRequests } from '@/analytics/private-cloud/quotaChanges';
import { combinedRequests } from '@/analytics/private-cloud/requests';
import { numberOfProductsOverTime } from '@/analytics/private-cloud/products';
import { requestDecisionTime } from '@/analytics/private-cloud/requestDecisionTime';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';

export default async function AnalyticsDashboard() {
  const session = await getServerSession(authOptions);

  const quotaChangedChartData = await combinedQuotaEditRequests();
  const requestsChartData = await combinedRequests();
  const projectsChartData = await numberOfProductsOverTime();
  const requestDecisionTimeChartData = await requestDecisionTime();

  return (
    <div className="m-12">
      <h1 className="font-bcsans text-xl lg:text-2xl 2xl:text-4xl font-semibold leading-7 text-gray-900">
        Private Cloud Data Analytics
      </h1>
      <div className="flex flex-col gap-y-12 mt-14">
        <CombinedAreaGraph
          title={'Requests over time'}
          subtitle={'This graph shows the number of requests over time for each request type'}
          chartData={requestsChartData}
          categories={['All requests', 'Edit requests', 'Create requests', 'Delete requests']}
          colors={['indigo', 'yellow', 'green', 'red']}
          exportApiEndpoint="/api/private-cloud/analytics/csv/requests"
        />
        <CombinedAreaGraph
          title={'Quota requests over time'}
          subtitle={'This graph shows edit requests where a quota change was requested and the request decision'}
          chartData={quotaChangedChartData}
          categories={['All quota requests', 'Approved quota requests', 'Rejected quota requests']}
          colors={['indigo', 'green', 'red']}
          exportApiEndpoint="/api/private-cloud/analytics/csv/quota-requests"
        />
        <LineGraph
          index="date"
          title={'Products provisioned over time'}
          subtitle={'This graph shows the cumulitive total of products provisioned through the registry'}
          chartData={projectsChartData}
          categories={['Products']}
          colors={['indigo']}
          exportApiEndpoint="/api/private-cloud/analytics/csv/products"
        />
        <Histogram
          index="time"
          title={'Request decision time frequency (%)'}
          chartData={requestDecisionTimeChartData}
          categories={['Percentage']}
          colors={['indigo']}
          exportApiEndpoint="/api/private-cloud/analytics/csv/decision-time"
        />
      </div>
    </div>
  );
}
