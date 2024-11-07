import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterCreateLoading() {
  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  {step < 3 && <Skeleton className="h-0.5 w-12" />}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
