export default function EmptyState({ icono = '🗂', titulo, children }) {
  return (
    <div className="vacio">
      <div className="icono" aria-hidden="true">{icono}</div>
      <p><strong>{titulo}</strong></p>
      {children}
    </div>
  );
}
