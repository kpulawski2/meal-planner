# Diagnosing planning timeouts on Render

The planner API can return HTTP 502 with `Could not calculate a budget meal plan:
Budget planning timed out`. This is an application response when the catalogue
worker's 150-second planning deadline expires. The browser keeps the saved plan
and may retry. A Render gateway error when opening the entire website needs the
service's deployment/runtime logs; it is a different symptom and this API
reproduction does not establish its cause.

On 14 October 2026 a cold 14-day, four-meal, two-person request with the real
ASDA catalogue reproduced the API timeout in a Docker container limited to
512 MiB and 0.1 CPU. The request returned 502 after approximately 150.5 seconds.
During it, 273 health checks succeeded, with a maximum latency of 398 ms, and
the container recorded no out-of-memory event. The same request completed on
the unconstrained development machine. Ordinary development tests therefore
did not expose the CPU limit.

The weekly search now retains exact ingredient costs in each parent basket and
reuses template price bindings, family increments, preference penalties and
family shape calculations. These calculations previously repeated across more
than two million candidate expansions for this example. Quantities remain
exact, prices remain integer pence, and caches stay scoped to the current search.
For periods over seven days, the weekly search retains 48 parent candidates per
stage instead of 90; shorter periods keep their existing width of 72. The longer
period still includes every requested day and uses the full daily candidate pool.
This smaller frontier can choose different meals or a different priced basket;
the bounded search does not guarantee the cheapest possible plan. Ranking
arithmetic, meal and portion rules, nutrition targets, budget checks, protected
meals and stock/leftover handling remain authoritative. There are no new services,
dependencies, environment variables or frontend assets.

Validation includes exact result comparison for the calculation-only changes,
the existing planner/lifecycle/macro and whole-app tests, and repeating the
failing HTTP request under the same container limits. Live Render logs and
deployment status are unavailable in the development
workspace; a successful local reproduction check does not verify a live rollout.

The revised cold HTTP check returned a feasible, fully priced 14-day plan in
approximately 131 seconds, within the existing 150-second worker deadline.
Every day passed its nutrition checks and the complete plan passed its budget
and variety checks. All 231 concurrent health checks succeeded, with a maximum
latency of 500 ms. Peak cgroup memory was about 267 MiB, with no out-of-memory
event. The regression suite passed 577 Node and 35 Python tests (612 total).

For a continuing error, record whether `/health` and the homepage also fail,
the failed endpoint, the response message, the deployed commit, and the matching
Render runtime/deployment logs. These distinguish an application deadline from
a failed deployment, restart or gateway failure.
