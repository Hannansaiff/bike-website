import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatPKRShort } from '../../lib/format';
import { EmptyState } from '../ui/Feedback';

export const SERIES = ['#ff5b1f', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#94a3b8', '#e5172f'];
const axis = { fontSize: 12, fill: '#9a9ea8' };
const tooltipStyle = { background: '#16171b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#f4f4f1', fontSize: 12 };

export function ChartCard({ title, subtitle, children, action, className = '' }) {
  return (
    <section className={`a-card p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-fog">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const hasData = (data, keys) => data?.some((d) => keys.some((k) => Number(d[k]) > 0));

export function RevenueChart({ data, height = 260 }) {
  if (!hasData(data, ['revenue', 'sales'])) return <EmptyState title="No sales in this range" className="py-8" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5b1f" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ff5b1f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => formatPKRShort(v).replace('PKR ', '')} width={56} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === 'revenue' ? [formatPKRShort(v), 'Revenue (demo)'] : [v, 'Sales'])} />
        <Area type="monotone" dataKey="revenue" stroke="#ff5b1f" strokeWidth={2} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StackedBars({ data, keys, labels = {}, height = 260, xKey = 'month' }) {
  if (!hasData(data, keys)) return <EmptyState title="No data in this range" className="py-8" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => labels[v] || v} />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} name={labels[k] || k} stackId="a" fill={SERIES[i]} radius={i === keys.length - 1 ? [4, 4, 0, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 240, money = false }) {
  if (!data?.some((d) => d.value > 0)) return <EmptyState title="No data" className="py-8" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
          {data.map((d, i) => <Cell key={d.name} fill={SERIES[i % SERIES.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => (money ? formatPKRShort(v) : v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, height = 240, color = '#ff5b1f' }) {
  if (!data?.length) return <EmptyState title="No data" className="py-8" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={axis} width={110} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
