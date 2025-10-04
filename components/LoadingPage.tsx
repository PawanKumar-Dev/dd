import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingPageProps {
  message?: string;
}

export default function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-4"
        >
          <Loader2 className="h-8 w-8 text-blue-600" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 font-medium"
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}
