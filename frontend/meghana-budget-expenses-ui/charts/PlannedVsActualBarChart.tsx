import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PlannedVsActualReportItem } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface PlannedVsActualBarChartProps {
  data: PlannedVsActualReportItem[];
  currency?: string;
  title?: string;
}

export const PlannedVsActualBarChart: React.FC<PlannedVsActualBarChartProps> = ({
  data,
  currency = 'INR',
  title = 'Planned Budget vs. Actual Spending'
}) => {
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const labels = data.map(d => d.category);
  const plannedValues = data.map(d => d.planned);
  const actualValues = data.map(d => d.actual);

  const totalPlanned = plannedValues.reduce((a, b) => a + b, 0);
  const totalActual = actualValues.reduce((a, b) => a + b, 0);

  if (data.length === 0 || (totalPlanned === 0 && totalActual === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0B1322]/80 border border-white/10 rounded-2xl h-80 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-neutral-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white mb-1">No planned budgets or expenses yet</p>
        <p className="text-xs text-neutral-400 max-w-xs">
          Once budgets or expenses are set for your expeditions, this comparative bar chart will visualize your adherence in real-time.
        </p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Planned Budget',
        data: plannedValues,
        backgroundColor: 'rgba(212, 168, 83, 0.45)', // Luxury Champagne Gold
        borderColor: '#D4A853',
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.75
      },
      {
        label: 'Actual Spend',
        data: actualValues,
        backgroundColor: actualValues.map((act, i) => {
          const plan = plannedValues[i] || 0;
          return act > plan && plan > 0
            ? 'rgba(244, 63, 94, 0.85)' // Rose alert if exceeded
            : 'rgba(56, 189, 248, 0.85)'; // Sky blue when on track
        }),
        borderColor: actualValues.map((act, i) => {
          const plan = plannedValues[i] || 0;
          return act > plan && plan > 0 ? '#F43F5E' : '#38BDF8';
        }),
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.75
      }
    ]
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#070B14',
        titleColor: '#FFFFFF',
        bodyColor: '#E2C076',
        borderColor: 'rgba(226, 192, 118, 0.25)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context) => {
            const val = (context.raw as number) || 0;
            return ` ${context.dataset.label}: ${currencySymbol}${val.toLocaleString()}`;
          },
          afterBody: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx !== undefined && data[idx]) {
              const item = data[idx];
              const diff = item.difference;
              if (diff >= 0) {
                return `\nRemaining Allowance: ${currencySymbol}${diff.toLocaleString()} (${100 - item.percentage}% under)`;
              } else {
                return `\nOver Budget by: ${currencySymbol}${Math.abs(diff).toLocaleString()} (${item.percentage - 100}% over)`;
              }
            }
            return '';
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
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94A3B8',
          font: {
            size: 10
          },
          callback: (val) => `${currencySymbol}${Number(val) >= 1000 ? `${Number(val) / 1000}k` : val}`
        }
      }
    }
  };

  return (
    <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
      {/* Header with Totals and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h4 className="text-sm sm:text-base font-semibold text-white tracking-wide">{title}</h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Planned: <span className="font-semibold text-[#E2C076]">{currencySymbol}{totalPlanned.toLocaleString()}</span>
            {' · '}
            Actual: <span className="font-semibold text-sky-400">{currencySymbol}{totalActual.toLocaleString()}</span>
          </p>
        </div>

        {/* Custom Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#D4A853]/60 border border-[#D4A853]" />
            <span className="text-neutral-300">Planned Budget</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-500/80 border border-sky-400" />
            <span className="text-neutral-300">Actual Spend</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64 sm:h-72 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Category Variance Indicators Bar below chart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-white/[0.06]">
        {data.map(item => {
          const isOver = item.status === 'over';
          const isOnTrack = item.status === 'on_track';
          return (
            <div key={item.category} className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px]">
              <span className="text-neutral-400 block truncate">{item.category}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-white">
                  {item.percentage}%
                </span>
                <span className={`text-[10px] font-semibold ${isOver ? 'text-rose-400' : isOnTrack ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isOver ? 'Over' : isOnTrack ? 'Near' : 'Within'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
