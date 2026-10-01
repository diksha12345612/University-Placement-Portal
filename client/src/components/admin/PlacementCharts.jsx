import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Chart colours in one place. One series per chart, so one hue (blue); text stays in grey ink.
const COLORS = {
  bar: '#2a78d6',
  grid: '#e1e0d9',
  axis: '#898781',
  label: '#52514e',
}
const MAX_COMPANIES = 8 // more than this become "Other", so the chart stays readable

// Small white box shown on hover
const ChartTooltip = ({ active, payload, render }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">{render(payload[0].payload)}</div>
  )
}

// "View as table": the same numbers as text, for screen readers and for anyone who prefers a table
const DataTable = ({ columns, rows }) => (
  <details className="mt-3 text-sm">
    <summary className="cursor-pointer text-blue-600 hover:underline">View as table</summary>
    <table className="mt-2 w-full text-left">
      <thead className="text-gray-500">
        <tr>
          {columns.map((c) => (
            <th key={c.key} className="py-1 pr-4 font-medium">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {rows.map((row, i) => (
          <tr key={i} className="border-t">
            {columns.map((c) => (
              <td key={c.key} className="py-1 pr-4">
                {row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </details>
)

const ChartCard = ({ title, subtitle, children }) => (
  <div className="card p-5">
    <h2 className="font-semibold">{title}</h2>
    <p className="mb-4 text-sm text-gray-500">{subtitle}</p>
    {children}
  </div>
)

const EmptyChart = ({ text }) => <p className="py-10 text-center text-sm text-gray-500">{text}</p>

export const DepartmentChart = ({ data }) => {
  const hasData = data.some((d) => d.total > 0)

  return (
    <ChartCard title="Department-wise placement" subtitle="Share of students placed in each department">
      {!hasData ? (
        <EmptyChart text="No students yet." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={COLORS.grid} />
              <XAxis dataKey="department" tickLine={false} axisLine={{ stroke: COLORS.grid }} tick={{ fill: COLORS.axis, fontSize: 12 }} />
              <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={
                  <ChartTooltip
                    render={(d) => (
                      <>
                        <p className="font-medium">{d.department}</p>
                        <p className="text-gray-600">
                          {d.placed} of {d.total} placed ({d.percentage}%)
                        </p>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="percentage" fill={COLORS.bar} radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="percentage" position="top" formatter={(v) => `${v}%`} fill={COLORS.label} fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DataTable
            columns={[
              { key: 'department', label: 'Department' },
              { key: 'total', label: 'Students' },
              { key: 'placed', label: 'Placed' },
              { key: 'percentage', label: 'Placed %' },
            ]}
            rows={data}
          />
        </>
      )}
    </ChartCard>
  )
}

export const CompanyChart = ({ data }) => {
  // Keep the top companies and fold the rest into "Other"
  const top = data.slice(0, MAX_COMPANIES)
  const rest = data.slice(MAX_COMPANIES)
  const rows = rest.length > 0 ? [...top, { company: 'Other', placed: rest.reduce((sum, c) => sum + c.placed, 0) }] : top

  return (
    <ChartCard title="Company-wise placement" subtitle="Number of students placed by each company">
      {rows.length === 0 ? (
        <EmptyChart text="No students placed yet." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 40)}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={COLORS.grid} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: COLORS.axis, fontSize: 12 }} />
              <YAxis type="category" dataKey="company" width={110} tickLine={false} axisLine={{ stroke: COLORS.grid }} tick={{ fill: COLORS.label, fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={
                  <ChartTooltip
                    render={(d) => (
                      <>
                        <p className="font-medium">{d.company}</p>
                        <p className="text-gray-600">
                          {d.placed} student{d.placed === 1 ? '' : 's'} placed
                        </p>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="placed" fill={COLORS.bar} radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList dataKey="placed" position="right" fill={COLORS.label} fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <DataTable
            columns={[
              { key: 'company', label: 'Company' },
              { key: 'placed', label: 'Students placed' },
            ]}
            rows={rows}
          />
        </>
      )}
    </ChartCard>
  )
}
