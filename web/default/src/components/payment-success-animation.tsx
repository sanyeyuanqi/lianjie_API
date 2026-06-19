import { Check } from 'lucide-react'
import { motion } from 'motion/react'

interface PaymentSuccessAnimationProps {
  title: string
}

export function PaymentSuccessAnimation({
  title,
}: PaymentSuccessAnimationProps) {
  return (
    <motion.div
      className='flex min-h-[20rem] flex-col items-center justify-center px-6 py-10 text-center'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      role='status'
      aria-live='polite'
    >
      <div className='relative flex size-28 items-center justify-center'>
        <motion.div
          className='absolute inset-0 rounded-full bg-emerald-400/20'
          initial={{ scale: 0.45, opacity: 0 }}
          animate={{ scale: [0.45, 1.2, 1], opacity: [0, 0.75, 0.35] }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
        <motion.div
          className='absolute inset-2 rounded-full bg-emerald-500/15'
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 15 }}
        />
        <motion.div
          className='relative flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_38px_rgba(16,185,129,0.35)]'
          initial={{ scale: 0, rotate: -18 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 320 }}
          >
            <Check className='size-10 stroke-[3]' />
          </motion.div>
        </motion.div>
      </div>
      <motion.p
        className='mt-6 text-xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400'
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        {title}
      </motion.p>
    </motion.div>
  )
}
