export default function ErrorMensaje({ error, onReintentar }) {
  if (!error) return null;
  return (
    <div className="alerta alerta-error" role="alert">
      <strong>No fue posible completar la operación.</strong> {error.message}
      {onReintentar && (
        <>
          {' '}
          <button type="button" className="enlace-boton" onClick={onReintentar}>Reintentar</button>
        </>
      )}
    </div>
  );
}
