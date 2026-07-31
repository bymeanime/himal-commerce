'use client'

import { useState, useMemo } from 'react'
import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import { useCurrentStore } from '@/lib/use-current-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { formatNPR, NEPAL_PROVINCES, calcShippingCost, getProvince, PAYMENT_METHODS } from '@/lib/nepal'
import { Truck, Wallet, Banknote, CheckCircle2, ArrowLeft, ArrowRight, MapPin, User, CreditCard, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getReferrer, getUTM } from '@/lib/analytics-client'

type Step = 'shipping' | 'payment' | 'review' | 'success'

const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Banknote,
  wallet: Wallet,
}

export function CheckoutModal() {
  const items = useCart((s) => s.items)
  const subtotal = useCart((s) => s.subtotal())
  const clear = useCart((s) => s.clear)
  const isOpen = useUI((s) => s.checkoutOpen)
  const setOpen = useUI((s) => s.setCheckoutOpen)
  const lastOrderNumber = useUI((s) => s.lastOrderNumber)
  const setLastOrderNumber = useUI((s) => s.setLastOrderNumber)
  const { storeId, store } = useCurrentStore()

  const [step, setStep] = useState<Step>('shipping')
  const [submitting, setSubmitting] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    code: string
    type: string
    value: number
    discountAmount: number
    freeShipping: boolean
  } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    municipality: '',
    postalCode: '',
    paymentMethod: 'cod' as 'cod' | 'esewa' | 'khalti',
    notes: '',
  })
  // CUST-012 fix: terms + age-gate consent. Sent as ageConfirmation to the
  // server, which re-verifies per-product. Required to place an order.
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const shippingCost = useMemo(() => {
    if (appliedCoupon?.freeShipping) return 0
    // CUST-019 fix: pass store.freeShippingThreshold so the client-side preview
    // matches the server's calculation.
    return calcShippingCost(form.district, subtotal, store?.freeShippingThreshold ?? null)
  }, [form.district, appliedCoupon, subtotal, store])
  const discountAmount = appliedCoupon?.discountAmount ?? 0
  const total = Math.max(0, subtotal + shippingCost - discountAmount)
  const province = form.district ? getProvince(form.district) : null

  const validateCoupon = async () => {
    if (!couponCode.trim() || !storeId) return
    setValidatingCoupon(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          storeId,
          code: couponCode,
          subtotal,
        }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon(data)
        setCouponCode('')
        toast.success(`Coupon "${data.coupon.code}" applied!`)
      } else {
        setCouponError(data.error || 'Invalid coupon')
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError('Failed to validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  // CUST-011 fix: use the same Nepal mobile regex as the server.
  const phoneValid = /^9[678]\d{8}$/.test(form.phone.replace(/[\s\-()]/g, '').replace(/^\+977/, ''))
  const canProceedShipping =
    form.name.trim() &&
    phoneValid &&
    form.address.trim() &&
    form.city.trim() &&
    form.district

  const reset = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      municipality: '',
      postalCode: '',
      paymentMethod: 'cod',
      notes: '',
    })
    setAgreedToTerms(false)
    setStep('shipping')
  }

  const close = () => {
    setOpen(false)
    // If success, clear form after a beat
    if (step === 'success') {
      setTimeout(reset, 300)
    }
  }

  const placeOrder = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email || undefined,
          shippingAddress: form.address,
          shippingCity: form.city,
          shippingDistrict: form.district,
          shippingWard: form.ward || undefined,
          shippingMunicipality: form.municipality || undefined,
          shippingPostalCode: form.postalCode || undefined,
          paymentMethod: form.paymentMethod,
          notes: form.notes || undefined,
          // CUST-012 fix: send ageConfirmation so age-restricted orders don't silently fail
          ageConfirmation: agreedToTerms,
          couponCode: appliedCoupon?.code || undefined,
          // Affiliate attribution (read from himal-ref cookie) + UTM (Marketing panel)
          referrer: getReferrer() || undefined,
          utm: getUTM()?.lastTouch || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            title: i.title,
            thumbnail: i.thumbnail,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Checkout failed')
      }
      const { order } = await res.json()
      setLastOrderNumber(order.orderNumber)
      clear()
      setAppliedCoupon(null)
      setStep('success')
      toast.success('Order placed successfully!')
    } catch (e) {
      toast.error('Checkout failed', { description: (e as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  // Don't render if cart empty (except for success state where cart was just cleared)
  if (!isOpen) return null
  if (items.length === 0 && step !== 'success') return null
  if (!storeId && step !== 'success') return null

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {step === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <span>Checkout</span>
            )}
            {step !== 'success' && (
              <div className="ml-2 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                {(['shipping', 'payment', 'review'] as Step[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'h-1.5 w-8 rounded-full',
                        (['shipping', 'payment', 'review'] as Step[]).indexOf(step) >= i
                          ? 'bg-primary'
                          : 'bg-muted'
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'shipping' && 'Enter your shipping details. We deliver to all 77 districts of Nepal.'}
            {step === 'payment' && 'Choose how you would like to pay.'}
            {step === 'review' && 'Review your order before placing it.'}
            {step === 'success' && 'Your order has been placed successfully.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'shipping' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <User className="h-4 w-4" /> Contact information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Bishnu Prasad Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile number *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="98XXXXXXXX"
                  inputMode="numeric"
                  className={form.phone && !phoneValid ? 'border-destructive' : ''}
                />
                {form.phone && !phoneValid && (
                  <p className="text-xs text-destructive">Enter a valid Nepal mobile (98XXXXXXXX, 97XXXXXXXX, or 96XXXXXXXX).</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Shipping address
              </h3>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Street address *</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House number, street, tole, ward"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City / VDC *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Baneshwor"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">District *</Label>
                <Select
                  value={form.district}
                  onValueChange={(v) => setForm({ ...form, district: v })}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 overflow-y-auto nice-scroll">
                    {NEPAL_PROVINCES.map((p) => (
                      <div key={p.name}>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-popover z-10">
                          {p.name} Province
                        </div>
                        {p.districts.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CUST-010 fix: ward/municipality/postal — couriers require these for last-mile delivery */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ward">Ward</Label>
                <Input
                  id="ward"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  placeholder="e.g. 5"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="municipality">Municipality / Rural Municipality</Label>
                <Input
                  id="municipality"
                  value={form.municipality}
                  onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                  placeholder="e.g. Kirtipur"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="e.g. 44600"
                  inputMode="numeric"
                />
              </div>
            </div>

            {province && (
              <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">
                  Shipping to <strong className="text-foreground">{form.district}</strong>, {province} Province
                </span>
                <Badge variant="outline">Shipping: {formatNPR(shippingCost)}</Badge>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep('payment')}
                disabled={!canProceedShipping}
                className="h-11"
              >
                Continue to payment
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" /> Payment method
              </h3>
              <p className="text-xs text-muted-foreground">
                All prices in Nepali Rupees (NPR). Digital payments are processed instantly.
              </p>
            </div>

            <RadioGroup
              value={form.paymentMethod}
              onValueChange={(v) => setForm({ ...form, paymentMethod: v as 'cod' | 'esewa' | 'khalti' })}
              className="space-y-3"
            >
              {PAYMENT_METHODS.map((pm) => {
                const Icon = PAYMENT_ICONS[pm.icon] ?? Wallet
                // CUST-008 fix: digital payment gateways (eSewa/Khalti) are not
                // yet wired. Show them as disabled with a "Coming soon" badge
                // so customers don't select them, get a pending order, and think
                // they've paid. COD remains the only fully-functional method.
                const isDigital = pm.id === 'esewa' || pm.id === 'khalti'
                const disabled = isDigital // toggle to false once gateway is wired
                return (
                  <label
                    key={pm.id}
                    htmlFor={`pm-${pm.id}`}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border-2 p-4 transition-all',
                      disabled
                        ? 'opacity-60 cursor-not-allowed border-border bg-muted/30'
                        : 'cursor-pointer',
                      !disabled && form.paymentMethod === pm.id
                        ? 'border-primary bg-primary/5'
                        : !disabled && 'border-border hover:border-primary/40'
                    )}
                  >
                    <RadioGroupItem value={pm.id} id={`pm-${pm.id}`} className="mt-1" disabled={disabled} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{pm.name}</span>
                        <span className="text-xs text-muted-foreground">({pm.nepali})</span>
                        {pm.popular && !disabled && (
                          <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px]">
                            Popular
                          </Badge>
                        )}
                        {disabled && (
                          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50">
                            Coming soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {disabled ? 'Online gateway integration pending. Please use Cash on Delivery for now.' : pm.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>

            <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatNPR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
                  <span>-{formatNPR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Shipping {form.district && `to ${form.district}`}
                  {appliedCoupon?.freeShipping && ' (FREE)'}
                </span>
                <span>{formatNPR(shippingCost)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatNPR(total)}</span>
              </div>
            </div>

            {/* Coupon input */}
            <div className="space-y-2">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      {appliedCoupon.code}
                    </Badge>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">
                      {appliedCoupon.type === 'percent'
                        ? `${appliedCoupon.value / 100}% off`
                        : appliedCoupon.type === 'fixed'
                        ? `${formatNPR(appliedCoupon.value)} off`
                        : 'Free shipping'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={removeCoupon}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                    placeholder="Coupon code"
                    className="flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); validateCoupon() } }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={validateCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                  >
                    {validatingCoupon ? 'Checking…' : 'Apply'}
                  </Button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-destructive">{couponError}</p>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('shipping')} className="h-11">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep('review')} className="h-11">
                Review order
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ship to</p>
                <p className="text-sm font-medium">{form.name}</p>
                <p className="text-xs text-muted-foreground">{form.address}</p>
                <p className="text-xs text-muted-foreground">{form.city}, {form.district}</p>
                <p className="text-xs text-muted-foreground">{form.phone}</p>
                {form.email && <p className="text-xs text-muted-foreground">{form.email}</p>}
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setStep('shipping')}>
                  Edit
                </Button>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment</p>
                <p className="text-sm font-medium capitalize">
                  {PAYMENT_METHODS.find((p) => p.id === form.paymentMethod)?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.paymentMethod === 'cod'
                    ? 'Pay with cash when your order arrives.'
                    : 'Payment will be processed via secure gateway.'}
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setStep('payment')}>
                  Edit
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Items ({items.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto nice-scroll">
                {items.map((it) => (
                  <div key={`${it.productId}-${it.variantId ?? 'default'}`} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted">
                      {it.thumbnail && (
                        <img src={it.thumbnail} alt={it.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{it.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.variantTitle ? <>{it.variantTitle} · </> : null}Qty: {it.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatNPR(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatNPR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
                  <span>-{formatNPR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatNPR(shippingCost)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatNPR(total)}</span>
              </div>
            </div>

            {/* CUST-012 fix: terms + age-gate consent */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="agree-terms" className="text-xs leading-relaxed cursor-pointer">
                  I confirm the shipping details above are correct, I agree to the store&apos;s{' '}
                  <a href="/refund-policy" target="_blank" className="underline text-primary">refund</a> and{' '}
                  <a href="/shipping-policy" target="_blank" className="underline text-primary">shipping</a> policies,
                  and I am 18+ if this order contains age-restricted items.
                </Label>
              </div>
              {!agreedToTerms && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 pl-7">
                  <Info className="h-3 w-3" /> Please check the box to place your order.
                </p>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('payment')} className="h-11">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={placeOrder}
                disabled={submitting || !agreedToTerms}
                size="lg"
                className="h-11 px-6"
              >
                {submitting ? 'Placing order…' : `Place order · ${formatNPR(total)}`}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 text-center space-y-5">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 grid place-items-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">Dhanyabad! Order placed.</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your order has been received and is being prepared. We&apos;ll call you on
                <strong className="text-foreground"> {form.phone}</strong> to confirm before shipping.
              </p>
            </div>
            <div className="mx-auto max-w-xs rounded-xl border bg-muted/30 p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order number</span>
                <span className="font-mono font-semibold">{lastOrderNumber}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span className="capitalize">
                  {PAYMENT_METHODS.find((p) => p.id === form.paymentMethod)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ship to</span>
                <span>{form.district}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatNPR(total)}</span>
              </div>
            </div>
            <Button onClick={close} size="lg" className="h-11 px-8">
              Continue shopping
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
