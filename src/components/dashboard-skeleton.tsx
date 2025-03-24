import { Skeleton } from "@/components/skeleton"
import { Card, CardContent, CardHeader } from "@/components/card"
// In your layout.tsx or at the top of your page.tsx
import 'leaflet/dist/leaflet.css';


export function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {Array(4)
          .fill(null)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>

      <Skeleton className="h-64 w-full mb-6" />

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>

      <Skeleton className="h-96 w-full" />
    </div>
  )
}
