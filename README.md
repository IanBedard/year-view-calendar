

# year-view-calendar

A lightweight, dependency-free year-view calendar component that you can drop into any HTML page. It renders a full year (12 months) in a compact grid, supports day-level events (colored badges), and exposes a simple JS API for interaction.


![Logo](https://raw.githubusercontent.com/IanBedard/year-view-calendar/refs/heads/main/calendar-year-view.png)




## Installation

You can include the script directly in an HTML page (recommended for browser use). If you want to publish or install via npm, this repository is prepared as an npm package.

Via CDN / local script tag

```html
<script src="/path/to/script.js"></script>
```

Via npm

```bash
npm install year-view-calendar
```

Then include `script.js` in your build or import it in a bundler.

## Quick start

Add a container for the calendar to your HTML:

```html
<div class="calendar-wrapper">
  <div class="calendar"></div>
</div>
<script src="script.js"></script>
<script>
  // initialize
  const el = document.querySelector('.calendar')
  const events = {
    '2025-02-12': { color: '#111111', text: 'BD' },
    '2025-10-20': { color: '#ef4444', text: 'Today' }
  }
  window.myCalendar = new Calendar(el, {
    style: 'light',            // 'dark' or 'light'
    monthsPerRow: 3,
    startWeekOnMonday: false,
    minDate: null,            // Date instance or null
    events,
    showHeader: true,
    showArrows: true,
    showYearInput: true,
    displayYear: 2026         // initial displayed year (number)
  })
</script>
```

## Options

- style: 'dark' | 'light' — Visual theme. Defaults to 'dark'. If 'light' is chosen, the wrapper receives a `light` class and theme CSS variables change.
- monthsPerRow: number — How many months per row (grid columns). Default 3.
- startWeekOnMonday: boolean — If true, weeks start on Monday. Default false (Sunday).
- minDate: Date | null — Disable days before this date.
- events: object — Map of events keyed by `YYYY-MM-DD`, values are objects with:
  - color: string (CSS color for the badge)
  - text: string (short label shown in badge; full text shown in tooltip)
- showHeader: boolean — Show header area (year display + controls). Default true.
- showArrows: boolean — Show prev/next arrows in header. Default true.
- showYearInput: boolean — Show year numeric input in header. Default true.
- displayYear: number | null — Year to display on initialization. null = current year.

## API

Once initialized, the instance is usable via the returned object (or `window.myCalendar` if you assigned it there):

- nextYear() — Show next year
- prevYear() — Show previous year
- setYear(yearNumber) — Set and render a specific year
- addEvent(dateStr, eventObj) — Add or update an event (dateStr = 'YYYY-MM-DD')
- removeEvent(dateStr) — Remove event
- getEvent(dateStr) — Return event object or null
- events — Direct access to the internal events map (object)

Example:

```js
window.myCalendar.addEvent('2025-12-25', { color: '#0ea5a4', text: 'X' })
```


License: ISC
