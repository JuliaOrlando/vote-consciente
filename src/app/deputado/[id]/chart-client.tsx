"use client";

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DespesaData {
    mesAno: string;
    valor: number;
}

export function DespesasChart({ data }: { data: { tipoMesAno: string, valor: number }[] }) {
    // Transforma o Array do Prisma para agrupar e entender o gráfico
    const formattedData = data.map(d => ({
        mesAno: d.tipoMesAno,
        valor: d.valor
    }));

    if (formattedData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                Contas à declarar / em processamento.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="mesAno"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    formatter={(value: number | string | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValor)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
