import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClientStats() {
  const stats = [
    { title: "Total Clients", value: "1,248" },
    { title: "Active", value: "1,102" },
    { title: "VIP Clients", value: "86" },
    { title: "New This Month", value: "34" },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
