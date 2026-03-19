'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, DollarSign, FileText, Image, Code, Link2, CheckCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui'

interface SellingAdviceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SellingAdviceModal({ isOpen, onClose }: SellingAdviceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/20 p-2">
                    <Lightbulb className="h-5 w-5 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Advice on Selling</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                <p className="mb-6 text-zinc-400">
                  Follow these best practices to create a compelling listing that attracts buyers and maximizes your project&apos;s value.
                </p>

                <div className="space-y-6">
                  <AdviceSection
                    icon={<FileText className="h-5 w-5" />}
                    title="Craft a Strong Title & Description"
                    tips={[
                      'Use a clear, descriptive title that explains what your project does (e.g., "SaaS Dashboard with Analytics & Billing")',
                      'Highlight key features and what makes your project unique in the first sentence',
                      'Be honest about what\'s complete and what still needs work',
                      'List specific functionalities: auth, payments, admin panel, etc.',
                      'Mention any technical debt or known issues upfront - transparency builds trust',
                    ]}
                  />

                  <AdviceSection
                    icon={<Image className="h-5 w-5" />}
                    title="Use High-Quality Images"
                    tips={[
                      'Upload all 3 allowed images - listings with images get 4x more views',
                      'First image is your cover - make it count with a clean UI screenshot',
                      'Show different features: dashboard, mobile view, key functionality',
                      'Use PNG or JPEG format, ensure images are clear and not blurry',
                      'Consider adding annotations to highlight important features',
                    ]}
                  />

                  <AdviceSection
                    icon={<DollarSign className="h-5 w-5" />}
                    title="Price Your Project Right"
                    tips={[
                      'Research similar projects to understand market rates',
                      'Factor in: development hours, complexity, tech stack popularity',
                      'Projects with 70%+ completion typically sell for 2-3x more',
                      'Consider starting slightly higher - you can negotiate down',
                      'Include what buyers get: source code, documentation, support period',
                    ]}
                  />

                  <AdviceSection
                    icon={<TrendingUp className="h-5 w-5" />}
                    title="Set Accurate Completion Percentage"
                    tips={[
                      'Be realistic - overestimating completion erodes buyer trust',
                      '0-30%: Core concept/prototype only',
                      '30-60%: Main features working, needs polish',
                      '60-80%: Most features complete, needs testing/refinement',
                      '80-100%: Production-ready with minor tweaks needed',
                    ]}
                  />

                  <AdviceSection
                    icon={<Code className="h-5 w-5" />}
                    title="Detail Your Tech Stack"
                    tips={[
                      'List all major technologies, frameworks, and libraries used',
                      'Include version numbers for critical dependencies',
                      'Mention database, hosting requirements, and third-party services',
                      'Popular stacks (React, Next.js, Node) attract more buyers',
                      'Note any proprietary or licensed components that transfer with sale',
                    ]}
                  />

                  <AdviceSection
                    icon={<Link2 className="h-5 w-5" />}
                    title="Provide Demo & Repository Links"
                    tips={[
                      'Live demos significantly increase buyer confidence',
                      'If no public demo, consider a video walkthrough',
                      'GitHub/GitLab links show code quality and commit history',
                      'Make repos private but mention you\'ll share access with serious buyers',
                      'Include README with setup instructions in your repository',
                    ]}
                  />

                  <AdviceSection
                    icon={<CheckCircle className="h-5 w-5" />}
                    title="Choose the Right Status"
                    tips={[
                      'Start with "Draft" to perfect your listing before publishing',
                      'Only set "Active" when you\'re ready for buyer inquiries',
                      'You can switch between draft and active anytime',
                      'Draft listings let you preview how buyers will see your project',
                    ]}
                  />
                </div>

                <div className="mt-8 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <h3 className="mb-2 font-semibold text-violet-300">Pro Tip</h3>
                  <p className="text-sm text-zinc-300">
                    Projects that include documentation, tests, and a clear README sell 60% faster. 
                    Take time to clean up your codebase before listing - first impressions matter!
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={onClose}>
                    Got it, let&apos;s sell!
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

interface AdviceSectionProps {
  icon: React.ReactNode
  title: string
  tips: string[]
}

function AdviceSection({ icon, title, tips }: AdviceSectionProps) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-zinc-700 p-2 text-violet-400">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}
