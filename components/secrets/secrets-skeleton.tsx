import { Skeleton } from '@/components/ui/skeleton'

export function SecretsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Search bar skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-10 w-full sm:w-80" />
                <Skeleton className="h-9 w-36" />
            </div>

            {/* Secret rows skeleton */}
            <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    )
}
