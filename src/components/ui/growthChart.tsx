import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';

// Mock data matching your "Revenue and user growth" requirement
const data = [
  { name: 'Jan', revenue: 18000, users: 4000 },
  { name: 'Feb', revenue: 22000, users: 4500 },
  { name: 'Mar', revenue: 26000, users: 5100 },
  { name: 'Apr', revenue: 32000, users: 6000 },
  { name: 'May', revenue: 28000, users: 5800 },
  { name: 'Jun', revenue: 38000, users: 7200 },
  { name: 'Jul', revenue: 45000, users: 8400 },
];

export function GrowthChart() {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60 p-6 w-full flex flex-col h-full">
      
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-600 tracking-wide">Platform Growth</h3>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">$45,200.50</span>
            <div className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12.4%
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            Revenue
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-200"></div>
            Users
          </div>
        </div>
      </div>

      {/* The Actual Chart */}
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            {/* Subtle background grid lines */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
            
            {/* X and Y Axes */}
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            
            {/* Hover Tooltip */}
            <Tooltip 
              cursor={{ fill: '#F4F4F5' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            
            {/* The Bars (Notice the radius for rounded tops!) */}
            <Bar dataKey="revenue" fill="#9333EA" radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="users" fill="#E9D5FF" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}