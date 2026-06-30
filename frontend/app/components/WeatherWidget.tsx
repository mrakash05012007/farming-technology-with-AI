import React from 'react';
import { Thermometer, Droplet, Wind, CloudRain, Sun } from 'lucide-react';

interface WeatherSummary {
  temperature_c?: number;
  humidity_pct?: number;
  wind_speed_kmh?: number;
  rainfall_mm?: number;
}

interface WeatherWidgetProps {
  summary: WeatherSummary | null;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ summary }) => {
  const temp     = summary?.temperature_c  ?? '--';
  const humidity = summary?.humidity_pct   ?? '--';
  const wind     = summary?.wind_speed_kmh ?? '--';
  const rainfall = summary?.rainfall_mm    ?? '--';

  const stats = [
    { icon: Thermometer, label: 'Temp',     value: `${temp}°C`,    color: 'text-amber-300' },
    { icon: Droplet,     label: 'Humidity', value: `${humidity}%`, color: 'text-cyan-300'  },
    { icon: Wind,        label: 'Wind',     value: `${wind}km/h`,  color: 'text-sky-300'   },
    { icon: CloudRain,   label: 'Rain',     value: `${rainfall}mm`,color: 'text-teal-300'  },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f766e 0%, #059669 50%, #065f46 100%)',
      borderRadius: '18px',
      padding: '20px',
      border: '1px solid rgba(52,211,153,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,153,0.3), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(167,243,208,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Microclimate Intel
          </p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            Live IoT sensor station 01
          </p>
        </div>
        <Sun className="spin-slow" style={{ width: '28px', height: '28px', color: '#fde68a' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '10px 6px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            <Icon style={{ width: '16px', height: '16px', margin: '0 auto 4px' }} className={color} />
            <p style={{ fontSize: '9px', color: 'rgba(167,243,208,0.65)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
