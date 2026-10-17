import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TimeSeriesTrendItem } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendsLineChartProps {
  spendingTrends: TimeSeriesTrendItem[];
  tripActivityTrends?: Array<{ period: string; tripsCount: number }>;
  currency?: string;
  title?: string;
}

export const TrendsLineChart: React.FC<TrendsLineChartProps> = ({
  spendingTrends,
  tripActivityTrends = [],
  currency = 'INR',
  title = 'Timeline Trends & Growth'
}) => {
  const [metric, setMetric] = useState<'spending' | 'trips'>('spending');
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  // Merge unique periods
  const allPeriodsSet = new Set<string>();
  spendingTrends.forEach(s => allPeriodsSet.add(s.period));
  tripActivityTrends.forEach(t => allPeriodsSet.add(t.period));
  const periods = Array.from(allPeriodsSet).sort();

  const hasAnyActivity =
    spendingTrends.some(s => s.totalSpent > 0) ||
    tripActivityTrends.some(t => t.tripsCount > 0);

  if (periods.length === 0 || !hasAnyActivity) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0B1322]/80 border border-white/10 rounded-2xl h-72 text-center">
        <p className="text-sm font-semibold text-white mb-1">No timeline trends recorded yet</p>
        <p className="text-xs text-neutral-400 max-w-xs">
          As trips and expenses are booked over weeks and months, live trajectory curves will appear here.
        </p>
      </div>
    );
  }

  // Map values
  const spendMap = new Map<string, number>();
  spendingTrends.forEach(s => spendMap.set(s.period, s.totalSpent));

  const tripMap = new Map<string, number>();
  tripActivityTrends.forEach(t => tripMap.set(t.period, t.tripsCount));

  const labels = periods.map(p => {
    // Format YYYY-MM into MMM YYYY (e.g. Sep 2026)
    try {
      const [year, month] = p.split('-');
      if (year && month) {
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    } catch {}
    return p;
  });

  const activeValues = periods.map(p => {
    return metric === 'spending' ? (spendMap.get(p) || 0) : (tripMap.get(p) || 0);
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: metric === 'spending' ? `Spend (${currencySymbol})` : 'Trips Planned',
        data: activeValues,
        borderColor: metric === 'spending' ? '#E2C076' : '#38BDF8',
        backgroundColor: metric === 'spending'
          ? 'rgba(226, 192, 118, 0.12)'
          : 'rgba(56, 189, 248, 0.12)',
        fill: true,
        tension: 0.38,
        pointBackgroundColor: metric === 'spending' ? '#E2C076' : '#38BDF8',
        pointBorderColor: '#070B14',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6.5
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#070B14',
        titleColor: '#FFFFFF',
        bodyColor: metric === 'spending' ? '#E2C076' : '#38BDF8',
        borderColor: 'rgba(226, 192, 118, 0.25)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y || 0;
            return metric === 'spending'
              ? ` Total Spend: ${currencySymbol}${val.toLocaleString()}`
              : ` Active Trips: ${val} trips`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 11 }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 10 },
          callback: (val) => {
            if (metric === 'trips') return `${val} trips`;
            return `${currencySymbol}${Number(val) >= 1000 ? `${Number(val) / 1000}k` : val}`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
      {/* Header and Filter Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h4 className="text-sm sm:text-base font-semibold text-white tracking-wide">{title}</h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            {metric === 'spending'
              ? `Historical expenditure trajectory across months`
              : `Trip creation and expedition frequency over time`}
          </p>
        </div>

        {/* Metric Segmented Switch (Interactive Buttons - Frontend Skill Compliant) */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setMetric('spending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metric === 'spending'
                ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Spending Trends
          </button>
          <button
            onClick={() => setMetric('trips')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              metric === 'trips'
                ? 'bg-sky-400 text-[#070B14] shadow-md shadow-sky-400/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Trip Activity
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64 sm:h-72 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
