'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  ArrowRight, 
  Code2, 
  DollarSign, 
  Users, 
  Zap,
  Shield,
  TrendingUp,
  Star,
  CheckCircle
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { MidwayMeter } from '@/components/MidwayMeter'
import { MembershipTiers } from '@/features/membership'

const features = [
  {
    icon: Code2,
    title: 'Unfinished Projects',
    description: 'Buy and sell partially completed development projects. Perfect for devs who need a head start.',
  },
  {
    icon: DollarSign,
    title: 'Fair Pricing',
    description: 'Projects priced based on completion percentage. Pay for what\'s built, not what\'s promised.',
  },
  {
    icon: Shield,
    title: 'Secure Transfers',
    description: 'Safe code handoffs with repository access management and documentation included.',
  },
  {
    icon: Zap,
    title: 'Skip the Setup',
    description: 'Jump straight into development with pre-configured projects, avoiding boilerplate work.',
  },
]

const stats = [
  { label: 'Projects Listed', value: '500+' },
  { label: 'Successful Sales', value: '150+' },
  { label: 'Developers', value: '1,200+' },
  { label: 'Total Value', value: '$250K+' },
]

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Full Stack Developer',
    content: 'Bought a 70% complete SaaS dashboard. Saved me 3 weeks of development time!',
    rating: 5,
  },
  {
    name: 'Sarah Miller',
    role: 'Indie Hacker',
    content: 'Finally sold my abandoned project. Someone else will finish what I started.',
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'Startup Founder',
    content: 'The MidwayMeter helps us quickly assess project completion. Game changer.',
    rating: 5,
  },
]

export default function LandingPreviewPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              MIDWAY<span className="text-violet-400">IDEAS</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-[100px]" />
        </div>
        
        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
              <Zap className="h-4 w-4" />
              The marketplace for unfinished projects
            </span>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Buy & Sell
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Halfway Done
              </span>
              <br />
              Projects
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-400 sm:text-xl">
              Skip the boilerplate. Find partially-built apps, websites, and tools 
              ready for you to finish. Or sell your abandoned projects to devs who'll 
              give them new life.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/browse">
                <Button size="lg" className="min-w-[180px]">
                  Browse Projects
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="secondary" size="lg" className="min-w-[180px]">
                  Start Selling
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <Card hover={false} className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">E-commerce Dashboard</h3>
                  <p className="text-zinc-400">React + Node.js + PostgreSQL</p>
                </div>
                <span className="text-2xl font-bold text-emerald-400">$1,200</span>
              </div>
              <MidwayMeter percent={72} size="lg" />
              <div className="mt-4 flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Tailwind', 'Node.js', 'PostgreSQL'].map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-zinc-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Why MIDWAY?
            </h2>
            <p className="mx-auto max-w-2xl text-zinc-400">
              The only marketplace designed specifically for partially-completed projects
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full p-6">
                  <div className="mb-4 inline-flex rounded-xl bg-violet-500/10 p-3">
                    <feature.icon className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              How It Works
            </h2>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'List or Browse',
                description: 'Sellers list their unfinished projects with completion details. Buyers browse by category, tech stack, or completion level.',
              },
              {
                step: '02',
                title: 'Review & Connect',
                description: 'Check the MidwayMeter to assess progress. Review code samples, demos, and documentation. Contact the seller directly.',
              },
              {
                step: '03',
                title: 'Transfer & Build',
                description: 'Complete the purchase, receive repository access and documentation. Continue building where they left off.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card hover={false} className="h-full p-6">
                  <span className="mb-4 inline-block text-4xl font-bold text-violet-500/30">
                    {item.step}
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-zinc-400">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/50 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              What Developers Say
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover={false} className="h-full p-6">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-zinc-300">"{testimonial.content}"</p>
                  <div>
                    <p className="font-medium text-white">{testimonial.name}</p>
                    <p className="text-sm text-zinc-400">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MembershipTiers />

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card hover={false} className="overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center sm:p-12">
                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                  Ready to Get Started?
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-violet-100">
                  Join thousands of developers buying and selling unfinished projects. 
                  Your next big project might already be halfway done.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/browse">
                    <Button variant="secondary" size="lg">
                      Browse Projects
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button 
                      size="lg" 
                      className="bg-white text-violet-600 hover:bg-zinc-100"
                    >
                      Create Account
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">MIDWAY IDEAS</span>
            </div>
            <p className="text-sm text-zinc-400">
              © 2026 MIDWAY IDEAS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
