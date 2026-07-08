"use client";

import { SafeImage } from '@/components/safe-image';
import { useLookbookEntries } from '@/lib/use-lookbook';

const FALLBACK_SPREADS = [
  { id: 1, src: '/images/dydalo-tracksuit.jpg', alt: 'Midnight Track Set', number: '01', title: 'La noche es nuestra', category: 'Ropa', description: 'Siluetas limpias, tejidos pesados y una actitud que no pide permiso.' },
  { id: 2, src: '/images/dydalo-satin-set.jpg', alt: 'Liquid Black Uniform', number: '02', title: 'Líquido y letal', category: 'Ropa', description: 'El satin set que redefine el uniforme nocturno con precisión quirúrgica.' },
  { id: 3, src: '/images/dydalo-white-basics.jpg', alt: 'Pure Form Set', number: '03', title: 'Pureza esencial', category: 'Ropa', description: 'Cuando menos es más y el fit habla solo.' },
  { id: 4, src: '/images/dydalo-sneakers.jpg', alt: 'Sneakers DYDALO', number: '04', title: 'Sobre suelo firme', category: 'Calzado', description: 'El calzado que completa el look. Sin concesiones, sin excusas.' },
  { id: 5, src: '/images/dydalo-caps.jpg', alt: 'Accesorios', number: '05', title: 'Detalles que gritan', category: 'Accesorios', description: 'Caps, cadenas y todo lo que necesitas para cerrar el fit con autoridad.' },
  { id: 6, src: '/images/dydalo-bling.jpg', alt: 'Bling', number: '06', title: 'Brillo con actitud', category: 'Bling', description: 'El hielo que no se derrite. Joyería que habla antes que tú.' },
];

export function LookbookClient() {
  const entries = useLookbookEntries();

  const spreads = entries.length > 0
    ? entries.map((e, i) => ({
        id: i + 1,
        src: e.image,
        alt: e.title,
        number: String(i + 1).padStart(2, '0'),
        title: e.title,
        category: 'Look',
        description: e.description,
      }))
    : FALLBACK_SPREADS;

  return (
    <>
      {spreads.map((spread, index) => {
        const isEven = index % 2 === 0;
        return (
          <section key={spread.id} className={`section-px ${index === spreads.length - 1 ? 'pb-16 md:pb-24' : ''} ${index === 0 ? 'pt-16 md:pt-20' : 'pt-20 md:pt-28'}`}>
            <div className="container-page">
              <div className={`flex flex-col gap-10 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} lg:items-center`}>
                <div className="relative aspect-[4/5] w-full overflow-hidden lg:w-[55%]">
                  <SafeImage src={spread.src} alt={spread.alt} width={800} height={1000} sizes="(max-width: 1024px) 100vw, 55vw" className="size-full object-cover" />
                </div>
                <div className="lg:w-[45%]">
                  <span className="text-6xl font-bold leading-none tracking-[-0.08em] text-foreground/10 sm:text-7xl md:text-8xl lg:text-9xl">{spread.number}</span>
                  <div className="-mt-4 md:-mt-6">
                    <p className="text-xs font-bold tracking-subhead text-accent">{spread.category}</p>
                    <h2 className="mt-3 text-3xl font-bold uppercase leading-[0.92] tracking-heading md:text-5xl">{spread.title}</h2>
                    <p className="mt-5 max-w-md body-text">{spread.description}</p>
                    <div className="mt-6 h-0.5 w-12 bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
