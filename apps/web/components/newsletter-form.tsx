'use client';

export function NewsletterForm({
  id = 'newsletter-email',
  title = 'Próximas colaboraciones',
  description = 'Sé el primero en enterarte de nuevas colaboraciones y drops exclusivos.',
  buttonText = 'Suscribir',
}: {
  id?: string;
  title?: string;
  description?: string;
  buttonText?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
      <div className="text-center md:text-left">
        <p className="heading-label">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector('input') as HTMLInputElement;
          if (input.value) {
            alert(`¡Gracias! Te avisaremos en ${input.value} cuando haya novedades.`);
            input.value = '';
          }
        }}
        className="flex w-full max-w-sm"
      >
        <label htmlFor={id} className="sr-only">
          Correo electrónico
        </label>
        <input
          id={id}
          type="email"
          placeholder="tu@email.com"
          className="form-input flex-1"
        />
        <button
          type="submit"
          className="newsletter-btn"
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
}
