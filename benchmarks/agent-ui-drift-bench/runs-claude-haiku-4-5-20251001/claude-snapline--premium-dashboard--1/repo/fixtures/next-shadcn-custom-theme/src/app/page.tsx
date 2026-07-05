import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Semantic tokens",
    description:
      "Every surface is painted with theme variables, so a single palette swap restyles the whole product.",
  },
  {
    title: "Composable primitives",
    description:
      "Cards, badges, and buttons snap together without any bespoke CSS or arbitrary values.",
  },
  {
    title: "Dark mode ready",
    description:
      "The .dark block redefines the same tokens, so components never need to know about color schemes.",
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-24">
      <section className="flex flex-col items-center gap-6 text-center">
        <Badge className="bg-brand text-brand-foreground">Now in public beta</Badge>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-foreground">
          Ship interfaces that never drift off-theme
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          A marketing fixture built entirely from shadcn-style components and a custom brand token,
          used to exercise Snapline theme checks.
        </p>
        <div className="flex items-center gap-3">
          <Button size="lg">Start free trial</Button>
          <Button size="lg" variant="outline">
            Book a demo
          </Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
