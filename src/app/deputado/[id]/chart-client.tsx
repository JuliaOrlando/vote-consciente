"use client";

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

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
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="mesAno"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#728681', fontSize: 11 }}
                    dy={10}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.96)',
                        borderColor: '#d7e0dc',
                        borderRadius: '16px',
                        boxShadow: '0 18px 50px -30px rgba(16,42,37,0.5)',
                    }}
                    itemStyle={{ color: '#0f766e', fontWeight: 'bold' }}
                    formatter={(value: number | string | undefined) => formatCurrency(Number(value || 0))}
                    labelStyle={{ color: '#55716c', marginBottom: '4px' }}
                />
                <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValor)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
