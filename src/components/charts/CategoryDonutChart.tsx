import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CategoryExpenseReportItem } from '../../types';

// Register required Chart.js controllers
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDonutChartProps {
  data: CategoryExpenseReportItem[];
  currency?: string;
  title?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string }> = {
  transportation: { bg: '#38BDF8', border: '#0284C7' },
  hotel: { bg: '#F59E0B', border: '#D97706' },
  food: { bg: '#10B981', border: '#059669' },
  shopping: { bg: '#EC4899', border: '#DB2777' },
  entertainment: { bg: '#8B5CF6', border: '#7C3AED' },
  miscellaneous: { bg: '#64748B', border: '#475569' }
};

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  currency = 'INR',
  title = 'Category-Wise Expense Breakdown'
}) => {
  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const nonZeroCategories = data.filter(d => d.spent > 0);
  const totalSpent = data.reduce((sum, d) => sum + d.spent, 0);

  // If no expenses logged yet
  if (nonZeroCategories.length === 0 || totalSpent === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0B1322]/80 border border-white/10 rounded-2xl h-80 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-neutral-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white mb-1">No category expenses recorded</p>
        <p className="text-xs text-neutral-400 max-w-xs">
          Once expenses are logged across transportation, stays, dining, or shopping, your live category donut chart will illuminate here.
        </p>
      </div>
    );
  }

  const labels = nonZeroCategories.map(d => d.category);
  const values = nonZeroCategories.map(d => d.spent);
  const backgroundColors = nonZeroCategories.map(d => {
    const key = d.category.toLowerCase();
    return CATEGORY_COLORS[key]?.bg || '#D4A853';
  });
  const borderColors = nonZeroCategories.map(d => {
    const key = d.category.toLowerCase();
    return CATEGORY_COLORS[key]?.border || '#B38B38';
  });

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        hoverOffset: 6
      }
    ]
  };

  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
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
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const val = context.parsed || 0;
            const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
            return ` ${currencySymbol}${val.toLocaleString()} (${pct}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm sm:text-base font-semibold text-white tracking-wide">{title}</h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Total Logged: <span className="font-semibold text-[#E2C076]">{currencySymbol}{totalSpent.toLocaleString()}</span>
          </p>
        </div>
        <span className="text-[11px] font-medium text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          {nonZeroCategories.length} Active Categories
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Doughnut Canvas with Centered Total */}
        <div className="md:col-span-6 relative h-56 flex items-center justify-center">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Total Spend</span>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              {currencySymbol}{totalSpent.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Unboxed Metadata Legend List (Zero-Pill Discipline) */}
        <div className="md:col-span-6 space-y-2">
          {data.map(cat => {
            const colorKey = cat.category.toLowerCase();
            const color = CATEGORY_COLORS[colorKey]?.bg || '#D4A853';
            const pct = cat.percentage;
            return (
              <div
                key={cat.category}
                className="flex items-center justify-between py-1 border-b border-white/[0.04] text-xs hover:bg-white/[0.02] px-1 rounded transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-slate-200">{cat.category}</span>
                  <span className="text-neutral-500 font-mono text-[10px]">({cat.count} items)</span>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <span className="font-semibold text-white">
                    {currencySymbol}{cat.spent.toLocaleString()}
                  </span>
                  <span className="text-neutral-400 font-mono w-9 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
