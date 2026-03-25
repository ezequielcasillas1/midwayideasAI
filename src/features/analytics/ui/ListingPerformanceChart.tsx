'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card } from '@/components/ui'
import type { ListingPerformance } from '../services/analytics-service'

interface ListingPerformanceChartProps {
  data: ListingPerformance[]
  title?: string
}

export function ListingPerformanceChart({ 
  data, 
  title = 'Listing Performance' 
}: ListingPerformanceChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 8).map(item => ({
      ...item,
      name: item.listingTitle.length > 20 
        ? item.listingTitle.substring(0, 20) + '...' 
        : item.listingTitle
    }))
  }, [data])

  if (data.length === 0) {
    return (
      <Card hover={false} className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-white">{title}</h3>
        <div className="flex h-[300px] items-center justify-center text-zinc-500">
          No listing data available yet
        </div>
      </Card>
    )
  }

  return (
    <Card hover={false} className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-white">{title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis type="number" stroke="#71717a" fontSize={12} />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#71717a" 
              fontSize={11}
              width={120}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'views' ? 'Views' : 'Unique Viewers'
              ]}
            />
            <Bar 
              dataKey="views" 
              fill="#8b5cf6" 
              radius={[0, 4, 4, 0]}
              name="views"
            />
            <Bar 
              dataKey="uniqueViewers" 
              fill="#10b981" 
              radius={[0, 4, 4, 0]}
              name="uniqueViewers"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
