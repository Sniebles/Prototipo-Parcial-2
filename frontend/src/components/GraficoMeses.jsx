// Columnas por mes de una sola serie (magnitud): un solo tono, tooltip por columna y etiqueta solo en el máximo.
export default function GraficoMeses({ valores, meses, formato = (v) => v, titulo }) {
  const max = Math.max(...valores, 1);
  const ancho = 720, alto = 220, izq = 8, abajo = 26, arriba = 22;
  const paso = (ancho - izq * 2) / valores.length;
  const util = alto - abajo - arriba;
  const iMax = valores.indexOf(Math.max(...valores));
  return (
    <figure style={{ margin: 0 }}>
      <svg className="grafico-barras" viewBox={`0 0 ${ancho} ${alto}`} width="100%" style={{ maxWidth: 760, display: 'block' }} role="img" aria-label={titulo}>
        <line className="eje" x1={izq} x2={ancho - izq} y1={alto - abajo} y2={alto - abajo} />
        {valores.map((v, i) => {
          const h = v > 0 ? Math.max(2, (v / max) * util) : 0;
          const x = izq + i * paso + paso * 0.18;
          const w = paso * 0.64;
          const y = alto - abajo - h;
          return (
            <g className="item" key={meses[i]}>
              <title>{`${meses[i]}: ${formato(v)}`}</title>
              <rect x={izq + i * paso} y={arriba - 10} width={paso} height={util + 10} fill="transparent" />
              {h > 0 && <path className="barra" d={`M${x} ${alto - abajo} V${y + 4} Q${x} ${y} ${x + 4} ${y} H${x + w - 4} Q${x + w} ${y} ${x + w} ${y + 4} V${alto - abajo} Z`} />}
              <text x={x + w / 2} y={alto - 8} textAnchor="middle">{meses[i]}</text>
              {i === iMax && v > 0 && <text className="etiqueta-valor" x={x + w / 2} y={y - 6} textAnchor="middle">{formato(v)}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
