'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'

export type Card = {
  title: string
  src: string
}

export function Card({
  card,
  index,
  hovered,
  setHovered,
}: {
  card: Card
  index: number
  hovered: number | null
  setHovered: React.Dispatch<React.SetStateAction<number | null>>
}) {
  return (
    <motion.div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'rounded-xl relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out cursor-pointer',
        hovered !== null && hovered !== index && 'blur-sm scale-[0.98]'
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="object-cover absolute inset-0 w-full h-full"
      />
      <div
        className={cn(
          'absolute inset-0 bg-black/50 flex items-end py-8 px-4 transition-opacity duration-300',
          hovered === index ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-200">
          {card.title}
        </div>
      </div>
    </motion.div>
  )
}

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  )
}

