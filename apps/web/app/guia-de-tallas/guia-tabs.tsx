'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type SizeGuide = Record<string, Record<string, string>>;

const ropaGuia: SizeGuide = {
  S:  { Pecho: '86-91', Cintura: '71-76', Cadera: '86-91' },
  M:  { Pecho: '91-99', Cintura: '76-81', Cadera: '91-99' },
  L:  { Pecho: '99-107', Cintura: '81-89', Cadera: '99-107' },
  XL: { Pecho: '107-117', Cintura: '89-99', Cadera: '107-117' },
};

const calzadoGuia: SizeGuide = {
  '38': { US: '6', UK: '5', CM: '24.0' },
  '39': { US: '6.5', UK: '5.5', CM: '24.5' },
  '40': { US: '7', UK: '6', CM: '25.0' },
  '41': { US: '8', UK: '7', CM: '26.0' },
  '42': { US: '8.5', UK: '7.5', CM: '26.5' },
  '43': { US: '9', UK: '8', CM: '27.0' },
};

const tabs = ['Ropa', 'Calzado'] as const;

export function GuiaTabs() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Ropa');
  const guia = activeTab === 'Ropa' ? ropaGuia : calzadoGuia;
  const tallas = Object.keys(guia);
  const medidas = Object.keys(guia[tallas[0]]);

  return (
    <>
      <div className="flex gap-2" role="tablist" aria-label="Categoría de tallas">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'street'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className="uppercase tracking-[0.12em]"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border border-border text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-5 py-3 micro-text font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Talla
              </th>
              {medidas.map((medida) => (
                <th
                  key={medida}
                  className="px-5 py-3 micro-text font-bold uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {medida}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tallas.map((talla, index) => (
              <tr
                key={talla}
                className={`border-b border-border transition-colors hover:bg-accent/5 ${
                  index === tallas.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="px-5 py-4 text-sm font-bold uppercase tracking-tight">
                  {talla}
                </td>
                {medidas.map((medida) => (
                  <td
                    key={medida}
                    className="px-5 py-4 text-sm tabular-nums text-muted-foreground"
                  >
                    {guia[talla][medida]}
                    {activeTab === 'Ropa' ? ' cm' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-right micro-text text-muted-foreground">
          {activeTab === 'Ropa'
            ? '* Medidas en centímetros'
            : '* Medidas en centímetros. US/UK son equivalencias.'}
        </p>
      </div>
    </>
  );
}
