interface SparklineProps {
  valores: number[];
  ancho?: number;
  alto?: number;
  color?: string;
}

export function Sparkline({ valores, ancho = 280, alto = 64, color }: SparklineProps) {
  if (valores.length < 2) {
    return (
      <svg width={ancho} height={alto} role="img" aria-label="Sin suficientes datos históricos">
        <text
          x={ancho / 2}
          y={alto / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="var(--color-texto-tenue)"
        >
          Aún no hay historial suficiente
        </text>
      </svg>
    );
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const paso = ancho / (valores.length - 1);
  const margen = 6;

  const puntos = valores.map((v, i) => {
    const x = i * paso;
    const y = margen + (1 - (v - min) / rango) * (alto - margen * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Evolución histórica">
      <polyline
        points={puntos.join(' ')}
        fill="none"
        stroke={color ?? 'var(--color-primario)'}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {puntos.map((p, i) => {
        const [x, y] = p.split(',');
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color ?? 'var(--color-primario)'} />;
      })}
    </svg>
  );
}
