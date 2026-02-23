import { getUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Receipt, Zap, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
    const user = await getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
                <p className="text-muted-foreground">
                    Manage your subscription and billing details
                </p>
            </div>

            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-gray-900">Current Plan</CardTitle>
                                <CardDescription>Your active subscription</CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">
                            Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Plan</p>
                            <p className="text-lg font-semibold text-gray-900">Free Plan</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Listings Limit</p>
                            <p className="text-lg font-semibold text-gray-900">Unlimited</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Account</p>
                            <p className="text-lg font-semibold text-gray-900 truncate">{user.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Features */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-gray-900">Plan Features</CardTitle>
                            <CardDescription>What&apos;s included in your plan</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            'Unlimited listing submissions',
                            'MLS search access',
                            'Shared curated search links',
                            'Notification alerts',
                            'Image uploads',
                            'Profile management',
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-gray-900">Billing History</CardTitle>
                            <CardDescription>Your past transactions and invoices</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No transactions yet</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm">
                            Your billing history will appear here once payment features are enabled.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
