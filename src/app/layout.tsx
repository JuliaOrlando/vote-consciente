import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Vote Consciente | O Seu Match Eleitoral',
  description: 'Descubra a sua afinidade real com os deputados basedo em dados oficiais de votação da Câmara.',
}

import { Sidebar } from '@/components/Sidebar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-slate-950 text-slate-200 antialiased font-sans h-screen w-full overflow-hidden selection:bg-emerald-500/30 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-slate-900/50 relative">
          {children}
        </main>
      </body>
    </html>
  )
}
