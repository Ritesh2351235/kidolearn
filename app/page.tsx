import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";

const testimonials = [
  {
    text: "My daughter absolutely loves Kido Learn! She's learning so much while having fun. The content is perfect for her age and keeps her engaged.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=400&h=400&fit=crop&crop=face",
    name: "Sarah Johnson",
    role: "Mom of Emma, 7",
  },
  {
    text: "Finally, a platform I can trust! The safety features give me peace of mind while my son learns and explores new topics.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    name: "Michael Chen",
    role: "Dad of Alex, 5",
  },
  {
    text: "The interactive videos have helped my kids develop a real love for learning. They ask to use Kido Learn every day after school!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    name: "Lisa Martinez",
    role: "Mom of twins, age 6",
  },
  {
    text: "As a teacher and parent, I appreciate how Kido Learn combines education with entertainment. My children are learning without realizing it.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    name: "David Wilson",
    role: "Teacher & Dad",
  },
  {
    text: "The creative activities section has unlocked my daughter's artistic side. She's more confident and expressive now.",
    image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&h=400&fit=crop&crop=face",
    name: "Amanda Rodriguez",
    role: "Mom of Sofia, 8",
  },
  {
    text: "Kido Learn has made homeschooling so much easier. The structured content helps me plan lessons while keeping my kids engaged.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    name: "James Thompson",
    role: "Homeschooling Dad",
  },
  {
    text: "The quiz section is brilliant! My son loves competing with himself and seeing his progress. It's turned learning into a game.",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
    name: "Rachel Green",
    role: "Mom of Lucas, 9",
  },
  {
    text: "I was skeptical about screen time for learning, but Kido Learn has changed my perspective. The content is high-quality and educational.",
    image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
    name: "Robert Kim",
    role: "Dad of Maya, 4",
  },
  {
    text: "The customer support is exceptional. They helped us set up profiles for all three of our children with age-appropriate content.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    name: "Jennifer Adams",
    role: "Mom of 3 children",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsSection = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto">
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg text-sm text-muted-foreground">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-foreground font-serif-elegant">
            What <span className="font-light italic text-muted-foreground">Parents</span> Say
          </h2>
          <p className="text-center mt-5 opacity-75 text-muted-foreground">
            Trusted by thousands of families worldwide.
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="px-6 py-24 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-left space-y-8">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-6xl font-black text-foreground leading-tight tracking-tight">
                    Learning
                  </h1>
                  <h1 className="text-5xl lg:text-6xl font-black text-foreground leading-tight tracking-tight">
                    Made <span className="font-light italic text-muted-foreground font-serif-elegant">Fun &</span>
                  </h1>
                  <h1 className="text-5xl lg:text-6xl font-black text-foreground leading-tight tracking-tight">
                    <span className="font-serif-elegant">Engaging!</span>
                  </h1>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  Discover thousands of fun and interactive learning
                  activities to help kids grow smarter and more
                  creative.
                </p>

                <SignedOut>
                  <Button size="lg" asChild className="px-8 py-6 text-base">
                    <Link href="/sign-up">
                      Get Started
                    </Link>
                  </Button>
                </SignedOut>

                <SignedIn>
                  <Button size="lg" asChild className="px-8 py-6 text-base">
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </SignedIn>
              </div>

              {/* Right Images */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  {/* Top Row */}
                  <div className="space-y-4">
                    <div className="w-full aspect-square bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-3xl overflow-hidden">
                      <img
                        src="/images/children-playing-grass.jpg"
                        alt="Children playing"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full aspect-square bg-gradient-to-br from-red-200 to-pink-400 rounded-3xl overflow-hidden">
                      <img
                        src="/images/boy-cycling.jpeg"
                        alt="Boy cycling"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Bottom Row - Offset */}
                  <div className="space-y-4 translate-y-8">
                    <div className="w-full aspect-square bg-gradient-to-br from-blue-200 to-blue-400 rounded-3xl overflow-hidden">
                      <img
                        src="/images/1.jpeg"
                        alt="Kids learning"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full aspect-square bg-gradient-to-br from-green-200 to-green-400 rounded-3xl overflow-hidden">
                      <img
                        src="/images/2.jpeg"
                        alt="Kids playing"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight font-serif-elegant">
                What We <span className="font-light italic text-muted-foreground">Offer</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything your child needs for an amazing learning journey.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="relative pb-20">
                {/* Top Row - Two cards side by side */}
                <div className="grid grid-cols-2 gap-6 mb-4">
                  {/* Interactive Videos */}
                  <Card className="aspect-square bg-muted border-2 hover:border-foreground transition-colors">
                    <CardContent className="p-8 flex flex-col justify-center h-full">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                          Interactive
                        </CardTitle>
                        <CardDescription className="text-lg italic text-muted-foreground">
                          Videos & E-books
                        </CardDescription>
                      </CardHeader>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Engage with thousands of carefully curated educational videos, interactive e-books, and multimedia content designed to make complex topics simple and fun for young minds.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Fun Quiz */}
                  <Card className="aspect-square bg-card border-2 hover:border-foreground transition-colors">
                    <CardContent className="p-8 flex flex-col justify-center h-full">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                          Fun
                        </CardTitle>
                        <CardDescription className="text-lg italic text-muted-foreground">
                          Quiz
                        </CardDescription>
                      </CardHeader>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Challenge yourself with adaptive quizzes that adjust to your learning pace. Track progress, earn achievements, and compete with friends in a safe, encouraging environment.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Row - Two cards side by side, significantly offset down */}
                <div className="grid grid-cols-2 gap-6 transform translate-y-16">
                  {/* Creative Activities - White card */}
                  <Card className="aspect-square bg-background text-foreground border-2 hover:border-foreground transition-colors">
                    <CardContent className="p-8 flex flex-col justify-center h-full">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                          Creative
                        </CardTitle>
                        <CardDescription className="text-lg italic text-muted-foreground">
                          Activities
                        </CardDescription>
                      </CardHeader>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Unleash imagination with digital art tools, music creation, storytelling workshops, and hands-on projects that develop critical thinking and artistic expression.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Learn with Games - Match first card (muted background) */}
                  <Card className="aspect-square bg-muted text-foreground border-2 hover:border-foreground transition-colors">
                    <CardContent className="p-8 flex flex-col justify-center h-full">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                          Learn with
                        </CardTitle>
                        <CardDescription className="text-lg italic text-muted-foreground">
                          Games
                        </CardDescription>
                      </CardHeader>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        Transform learning into play with educational games covering math, science, language arts, and social studies. Progress tracking keeps parents informed of achievements.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* FAQ Section */}
        <section className="px-6 py-24 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight font-serif-elegant">
                Frequently Asked <span className="font-light italic text-muted-foreground">Questions</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about Kido Learn.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-2 hover:border-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Can I schedule content for my children on mobile?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Yes! Parents can now schedule educational content directly from the Kido Learn mobile app.
                    Use the Parent Dashboard to browse, approve, and schedule videos for specific times.
                    Your children will receive their scheduled content automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    How does the mobile scheduling work?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Simply open the mobile app, go to the Parent Dashboard, browse recommended content,
                    and tap "Schedule" on any video. Set the time and date, and the content will appear
                    in your child's feed at the scheduled time. You can also view analytics and manage
                    all scheduled content from your phone.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Is the content safe for my children?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Absolutely! All content on Kido Learn is carefully curated by education experts and
                    child safety specialists. Every video, activity, and game is age-appropriate and
                    aligned with educational standards. Parents have full control over what their children can access.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Can I track my child's learning progress?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Yes! Both the web dashboard and mobile app provide detailed analytics showing your child's
                    watch time, completion rates, favorite categories, and learning milestones. You can monitor
                    progress, identify interests, and celebrate achievements all in one place.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-foreground transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    What ages does Kido Learn support?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Kido Learn is designed for children ages 3-12, with content automatically adapted to each
                    child's age group and learning level. Our AI-powered recommendation system ensures that
                    every child receives age-appropriate, engaging, and educational content.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24 bg-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-background tracking-tight font-serif-elegant">
              Ready to Start <span className="font-light italic text-background/70">Learning?</span>
            </h2>
            <p className="text-xl leading-relaxed mb-12 max-w-2xl mx-auto text-background/80">
              Join thousands of families who are making learning fun and engaging for their children.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <SignedOut>
                <Button size="lg" variant="secondary" asChild className="px-8 py-6 text-lg">
                  <Link href="/sign-up">
                    Get Started
                  </Link>
                </Button>
              </SignedOut>

              <SignedIn>
                <Button size="lg" variant="secondary" asChild className="px-8 py-6 text-lg">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-16 bg-foreground text-background">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="text-3xl font-bold">Kido Learn</span>
            </div>
            <p className="text-background/70 leading-relaxed mb-12 max-w-2xl mx-auto">
              Making learning fun and safe for children everywhere.
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm">
              <Link href="/about" className="text-background/70 hover:text-background transition-colors">About</Link>
              <Link href="/features" className="text-background/70 hover:text-background transition-colors">Features</Link>
              <Link href="/safety" className="text-background/70 hover:text-background transition-colors">Safety</Link>
              <Link href="/contact" className="text-background/70 hover:text-background transition-colors">Contact</Link>
              <Link href="/privacy" className="text-background/70 hover:text-background transition-colors">Privacy</Link>
              <Link href="/terms" className="text-background/70 hover:text-background transition-colors">Terms</Link>
            </div>

            <Separator className="mb-8 bg-background/20" />
            <p className="text-background/70 text-sm">
              © 2024 Kido Learn. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}