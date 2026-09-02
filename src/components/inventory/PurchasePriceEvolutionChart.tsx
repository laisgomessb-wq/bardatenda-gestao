import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Building2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { PurchaseRecord } from '../../types';
import { formatCurrency, formatDateBR } from '../../utils/formatters';

interface PurchasePriceEvolutionChartProps {
  history: PurchaseRecord[];
  productName?: string;
  unit?: string;
  defaultUnitPrice?: number;
  onSelectRecord?: (record: PurchaseRecord) => void;
  className?: string;
}

export const PurchasePriceEvolutionChart: React.FC<PurchasePriceEvolutionChartProps> = ({
  history,
  productName = 'Produto',
  unit = 'un',
  defaultUnitPrice = 0,
  onSelectRecord,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(700);

  // Ordena cronologicamente os registros
  const records = useMemo(() => {
    let list = history && history.length > 0 ? [...history] : [];
    
    // Se não houver histórico mas houver preço padrão, cria 1 registro de referência
    if (list.length === 0 && defaultUnitPrice > 0) {
      list = [
        {
          id: 'rec-default',
          date: new Date().toISOString().split('T')[0],
          quantity: 1,
          unitPrice: defaultUnitPrice,
          totalPrice: defaultUnitPrice,
          supplier: 'Preço Atual Cadastrado',
          invoiceNumber: 'Entrada Inicial',
          notes: 'Cadastro inicial',
        },
      ];
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history, defaultUnitPrice]);

  // Índice selecionado (por padrão, seleciona o último ou o penúltimo para simular o destaque)
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    if (records.length >= 2) return 1; // Ponto 2 selecionado por padrão como na referência
    return Math.max(0, records.length - 1);
  });

  // Atualiza a seleção quando a lista de registros mudar
  useEffect(() => {
    if (records.length > 0) {
      // Mantém a seleção dentro dos limites
      setSelectedIndex((prev) => (prev >= records.length ? records.length - 1 : prev));
    }
  }, [records.length]);

  // Monitora a largura do contêiner para responsividade perfeita
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Faixa de Preços (Mínimo e Máximo)
  const { minPrice, maxPrice } = useMemo(() => {
    if (records.length === 0) {
      return { minPrice: defaultUnitPrice, maxPrice: defaultUnitPrice };
    }
    const prices = records.map((r) => r.unitPrice);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [records, defaultUnitPrice]);

  // Dimensões do Gráfico SVG
  const svgHeight = 280;
  const paddingLeft = 70;
  const paddingRight = 45;
  const paddingTop = 45;
  const paddingBottom = 45;

  const chartWidth = Math.max(300, containerWidth);
  const plotWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);
  const plotHeight = Math.max(80, svgHeight - paddingTop - paddingBottom);

  // Escala Dinâmica do Eixo Y
  const { yMin, yMax, yTicks } = useMemo(() => {
    if (records.length === 0) {
      return { yMin: 0, yMax: 10, yTicks: [10, 7.5, 5, 2.5, 0] };
    }

    let min = minPrice;
    let max = maxPrice;

    // Se todos os preços forem iguais, dá uma margem artificial
    if (min === max) {
      min = Math.max(0, min * 0.85);
      max = max * 1.15 || 10;
    } else {
      const range = max - min;
      const padding = range * 0.22;
      min = Math.max(0, min - padding);
      max = max + padding;
    }

    // Gera 4 ou 5 ticks espaçados uniformemente
    const numTicks = 4;
    const step = (max - min) / (numTicks - 1);
    const ticks: number[] = [];
    for (let i = numTicks - 1; i >= 0; i--) {
      ticks.push(min + i * step);
    }

    return { yMin: min, yMax: max, yTicks: ticks };
  }, [minPrice, maxPrice, records.length]);

  // Cálculo das Coordenadas (X, Y) de cada ponto
  const points = useMemo(() => {
    if (records.length === 0) return [];

    const n = records.length;
    return records.map((rec, index) => {
      let x = paddingLeft;
      if (n === 1) {
        x = paddingLeft + plotWidth / 2;
      } else {
        x = paddingLeft + (index / (n - 1)) * plotWidth;
      }

      const normalizedY = (rec.unitPrice - yMin) / (yMax - yMin || 1);
      // Inverte o Y para SVG (0 é o topo)
      const y = paddingTop + (1 - Math.max(0, Math.min(1, normalizedY))) * plotHeight;

      return {
        ...rec,
        index,
        x,
        y,
        formattedDate: formatDateBR(rec.date),
      };
    });
  }, [records, yMin, yMax, plotWidth, plotHeight, paddingLeft, paddingTop]);

  // Construção do Path da Linha e da Área Preenchida
  const { linePath, areaPath, firstSegmentEndPercent } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '', firstSegmentEndPercent: 100 };

    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
        areaPath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${paddingTop + plotHeight} L ${p.x - 20} ${paddingTop + plotHeight} Z`,
        firstSegmentEndPercent: 100,
      };
    }

    // Gera o caminho com linhas suaves / diretas
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }

    // Caminho da Área (fecha na base inferior do gráfico)
    const bottomY = paddingTop + plotHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const areaD = `${d} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    // Percentual exato de término do primeiro segmento para o gradiente de cor da linha
    const firstPercent = Math.max(5, Math.min(95, (1 / (points.length - 1)) * 100));

    return {
      linePath: d,
      areaPath: areaD,
      firstSegmentEndPercent: firstPercent,
    };
  }, [points, paddingTop, plotHeight]);

  const selectedPoint = points[selectedIndex] || points[0] || null;

  const handlePointClick = (idx: number) => {
    setSelectedIndex(idx);
    if (onSelectRecord && records[idx]) {
      onSelectRecord(records[idx]);
    }
  };

  // IDs únicos para gradientes SVG
  const gradientId = useMemo(() => `chart-line-grad-${Math.random().toString(36).substr(2, 6)}`, []);
  const areaGradientId = useMemo(() => `chart-area-grad-${Math.random().toString(36).substr(2, 6)}`, []);

  return (
    <div
      ref={containerRef}
      id="purchase-price-evolution-card"
      className={`w-full bg-[#0c0d12] border border-zinc-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all ${className}`}
    >
      {/* 🌟 1. CABEÇALHO DO CARD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/70 relative z-10">
        {/* Canto Superior Esquerdo: Ícone dourado, Título e Subtítulo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center font-bold shadow-inner shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-100 tracking-tight leading-tight">
              Gráfico de Evolução do Preço de Compra
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              {records.length}{' '}
              {records.length === 1 ? 'registro cronológico de entrada' : 'registros cronológicos de entrada'}
            </p>
          </div>
        </div>

        {/* Canto Superior Direito: Indicador Pill de Faixa de Preços */}
        <div
          id="pill-price-range"
          className="rounded-full px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 text-xs flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="text-zinc-400 font-medium">Faixa:</span>
          <span className="text-emerald-400 font-bold tracking-tight">
            {formatCurrency(minPrice)}
          </span>
          <span className="text-zinc-500 font-bold">→</span>
          <span className="text-amber-400 font-bold tracking-tight">
            {formatCurrency(maxPrice)}
          </span>
        </div>
      </div>

      {/* 📊 2. ÁREA DO GRÁFICO SVG INTERATIVO */}
      <div className="w-full relative mt-2 select-none">
        {records.length === 0 ? (
          <div className="w-full h-56 flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <Package className="w-9 h-9 text-zinc-600" />
            <p className="text-xs text-zinc-400">Nenhum registro de compra cadastrado.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto scrollbar-none">
            <svg
              width={chartWidth}
              height={svgHeight}
              viewBox={`0 0 ${chartWidth} ${svgHeight}`}
              className="w-full overflow-visible"
            >
              <defs>
                {/* Gradiente da Linha do Gráfico (Primeiro trecho verde -> amarelo, restante amarelo) */}
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset={`${firstSegmentEndPercent}%`} stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>

                {/* Gradiente da Área Preenchida (Amarelo transparente até sumir na base) */}
                <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* 📏 Linhas Horizontais Pontilhadas e Valores do Eixo Y */}
              {yTicks.map((tickVal, i) => {
                const normalized = (tickVal - yMin) / (yMax - yMin || 1);
                const yPos = paddingTop + (1 - Math.max(0, Math.min(1, normalized))) * plotHeight;
                return (
                  <g key={`ytick-${i}`}>
                    {/* Linha horizontal pontilhada */}
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={chartWidth - paddingRight}
                      y2={yPos}
                      stroke="#27272a"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    {/* Texto do valor no Eixo Y */}
                    <text
                      x={paddingLeft - 10}
                      y={yPos + 3.5}
                      textAnchor="end"
                      className="fill-zinc-500 text-[10px] sm:text-[11px] font-medium font-sans"
                    >
                      {formatCurrency(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* 🌅 Área Preenchida Abaixo da Linha */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#${areaGradientId})`}
                  className="transition-all duration-300 pointer-events-none"
                />
              )}

              {/* ⚡ Linha Principal do Gráfico */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* 📍 Linha Vertical Pontilhada Dourada do Ponto Selecionado */}
              {selectedPoint && (
                <g className="animate-in fade-in duration-200">
                  <line
                    x1={selectedPoint.x}
                    y1={selectedPoint.y}
                    x2={selectedPoint.x}
                    y2={paddingTop + plotHeight}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  />
                  {/* Ponto na base do eixo X */}
                  <circle
                    cx={selectedPoint.x}
                    cy={paddingTop + plotHeight}
                    r="2.5"
                    fill="#F59E0B"
                  />
                </g>
              )}

              {/* 🔵 Marcadores Circulares nos Pontos (com áreas de clique amplas) */}
              {points.map((pt, idx) => {
                const isSelected = selectedIndex === idx;

                return (
                  <g
                    key={`point-group-${pt.id || idx}`}
                    className="cursor-pointer group"
                    onClick={() => handlePointClick(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {/* Área invisível ampla para facilitar clique e toque no celular */}
                    <rect
                      x={pt.x - 24}
                      y={pt.y - 35}
                      width={48}
                      height={svgHeight - pt.y + 40}
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Efeito Glow / Anel externo no ponto selecionado */}
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="13"
                        fill="#F59E0B"
                        fillOpacity="0.2"
                        stroke="#F59E0B"
                        strokeWidth="1"
                        strokeOpacity="0.5"
                        className="animate-pulse"
                      />
                    )}

                    {/* Círculo Principal do Ponto */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6.5 : 4.5}
                      fill="#0c0d12"
                      stroke="#F59E0B"
                      strokeWidth={isSelected ? 3 : 2.5}
                      className="transition-all duration-150"
                    />

                    {/* Miolo dourado quando selecionado */}
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="2.5"
                        fill="#F59E0B"
                      />
                    )}
                  </g>
                );
              })}

              {/* 🏷️ Etiquetas de Preço Acima dos Pontos (Renderizadas via SVG para precisão) */}
              {points.map((pt, idx) => {
                const isSelected = selectedIndex === idx;
                const priceText = formatCurrency(pt.unitPrice);
                const tagWidth = isSelected ? 76 : 66;
                const tagHeight = isSelected ? 24 : 20;
                const tagX = pt.x - tagWidth / 2;
                const tagY = pt.y - tagHeight - (isSelected ? 14 : 10);

                return (
                  <g
                    key={`tag-group-${pt.id || idx}`}
                    className="cursor-pointer select-none"
                    onClick={() => handlePointClick(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {isSelected ? (
                      /* Etiqueta Selecionada: Fundo Amarelo / Dourado e Texto Escuro */
                      <g className="filter drop-shadow-md">
                        <rect
                          x={tagX}
                          y={tagY}
                          width={tagWidth}
                          height={tagHeight}
                          rx="6"
                          fill="#F59E0B"
                          stroke="#FBBF24"
                          strokeWidth="1"
                        />
                        <text
                          x={pt.x}
                          y={tagY + 16}
                          textAnchor="middle"
                          className="fill-zinc-950 text-[11px] font-black font-sans tracking-tight"
                        >
                          {priceText}
                        </text>
                      </g>
                    ) : (
                      /* Etiqueta Normal: Fundo Escuro com borda discreta e Texto Claro */
                      <g className="hover:opacity-100 transition-opacity">
                        <rect
                          x={tagX}
                          y={tagY}
                          width={tagWidth}
                          height={tagHeight}
                          rx="5"
                          fill="#18181b"
                          stroke="#3f3f46"
                          strokeWidth="0.9"
                          fillOpacity="0.95"
                        />
                        <text
                          x={pt.x}
                          y={tagY + 14}
                          textAnchor="middle"
                          className="fill-zinc-100 text-[10px] font-bold font-sans tracking-tight"
                        >
                          {priceText}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 📅 Eixo X: Datas Cronológicas Alinhadas Abaixo dos Pontos */}
              {points.map((pt, idx) => {
                const isSelected = selectedIndex === idx;
                const yPos = paddingTop + plotHeight + 22;

                return (
                  <g
                    key={`xdate-${pt.id || idx}`}
                    className="cursor-pointer select-none"
                    onClick={() => handlePointClick(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <text
                      x={pt.x}
                      y={yPos}
                      textAnchor="middle"
                      className={`text-[10px] sm:text-[11px] font-sans transition-colors ${
                        isSelected
                          ? 'fill-amber-400 font-bold'
                          : 'fill-zinc-400 font-medium hover:fill-zinc-200'
                      }`}
                    >
                      {pt.formattedDate}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* 📋 3. CARD DE DETALHES DO REGISTRO SELECIONADO */}
      {selectedPoint && (
        <div className="mt-3 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100 text-sm">
                  {selectedPoint.formattedDate}
                </span>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                  {selectedPoint.invoiceNumber || 'Entrada'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-zinc-500" />
                <span>{selectedPoint.supplier || 'Fornecedor padrão'}</span>
                {selectedPoint.notes && (
                  <span className="text-zinc-500 truncate max-w-[220px]">
                    • {selectedPoint.notes}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                Quantidade
              </span>
              <span className="font-bold text-zinc-200">
                {selectedPoint.quantity} {unit}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                Preço Unitário
              </span>
              <span className="font-black text-amber-400 text-sm sm:text-base">
                {formatCurrency(selectedPoint.unitPrice)}
              </span>
            </div>

            <div className="text-right pl-3 border-l border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                Total da Compra
              </span>
              <span className="font-bold text-zinc-100">
                {formatCurrency(selectedPoint.totalPrice || selectedPoint.quantity * selectedPoint.unitPrice)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
