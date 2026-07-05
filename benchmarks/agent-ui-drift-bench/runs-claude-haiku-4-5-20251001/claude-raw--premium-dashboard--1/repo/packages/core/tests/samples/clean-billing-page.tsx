// On-system counterpart of dirty-billing-page: zero violations expected.
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="text-2xl font-bold text-foreground">Billing</h1>
      <p className="mt-3 text-muted-foreground">Manage your subscription.</p>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge>Pro</Badge>
        </CardContent>
      </Card>
      <Button className="mt-4" type="button">
        Upgrade
      </Button>
      <Input className="mt-2 max-w-md" placeholder="Coupon code" />
    </div>
  )
}
