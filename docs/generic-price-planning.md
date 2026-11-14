# Plans with missing supermarket prices

Automatic planning, previews and shopping recommendations use generic planning
allowances when Asda, Lidl or Aldi has no reliable, compatible priced pack.
A missing or incomplete catalogue can also use these allowances. They are
positive estimates with assumed pack sizes, never retailer listings, live
stock claims or verified store prices. Known compatible store prices remain
preferred; opted-in saved receipt/shelf prices take precedence for their exact
ingredient and store.

The shared allowance table uses broad ingredient groups and supported quantity
dimensions. All quantities are still scaled to the planned portions and rounded
to assumed whole packs. Missing quantities and unsupported units still need
review; they are not invented or treated as free. Cancellation remains effective.

Automatic plans continue to enforce recipe readiness, dietary exclusions,
equipment, nutrition, portions, protected meals and variety. A plan using generic
allowances can be previewed and saved even if its provisional cost exceeds the
budget. The original budget is retained and the preview shows the amount over
budget. A fully priced plan still uses the existing budget rules.

Confirmed receipt and shelf prices now support all three stores. The existing
local price notebook, backup key and Lidl record identifiers remain compatible.
Records are isolated by store and dated as before; prices older than 90 days
are excluded from costing. Save a reviewed receipt with an ingredient and usable
pack size, or add a checked pack price from Shopping. Updating prices invalidates
cached basket quotes and refreshes costs without replacing meals, changing
portions, adding pantry stock or recording food/spending.

Generic allowances have no external product/source link. Both server and browser
validate their origin, expected price/pack, whole-pack arithmetic and coverage.
They never enter the published supermarket catalogue or its product counts.
