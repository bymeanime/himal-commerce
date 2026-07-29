'use client'

import { useCart } from '@/lib/cart-store'
import { useUI } from '@/lib/ui-store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatNPR } from '@/lib/nepal'
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react'

export function CartDrawer() {
  const items = useCart((s) => s.items)
  const isOpen = useCart((s) => s.isOpen)
  const close = useCart((s) => s.close)
  const setQty = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)
  const subtotal = useCart((s) => s.subtotal())
  const setCheckoutOpen = useUI((s) => s.setCheckoutOpen)

  const handleCheckout = () => {
    close()
    setCheckoutOpen(true)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your cart
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Your cart is empty.'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} ready for checkout.`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 grid place-items-center py-20">
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted grid place-items-center">
                <ShoppingCart className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No items yet — start exploring our Nepali-made goods.</p>
              <Button variant="outline" size="sm" onClick={close}>Continue shopping</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto nice-scroll space-y-3 py-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 rounded-lg border border-border/60 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                    <p className="text-sm text-primary font-semibold mt-0.5">{formatNPR(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-r-none"
                          onClick={() => setQty(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-l-none"
                          onClick={() => setQty(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatNPR(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping calculated at checkout based on destination district.
              </p>
            </div>

            <SheetFooter>
              <Button size="lg" className="w-full h-11" onClick={handleCheckout}>
                Proceed to checkout · {formatNPR(subtotal)}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
