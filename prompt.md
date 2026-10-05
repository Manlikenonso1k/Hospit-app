Edit src/components/OrderTicketCard.tsx only. Do NOT edit app/(app)/kitchen.tsx
and do not run any commands.

Problem: kitchen.tsx renders <OrderTicketCard order={...} actions={<.../>} />
but the component's props no longer include `actions`, so TypeScript reports
TS2322. The chef needs its own action buttons (Accept, Decline, Mark ready) in
the card's action row.

Make these changes:
1. Add an optional prop: actions?: React.ReactNode
   (import ReactNode from 'react' if needed).
2. Make onOpenDetail and onToast optional (onOpenDetail?: (order: Order) => void,
   onToast?: (orderId: number) => void). Call them with optional chaining so the
   card works when a screen does not pass them.
3. Action row behaviour:
   - If `actions` is provided, render ONLY those actions in the action row,
     inside the same row container (padding top 4, gap 8, flex row). Render
     NOTHING of the manager buttons in that case: no Nudge, no phone or
     more_vert square button, no Mark Expedited, no View Details.
   - If `actions` is not provided, keep the current manager buttons exactly as
     they are now.
4. Green and grey completed cards keep their footer strip and show no buttons,
   whether or not `actions` is passed.
5. Do not change any colours, sizes, fonts, timer logic or the flashing "!".
   This is a props change only, so the design match stays intact.

Show me the final props type and the action-row section when done.