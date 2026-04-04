import React from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartWidget({ jsonString }) {
  let chartData;
  try {
    chartData = JSON.parse(jsonString);
  } catch (err) {
    return <div style={{ color: 'red' }}>Failed to parse chart data.</div>;
  }

  const { chartType, title, data } = chartData;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="label" stroke="#b5b2ab" fontSize={11} tickMargin={8} />
            <YAxis stroke="#b5b2ab" fontSize={11} w={40} />
            <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8 }} />
            <Line type="monotone" dataKey="value" stroke="#d97757" strokeWidth={3} dot={{ r: 4, fill: "#d97757" }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="label" name="Label" stroke="#b5b2ab" fontSize={11} />
            <YAxis dataKey="value" name="Value" stroke="#b5b2ab" fontSize={11} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8 }} />
            <Scatter data={data} fill="#d97757" />
          </ScatterChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="label" stroke="#b5b2ab" fontSize={11} tickMargin={8} />
            <YAxis stroke="#b5b2ab" fontSize={11} width={40} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            <Bar dataKey="value" fill="#d97757" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #161616, #1a1a1a)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      padding: '20px',
      marginTop: '16px',
      marginBottom: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '600px'
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f2f0eb', marginBottom: 16, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" fill="none" stroke="#d97757" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {title || 'Data Visualization'}
      </h3>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
