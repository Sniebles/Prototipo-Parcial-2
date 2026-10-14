// Barras horizontales de una sola serie (magnitud): un solo tono, etiquetas de valor, tooltip por barra.
export default function GraficoBarras({ datos, etiqueta, valor, formato = (v) => v, titulo }) {
  const filas = datos.map((d) => ({ nombre: String(d[etiqueta] ?? '—'), v: Number(d[valor]) || 0 }));
  if (!filas.length) return null;
  const max = Math.max(...filas.map((f) => f.v), 1);
  const alto = 30;
  const izq = 220;
  const ancho = 720;
  const der = 120;
  const util = ancho - izq - der;
  return (
    <figure style={{ margin: 0 }}>
      <svg className="grafico-barras" viewBox={`0 0 ${ancho} ${filas.length * alto + 12}`} width="100%" style={{ maxWidth: 760, display: 'block' }} role="img" aria-label={titulo}>
        <line className="eje" x1={izq} x2={izq} y1="0" y2={filas.length * alto + 6} />
        {filas.map((f, i) => {
          const w = Math.max(2, (f.v / max) * util);
          const y = i * alto + 6;
          return (
            <g className="item" key={f.nombre + i}>
              <title>{`${f.nombre}: ${formato(f.v)}`}</title>
              <text x={izq - 8} y={y + 15} textAnchor="end">{f.nombre.length > 32 ? `${f.nombre.slice(0, 31)}…` : f.nombre}</text>
              <rect className="barra" x={izq} y={y + 3} width={w} height={alto - 12} rx="4" />
              <text className="etiqueta-valor" x={izq + w + 6} y={y + 15}>{formato(f.v)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
