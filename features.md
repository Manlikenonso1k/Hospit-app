# Hospi Sales — Features

The accountability-first operations app for resorts, beaches, hotels and
multi-station hospitality venues. Built around one promise: **no meal order ever
gets forgotten, and everyone knows exactly whose job it is.**

White-label and multi-tenant — one app, rebranded and configured per business.
Runs on **Android and iOS**.

_This is the living marketing feature list. Updated whenever a feature ships._
_Last updated: 2026-10-09_

---

## Kill meal delays — the core

- **Server-owned countdown timers.** Every order gets a target time the moment
  it's fired. The clock lives on the server, so no one can "fix" a late order by
  changing their phone's time.
- **Traffic-light Order Board.** Managers see every order as GREEN (on time),
  AMBER (cooking, on track), or RED (overdue) at a glance.
- **Automatic overdue escalation.** The second an order runs late, the manager is
  paged automatically — no one has to be watching. "I didn't know it was late"
  is no longer possible.
- **Full order lifecycle.** Place → accept → (decline with a required reason) →
  ready → served, every step time-stamped and auditable.

## Roles, assigned by the business

- **Five roles out of the box:** Manager, Waiter, Chef, CEO, Host.
- **No self-selected roles.** Staff can't pick "Manager" and see revenue — roles
  are assigned by the business and the app opens straight to the right home
  screen for each person.
- **Sign in with email or phone** plus a password.

## For managers

- **Live Order Board** with overdue banner, at-a-glance summary (Overdue / On
  Track / Done), quick filters and a per-station view.
- **Nudge the kitchen.** One tap pages the responsible station about an overdue
  order — the chef gets a full-screen alert instantly.
- **Call or text, one tap.** Right beside Nudge, dial or SMS the assigned chef
  about an overdue order without leaving the board.
- **Expedite.** Flag an in-progress order to jump the queue.
- **Menu & prices management.** Add products, set prices, prep times and
  availability, and upload product photos — no developer needed.
- **Create staff accounts.** Add waiters, chefs (assigned to a station) and hosts
  right in the app — no back office required.
- **Manage tables.** Define the tables, cabanas, sunbeds and rooms guests order
  to; waiters pick from them.
- **Reassign any order.** Change an order's waitress or chef directly from the
  order detail — manager authority, no accept step — for breaks, no-shows or
  rebalancing a busy station.
- **Operations dashboard (Ops tab).** The same live revenue-and-accountability
  view owners get — department earnings, overdue pressure and who's delaying
  orders — so managers run the floor on the numbers, not a hunch.
- **Business setup / onboarding.** Choose which stations this business runs
  (Main Kitchen, Grill, Barbecue, Ice Cream, and more); the whole app reshapes to
  match. Perfect for selling or renting to different venues.

## For owners (CEO)

- **Operations dashboard.** A live executive view of the whole venue: total gross
  revenue for the day, week or month, orders fulfilled and average ticket size.
- **Revenue by department.** See exactly how much each station earns — revenue,
  share of the total, ticket count and average prep time — ranked biggest first.
- **Accountability — who's delaying orders.** The dashboard names the people
  behind every delay: chefs whose tickets ran late on the cook, and waitresses
  slow to pick up and serve once food was ready. No more guessing whose fault a
  late meal was.
- **Overdue pressure at a glance.** A red alert banner surfaces how many tickets
  are overdue right now and the average delay, with one tap through to triage.
- **Create manager *and* floor accounts.** Owners add managers, waiters, chefs
  and hosts directly — staffing can be delegated or kept in the owner's hands.

## For waiters

- **Take Order, redesigned.** Photo menu, fast search, category tabs, quantity
  steppers, per-item kitchen notes, and a destination (table / cabana / room).
- **Order to multiple kitchens at once.** A single cart with items from different
  stations automatically fires one ticket per kitchen, each with its own timer.
- **My Orders.** Waiters track every order they placed and its status.
- **"Order ready" alerts.** The instant a chef marks food ready, the waiter who
  placed it gets a pop-up and a flashing alert to come pick it up and serve —
  then marks it served.
- **Hand off an order.** Send an order to another waitress — she accepts or
  declines — so breaks, section swaps and busy moments never drop a ticket.

## For chefs

- **Station queue.** Each chef sees only their own kitchen's tickets.
- **New-order alerts.** The chef gets a full-screen pop-up the instant a new
  ticket lands in their station — nothing gets missed.
- **Accept / decline / ready.** Declines require a reason, captured for the record.
- **Shifts.** A chef starts a shift for their station; orders fired during that
  shift are automatically credited to them, so managers can see **which chef made
  each meal**.
- **Loud manager nudges.** When a manager nudges, the chef gets a full-screen
  "Manager Nudge" alert plus a flashing banner on the exact order.
- **Hand off a ticket.** Pass an order to another chef on the same station — they
  accept or decline.

## Alerts & notifications

- **In-app alerts that work everywhere** (no reliance on OS push to stay in the
  loop): new order, overdue, declined, nudged, ready, expedited.
- **Sound + vibration on the alerts that matter.** A new ticket, a manager nudge
  and an "order ready" don't just flash — they chime and buzz so they're noticed
  on a loud, busy floor, even with the phone in a pocket. One tap in Settings
  turns alert sounds off.
- **Push notifications** on real devices for the moments that matter.
- **Notification bell** with a live unread count on every screen.

## Platform & trust

- **Multi-tenant isolation.** Every business's data is walled off — one venue can
  never see another's orders, menu or revenue.
- **Money handled precisely** (integer minor units end-to-end — no rounding drift).
- **Duplicate-order protection.** An accidental double-tap can't create two
  tickets for the same thing — guarded on both the app and the server.
- **Live updates** without manual refresh.
- **Reuses a proven payments backend** (Paystack) for paid flows.
