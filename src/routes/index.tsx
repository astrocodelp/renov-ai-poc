import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Wand2,
  Camera,
  Home,
  Layers3,
  Play,
  FolderOpen,
  ChevronRight,
  Zap,
  Database,
  Shield,
  Bot,
  Image,
  Boxes,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FocusCards } from '@/components/ui/focus-cards'
import { Carousel, CarouselCard } from '@/components/ui/apple-cards-carousel'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">RenovAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#capabilities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Capabilities</a>
            <a href="#tech" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tech Stack</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gap-2">
                Get Started <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden gradient-hero">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              Powered by AI • Built for Designers
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6 leading-tight">
              Transform Spaces with{' '}
              <span className="text-gradient">AI-Powered</span>{' '}
              Interior Design
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload floor plans, snap photos, and watch AI generate photorealistic renovations 
              with precise coordinates. Create stunning 3D walkthroughs in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Start Designing <Wand2 className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12">
                <Play className="w-5 h-5" /> Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Image Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
              <img 
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&h=800&fit=crop"
                alt="Modern interior design showcase"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
              
              {/* Floating UI Elements */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="flex items-center gap-3 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Living Room</p>
                    <p className="text-xs text-muted-foreground">AI Generated • 4K Quality</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">Modern</Badge>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">Minimalist</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Focus Cards */}
      <section id="features" className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              <Layers3 className="w-3.5 h-3.5 mr-2" />
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Everything You Need to Design
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From floor plans to photorealistic renders, RenovAI provides all the tools 
              interior designers need to bring their vision to life.
            </p>
          </motion.div>

          <FocusCards cards={featureCards} />
        </div>
      </section>

      {/* AI Capabilities Carousel Section */}
      <section id="capabilities" className="py-24 px-6 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Badge variant="outline" className="mb-4">
              <Bot className="w-3.5 h-3.5 mr-2" />
              AI Capabilities
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Discover What AI Can Do
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore the powerful AI features that make RenovAI the ultimate tool 
              for interior designers and architects.
            </p>
          </motion.div>
        </div>
        
        <Carousel items={carouselItems} />
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">
              <Zap className="w-3.5 h-3.5 mr-2" />
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Three Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform any space from concept to photorealistic render in minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl p-8 border border-border h-full">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold font-display mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-border" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section - Prisma Hackathon */}
      <section id="tech" className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
              <Database className="w-3.5 h-3.5 mr-2" />
              Prisma Hackathon 2025
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Built with Modern Tech
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              RenovAI leverages cutting-edge technologies to deliver a seamless, 
              powerful experience for interior designers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${tech.bgColor} flex items-center justify-center shrink-0`}>
                    <tech.icon className={`w-6 h-6 ${tech.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold font-display text-lg mb-1">{tech.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tech.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Hackathon Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-accent/10 to-secondary/10 border border-border"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="relative px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <Badge className="mb-4 bg-primary text-primary-foreground">
                  🏆 Prisma Hackathon Project
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold font-display mb-4">
                  Powered by Prisma Ecosystem
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl">
                  This project was built during the Prisma Hackathon, showcasing the power of 
                  Prisma ORM and Prisma DB combined with TanStack Start, better-auth, and 
                  Vercel AI SDK for a complete full-stack AI application.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">TanStack Start</Badge>
                  <Badge variant="outline">Prisma ORM</Badge>
                  <Badge variant="outline">Prisma DB</Badge>
                  <Badge variant="outline">Better-auth</Badge>
                  <Badge variant="outline">Vercel AI SDK v6</Badge>
                  <Badge variant="outline">MCP Tools</Badge>
                </div>
              </div>
              <div className="shrink-0">
                <img 
                  src="/prisma.svg" 
                  alt="Prisma Logo" 
                  className="w-32 h-32 opacity-80"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Ready to Transform Your Design Process?
            </h2>
            <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">
              Join thousands of interior designers who are already using AI to 
              bring their creative visions to life faster than ever before.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="gap-2 text-base px-8 h-12">
                  Create Free Account <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-display">RenovAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 RenovAI. Built with ❤️ for the Prisma Hackathon.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Feature cards data for Focus Cards
const featureCards = [
  {
    title: 'Floor Plan Intelligence',
    src: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800&h=600&fit=crop',
  },
  {
    title: 'AI Photo Generation',
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop',
  },
  {
    title: '3D Walkthrough Videos',
    src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  },
  {
    title: 'Smart Measurements',
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  },
  {
    title: 'Style Presets',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  },
  {
    title: 'Multi-Project Workspace',
    src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop',
  },
]

// Steps data
const steps = [
  {
    icon: FolderOpen,
    title: 'Upload Your Plans',
    description: 'Start by uploading your floor plan as an image or PDF. Our AI analyzes the space and extracts accurate dimensions.',
  },
  {
    icon: Camera,
    title: 'Add Room Photos',
    description: 'Snap or upload photos of the rooms you want to renovate. AI maps them to your floor plan automatically.',
  },
  {
    icon: Sparkles,
    title: 'Generate Designs',
    description: 'Describe your vision and watch AI generate photorealistic renders, 3D models, and walkthrough videos.',
  },
]

// Tech stack data
const techStack = [
  {
    name: 'TanStack Start',
    description: 'Full-stack React framework with file-based routing and server functions.',
    icon: Zap,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    name: 'Prisma ORM',
    description: 'Type-safe database client for seamless data modeling and queries.',
    icon: Database,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'Prisma DB',
    description: 'Managed PostgreSQL database with automatic scaling and backups.',
    icon: Boxes,
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    name: 'Better-auth',
    description: 'Modern authentication library with OAuth, magic links, and more.',
    icon: Shield,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Vercel AI SDK v6',
    description: 'Agent mode for intelligent AI workflows and tool orchestration.',
    icon: Bot,
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    name: 'MCP Tools & Image Gen',
    description: 'Model Context Protocol for AI-powered image and 3D generation.',
    icon: Image,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
]

// Carousel card content component
function AICapabilityContent({ description }: { description: string }) {
  return (
    <div className="bg-muted/50 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
        {description}
      </p>
      <div className="mt-8">
        <Button className="gap-2">
          Learn More <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Carousel items
const carouselItems = [
  <CarouselCard
    key="floor-plan"
    index={0}
    card={{
      src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=1200&fit=crop',
      title: 'Floor Plan Analysis',
      category: 'AI Vision',
      content: (
        <AICapabilityContent description="Upload any floor plan image or PDF and our AI instantly recognizes room boundaries, doors, windows, and structural elements. Set your scale once and get accurate measurements throughout your entire project. Perfect for architects and interior designers who need precision without the tedious manual work." />
      ),
    }}
  />,
  <CarouselCard
    key="photo-gen"
    index={1}
    card={{
      src: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&h=1200&fit=crop',
      title: 'Photorealistic Renders',
      category: 'Image Generation',
      content: (
        <AICapabilityContent description="Transform your design concepts into stunning, photorealistic images. Our AI understands spatial context from your floor plan and generates renders with accurate proportions, lighting, and materials. Choose from various styles—modern, minimalist, bohemian, industrial—and see your vision come to life instantly." />
      ),
    }}
  />,
  <CarouselCard
    key="3d-model"
    index={2}
    card={{
      src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=1200&fit=crop',
      title: '3D Model Generation',
      category: '3D Modeling',
      content: (
        <AICapabilityContent description="Go beyond 2D renders with AI-generated 3D models of your designed spaces. Navigate through rooms, adjust viewpoints, and showcase designs from every angle. Export models for VR presentations or further refinement in professional 3D software." />
      ),
    }}
  />,
  <CarouselCard
    key="walkthrough"
    index={3}
    card={{
      src: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=1200&fit=crop',
      title: 'Video Walkthroughs',
      category: 'Presentation',
      content: (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-border/60">
            <img
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400&h=900&fit=crop"
              alt="Sample video walkthrough preview"
              className="w-full h-[320px] md:h-[420px] object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/25 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-white/90 shadow-xl flex items-center justify-center">
                <Play className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm uppercase tracking-wide opacity-80">Preview</p>
              <p className="text-lg font-semibold">Seamless 3D Walkthrough</p>
            </div>
          </div>
          <AICapabilityContent description="Create immersive video walkthroughs that bring your clients into the space before it's built. AI automatically generates smooth camera paths through your 3D model, adding atmospheric lighting and ambient sounds. Perfect for client presentations and social media showcases." />
        </div>
      ),
    }}
  />,
  <CarouselCard
    key="measurements"
    index={4}
    card={{
      src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1200&fit=crop',
      title: 'Smart Measurements',
      category: 'Precision Tools',
      content: (
        <AICapabilityContent description="Never guess dimensions again. Place camera views on your floor plan and RenovAI calculates exact coordinates and viewing angles. Every generated image maintains perfect scale relationships, ensuring furniture fits, sightlines work, and proportions are always accurate." />
      ),
    }}
  />,
  <CarouselCard
    key="projects"
    index={5}
    card={{
      src: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=1200&fit=crop',
      title: 'Project Management',
      category: 'Workflow',
      content: (
        <AICapabilityContent description="Organize all your design work in one place. Create unlimited projects, each with its own floor plans, room photos, and AI-generated content. Collaborate with team members, share with clients, and maintain version history of all your design iterations." />
      ),
    }}
  />,
]
