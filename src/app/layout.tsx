import type { Metadata } from 'next'
import { Manrope, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/AppShell'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' })

export const metadata: Metadata = {
  title: 'Vote Consciente | Entenda votos, mandatos e afinidades',
  description:
    'Compare votações, acompanhe parlamentares e descubra sua afinidade com deputados federais a partir de dados públicos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${sourceSerif.variable}`}>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
