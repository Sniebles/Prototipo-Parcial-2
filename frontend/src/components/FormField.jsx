// Campo de formulario con etiqueta asociada y mensaje de error accesible
import { useId } from 'react';

export default function FormField({ etiqueta, error, ayuda, obligatorio, clase = '', as = 'input', children, ...props }) {
  const id = useId();
  const Control = as;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  return (
    <div className={`campo${error ? ' invalido' : ''}${clase ? ` ${clase}` : ''}`}>
      <label htmlFor={id}>{etiqueta}{obligatorio && <span className="obligatorio" aria-hidden="true"> *</span>}</label>
      <Control id={id} aria-invalid={Boolean(error)} aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined} required={obligatorio} {...props}>
        {children}
      </Control>
      {ayuda && <span id={idAyuda} className="ayuda">{ayuda}</span>}
      {error && <span id={idError} className="error">{error}</span>}
    </div>
  );
}
