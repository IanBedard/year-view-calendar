

# year-view-calendar

A lightweight, dependency-free year/month/day calendar component you can drop into any HTML page. It started as a year-view grid and now supports three views:

- Year view — compact 12-month grid
- Month view — single-month calendar with interactive day buttons
- Day view — focused list of events for a single date

The component is zero-dependency and exposes a small, friendly JS API.

![Logo](https://github.com/IanBedard/year-view-calendar/blob/main/october.png?raw=true)

## Installation

Include the script directly or install via npm.

Via script tag

```html
<script src="/path/to/script.js"></script>
```

Via npm

```bash
npm install year-view-calendar
```

## Quick start

Add the container and initialize the calendar. The header includes a view selector (Year / Month / Day) and a date picker (type="date") — picking a date jumps straight to Day view.
![Logo](https://github.com/IanBedard/year-view-calendar/blob/main/Screenshot%202025-10-21%20101602.png?raw=true)
```html
<div class="calendar-wrapper">
  <div class="calendar"></div>
</div>
<script src="script.js"></script>
<script>
  const el = document.querySelector('.calendar')

  // you can provide multiple events per date using an array
  const events = {
    '2025-02-12': [
      { color: '#159715', text: 'BD' },
      { color: '#0ea5a4', text: 'Dinner' }
    ],
    '2025-10-20': [
      { color: '#ef4444', text: 'Ev A' },
      { color: '#ef8a4a', text: 'Ev B' },
      { color: '#ef7654', text: 'Ev C' }
    ]
  }

  window.myCalendar = new Calendar(el, {
    style: 'light',          // 'dark' or 'light'
    monthsPerRow: 3,
    startWeekOnMonday: false,
    minDate: null,
    events,
    showHeader: true,       // header includes view selector and date picker
    showArrows: true,
    showYearInput: true,    // shows the date picker control (replaces numeric year input)
    displayYear: 2025
  })
</script>
```

## Views and controls

- View selector: the header contains a `select` allowing users to switch between Year / Month / Day views. Programmatic changes to `myCalendar.view` are also supported (set and call `render()`).
- Date picker: the header date input is a native `type="date"` control. Choosing a date will automatically:
  - set the calendar to Day view for the selected date
  - update the header view selector to `Day`
- Month view clicks: clicking a day in Month view opens the same tooltip/popover used in Year view to inspect events; hold Shift while clicking (or press Shift+Enter) to switch into the focused Day view.
- Transitions: switching views uses a short fade animation for a smoother UI.

## Events

- The `events` option accepts a map keyed by `YYYY-MM-DD`. Each value may be:
  - a single event object: `{ color: '#...', text: '...' }`
  - or an array of event objects to represent multiple events on the same date. The calendar renders them as equal-width background slices on the day cell and the tooltip lists them with small color swatches.

Example event value with multiple events for one date:

```js
events['2025-10-20'] = [
  { color: '#ef4444', text: 'Ev A' },
  { color: '#ef8a4a', text: 'Ev B' }
]
```

## API

The instance exposes a small API. Common usage is via the instance returned from `new Calendar(...)` or the global `window.myCalendar` used in the examples.

- addEvent(dateStr, eventObj) — Add an event to a date. If a date already has events the new event is appended (supports multiple events).
- removeEvent(dateStr, index = null) — Remove events. If `index` is omitted (or null) the entire date key is removed; otherwise remove the event at the given index when multiple events exist.
- getEvent(dateStr) — Return the stored event(s) for a date or null.
- events — Direct access to the internal events map object.

Navigation / view control

- prev() / next() — Context-aware navigation. What they do depends on the current view:
  - Year view: move to previous/next year
  - Month view: move to previous/next month
  - Day view: move to previous/next day
- setYear(y) — Set the displayed year (keeps behavior for backwards compatibility)
- You can switch views programmatically and then render:

```js
myCalendar.view = 'month'
myCalendar.render()
```

## Tooltip / popover

- Clicking a day (in Year or Month view) opens a small tooltip listing events for that date. Each event shows a color swatch and the event text. The tooltip includes a hint to click outside to close.

## Examples

Add three events to a date programmatically:

```js
myCalendar.addEvent('2025-10-20', { color: '#ef4444', text: 'Ev A' })
myCalendar.addEvent('2025-10-20', { color: '#ef8a4a', text: 'Ev B' })
myCalendar.addEvent('2025-10-20', { color: '#ef7654', text: 'Ev C' })
```

Change view from code:

```js
// month view
myCalendar.view = 'month'
myCalendar.render()

// day view for a specific date
myCalendar.currentDate = new Date(2025,9,20) // October 20, 2025
myCalendar.view = 'day'
myCalendar.render()
```

## Notes & tips

- The header select and date picker are visible when `showHeader` is true. The `showYearInput` option controls whether the date-picker input is displayed (it replaced the older numeric input).
- If you want to persist events client-side, you can serialize `myCalendar.events` to localStorage and rehydrate on page load.

## License

ISC
