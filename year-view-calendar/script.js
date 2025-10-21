class Calendar {
	constructor(selector, opts = {}){
		this.root = (typeof selector === 'string') ? document.querySelector(selector) : selector
		if (!this.root) throw new Error('Root element not found')

		// merge defaults
		this.opts = Object.assign({
			style: 'dark', // or 'light'
			// view can be 'year', 'month' or 'day'
			view: 'year',
			minDate: null,
			monthsPerRow: 3,
			startWeekOnMonday: false,
			// header controls
			showHeader: true,
			showArrows: true,
			showYearInput: true,
			// initial displayed year; null = current year
			displayYear: null
		}, opts)

		// events map: { 'YYYY-MM-DD': { color: '#...', text: '...' } }
		this.events = Object.assign({}, this.opts.events || {})

		// find wrapper and controls if present
		this.wrapper = this.root.closest('.calendar-wrapper') || this.root.parentElement
		if (!this.wrapper) this.wrapper = document.body
		this._applyStyle()

		// ensure header exists if requested
		if (this.opts.showHeader) this._ensureHeader()

		this.yearDisplay = this.wrapper.querySelector('.year-display')
		this.prevBtn = this.wrapper.querySelector('#prevYear')
		this.nextBtn = this.wrapper.querySelector('#nextYear')
		this.dateInput = this.wrapper.querySelector('#dateInput')

		this.today = new Date()
		this.currentYear = (typeof this.opts.displayYear === 'number' && Number.isInteger(this.opts.displayYear)) ? this.opts.displayYear : this.today.getFullYear()
		// current view: 'year' | 'month' | 'day'
		this.view = this.opts.view || 'year'
		// currentDate is used for month/day views (defaults to start of display year or today)
		if (typeof this.opts.displayYear === 'number') this.currentDate = new Date(this.opts.displayYear, 0, 1)
		else this.currentDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate())

		if (this.opts.minDate instanceof Date) this.minDate = this._stripTime(this.opts.minDate)
		else this.minDate = null

		this.monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
		this.weekdayShort = this.opts.startWeekOnMonday ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

		this._bindControls()
		this._ensureTooltip()
		// allow first render to skip animation
		this._firstRender = true
		this.render()
	}

	_applyStyle(){
		if (!this.wrapper) return
		if (this.opts.style === 'light') this.wrapper.classList.add('light')
		else this.wrapper.classList.remove('light')
	}

	_bindControls(){
		// navigation controls behave according to current view (year/month/day)
		if (this.prevBtn && this.opts.showArrows) this.prevBtn.addEventListener('click', ()=>this.prev())
		if (this.nextBtn && this.opts.showArrows) this.nextBtn.addEventListener('click', ()=>this.next())

		if (this.dateInput && this.opts.showYearInput) this.dateInput.addEventListener('change', ()=>{
			const v = this.dateInput.value // expected YYYY-MM-DD
			if (!v) return
			const parts = v.split('-').map(n=>parseInt(n,10))
			if (parts.length !== 3) return
			const d = new Date(parts[0], parts[1]-1, parts[2])
			// switch to focused day view for selected date
			this.currentDate = d
			this.view = 'day'
			// ensure header view selector reflects the new view
			if (this.viewSelect) this.viewSelect.value = 'day'
			this.render()
		})

		// view selector in header (if present)
		this.viewSelect = this.wrapper.querySelector('#viewSelect')
		if (this.viewSelect){
			this.viewSelect.value = this.view
			this.viewSelect.addEventListener('change', ()=>{
				this.view = this.viewSelect.value
				// ensure currentDate makes sense when switching
				if (this.view === 'month') this.currentDate = this.currentDate || new Date(this.currentYear, 0, 1)
				if (this.view === 'day') this.currentDate = this.currentDate || new Date()
				this.render()
			})
		}
	}

	// navigate previous step depending on view
	prev(){
		if (this.view === 'month'){
			const cd = this.currentDate || new Date(this.currentYear,0,1)
			this.currentDate = new Date(cd.getFullYear(), cd.getMonth() - 1, 1)
			this.render()
		}else if (this.view === 'day'){
			const cd = this.currentDate || new Date()
			this.currentDate = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate() - 1)
			this.render()
		}else{
			this.currentYear--
			if (this.currentDate) this.currentDate.setFullYear(this.currentYear)
			this.render()
		}
	}

	// navigate next step depending on view
	next(){
		if (this.view === 'month'){
			const cd = this.currentDate || new Date(this.currentYear,0,1)
			this.currentDate = new Date(cd.getFullYear(), cd.getMonth() + 1, 1)
			this.render()
		}else if (this.view === 'day'){
			const cd = this.currentDate || new Date()
			this.currentDate = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate() + 1)
			this.render()
		}else{
			this.currentYear++
			if (this.currentDate) this.currentDate.setFullYear(this.currentYear)
			this.render()
		}
	}

	// helper to animate transitions between views
	_transitionRender(fn){
		const dur = 180
		// first-render should not animate
		if (!this._firstRender){
			this.root.style.transition = `opacity ${dur}ms ease`
			this.root.style.opacity = '0'
			setTimeout(()=>{
				fn.call(this)
				this.root.style.opacity = '1'
			}, dur)
		}else{
			// direct render on first pass
			this._firstRender = false
			fn.call(this)
		}
	}

	_ensureHeader(){
		// if wrapper already contains header, skip
		let header = this.wrapper.querySelector('.calendar-header')
		if (!header){
			header = document.createElement('div')
			header.className = 'calendar-header'
			const left = document.createElement('div')
			left.className = 'year-display'
			left.textContent = 'Year'
			const controls = document.createElement('div')
			controls.className = 'controls'

			const prev = document.createElement('button')
			prev.className = 'btn'
			prev.id = 'prevYear'
			prev.textContent = '◀'

			const input = document.createElement('input')
			input.className = 'btn'
			input.id = 'dateInput'
			input.type = 'date'
			input.style.width = '160px'
			input.style.textAlign = 'center'

			const next = document.createElement('button')
			next.className = 'btn'
			next.id = 'nextYear'
			next.textContent = '▶'

			// add view selector inside header controls
			const viewSelect = document.createElement('select')
			viewSelect.id = 'viewSelect'
			viewSelect.className = 'btn'
			viewSelect.innerHTML = `<option value="year">Year</option><option value="month">Month</option><option value="day">Day</option>`
			if (this.opts.view) viewSelect.value = this.opts.view
			controls.appendChild(viewSelect)

			if (this.opts.showArrows) controls.appendChild(prev)
			if (this.opts.showYearInput) controls.appendChild(input)
			if (this.opts.showArrows) controls.appendChild(next)

			header.appendChild(left)
			header.appendChild(controls)

			// insert header before root
			this.wrapper.insertBefore(header, this.root)
		}
	}

	_stripTime(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }

		render(){
			// use transition helper so switching views animates
			this._transitionRender(function(){
				switch(this.view){
					case 'month': this.renderMonth(); break
					case 'day': this.renderDay(); break
					default: this.renderYear(); break
				}
			})
		}

		renderYear(){
		this.root.innerHTML = ''
		if (this.yearDisplay) this.yearDisplay.textContent = String(this.currentYear)
		if (this.yearInput) this.yearInput.value = String(this.currentYear)
		if (this.dateInput) this.dateInput.value = this._formatDate(new Date(this.currentYear, 0, 1))

		const grid = document.createElement('div')
		grid.className = 'year-grid'
		grid.style.gridTemplateColumns = `repeat(${this.opts.monthsPerRow}, 1fr)`

		for (let m = 0; m < 12; m++){
			const monthCard = document.createElement('div')
			monthCard.className = 'month'

			const title = document.createElement('div')
			title.className = 'month-title'
			const h = document.createElement('h3')
			h.textContent = this.monthNames[m]
			const small = document.createElement('small')
			small.className = 'muted'
			small.textContent = `${this.currentYear}`
			title.appendChild(h)
			title.appendChild(small)

			const weekdays = document.createElement('div')
			weekdays.className = 'weekdays'
			this.weekdayShort.forEach(w => {
				const el = document.createElement('div')
				el.textContent = w
				weekdays.appendChild(el)
			})

			const days = document.createElement('div')
			days.className = 'days'

			// compute first day offset according to week start
			let first = new Date(this.currentYear, m, 1)
			let offset = first.getDay() // 0..6
			if (this.opts.startWeekOnMonday) offset = (offset + 6) % 7 // shift

			const daysInMonth = new Date(this.currentYear, m + 1, 0).getDate()

			for (let i = 0; i < offset; i++){
				const empty = document.createElement('div')
				empty.className = 'day'
				empty.setAttribute('aria-disabled','true')
				days.appendChild(empty)
			}

			for (let d = 1; d <= daysInMonth; d++){
				const btn = document.createElement('button')
				btn.className = 'day'
				btn.type = 'button'
				btn.textContent = String(d)
				btn.dataset.date = `${this.currentYear}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

				const isToday = (this.currentYear === this.today.getFullYear() && m === this.today.getMonth() && d === this.today.getDate())
				if (isToday) btn.classList.add('today')

				// disable if before minDate
				if (this.minDate) {
					const cur = new Date(this.currentYear, m, d)
					if (cur < this.minDate) { btn.setAttribute('aria-disabled','true'); btn.disabled = true }
				}

				btn.addEventListener('click', (e)=>this._onDayClick(e, btn))
				btn.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' ') this._onDayClick(e, btn) })

				// render events as background color(s) if present
				const evRaw = this.events[btn.dataset.date]
				let evs = []
				if (evRaw) {
					if (Array.isArray(evRaw)) evs = evRaw.slice()
					else evs = [evRaw]
				}
				if (evs.length > 0){
					// set title to concatenated event texts
					btn.title = evs.map(e => e && e.text ? e.text : '').filter(Boolean).join(' | ') || btn.title

					if (evs.length === 1){
						btn.style.background = evs[0].color || 'var(--accent)'
						btn.style.color = evs[0].color ? this._contrastColor(evs[0].color) : ''
					}else{
						const slice = 100 / evs.length
						const parts = evs.map((e,i) => {
							const start = Math.round(i * slice)
							const end = Math.round((i + 1) * slice)
							return `${e.color || 'var(--accent)'} ${start}% ${end}%`
						})
						btn.style.background = `linear-gradient(90deg, ${parts.join(', ')})`
						btn.style.color = ''
					}
				}else{
					// clear any inline background if no events
					btn.title = ''
					btn.style.background = ''
					btn.style.color = ''
				}

				days.appendChild(btn)
			}

			monthCard.appendChild(title)
			monthCard.appendChild(weekdays)
			monthCard.appendChild(days)
			grid.appendChild(monthCard)
		}

		this.root.appendChild(grid)
		}

		renderMonth(){
			// render a single month based on this.currentDate
			this.root.innerHTML = ''
			const y = this.currentDate.getFullYear()
			const m = this.currentDate.getMonth()
			if (this.yearDisplay) this.yearDisplay.textContent = `${this.monthNames[m]} ${y}`
			if (this.dateInput) this.dateInput.value = this._formatDate(new Date(y, m, 1))

			const monthCard = document.createElement('div')
			monthCard.className = 'month single-month'

			const title = document.createElement('div')
			title.className = 'month-title'
			const h = document.createElement('h3')
			h.textContent = this.monthNames[m]
			const small = document.createElement('small')
			small.className = 'muted'
			small.textContent = `${y}`
			title.appendChild(h)
			title.appendChild(small)

			const weekdays = document.createElement('div')
			weekdays.className = 'weekdays'
			this.weekdayShort.forEach(w => {
				const el = document.createElement('div')
				el.textContent = w
				weekdays.appendChild(el)
			})

			const days = document.createElement('div')
			days.className = 'days'

			let first = new Date(y, m, 1)
			let offset = first.getDay()
			if (this.opts.startWeekOnMonday) offset = (offset + 6) % 7
			const daysInMonth = new Date(y, m + 1, 0).getDate()

			for (let i = 0; i < offset; i++){
				const empty = document.createElement('div')
				empty.className = 'day'
				empty.setAttribute('aria-disabled','true')
				days.appendChild(empty)
			}

			for (let d = 1; d <= daysInMonth; d++){
				const btn = document.createElement('button')
				btn.className = 'day'
				btn.type = 'button'
				btn.textContent = String(d)
				btn.dataset.date = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

				const isToday = (y === this.today.getFullYear() && m === this.today.getMonth() && d === this.today.getDate())
				if (isToday) btn.classList.add('today')

				if (this.minDate) {
					const cur = new Date(y, m, d)
					if (cur < this.minDate) { btn.setAttribute('aria-disabled','true'); btn.disabled = true }
				}

				btn.addEventListener('click', (e)=>{
					// in month view, clicking a day shows the same tooltip as year view
					this._onDayClick(e, btn)
					// if user holds Shift while clicking, switch to full day view
					if (e.shiftKey){
						this.currentDate = new Date(y, m, d)
						this.view = 'day'
						this.render()
					}
				})
				btn.addEventListener('keydown', (e)=>{
					if (e.key === 'Enter' || e.key === ' '){
						e.preventDefault()
						this._onDayClick(e, btn)
						if (e.shiftKey){
							this.currentDate = new Date(y, m, d)
							this.view = 'day'
							this.render()
						}
					}
				})

				// render events for the date
				const evRaw = this.events[btn.dataset.date]
				let evs = []
				if (evRaw) {
					if (Array.isArray(evRaw)) evs = evRaw.slice()
					else evs = [evRaw]
				}
				if (evs.length > 0){
					btn.title = evs.map(e => e && e.text ? e.text : '').filter(Boolean).join(' | ') || btn.title
					if (evs.length === 1){
						btn.style.background = evs[0].color || 'var(--accent)'
						btn.style.color = evs[0].color ? this._contrastColor(evs[0].color) : ''
					}else{
						const slice = 100 / evs.length
						const parts = evs.map((e,i) => {
							const start = Math.round(i * slice)
							const end = Math.round((i + 1) * slice)
							return `${e.color || 'var(--accent)'} ${start}% ${end}%`
						})
						btn.style.background = `linear-gradient(90deg, ${parts.join(', ')})`
						btn.style.color = ''
					}
				}

				days.appendChild(btn)
			}

			monthCard.appendChild(title)
			monthCard.appendChild(weekdays)
			monthCard.appendChild(days)
			this.root.appendChild(monthCard)
		}

		renderDay(){
			// render a focused day view listing events and a back-to-month/year control
			this.root.innerHTML = ''
			const y = this.currentDate.getFullYear()
			const m = this.currentDate.getMonth()
			const d = this.currentDate.getDate()
			if (this.yearDisplay) this.yearDisplay.textContent = `${this.monthNames[m]} ${d}, ${y}`
			if (this.dateInput) this.dateInput.value = this._formatDate(this.currentDate)

			const panel = document.createElement('div')
			panel.className = 'day-panel'
			// header already displays the focused date; avoid duplicating it inside the panel

			const dateKey = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
			const evRaw = this.events[dateKey]
			if (!evRaw || (Array.isArray(evRaw) && evRaw.length === 0)){
				const p = document.createElement('p')
				p.className = 'muted'
				p.textContent = 'No events for this date.'
				panel.appendChild(p)
			}else{
				const list = document.createElement('div')
				list.className = 'event-list'
				const arr = Array.isArray(evRaw) ? evRaw : [evRaw]
				arr.forEach((ev, i) => {
					const it = document.createElement('div')
					it.className = 'event-item'
					it.textContent = (ev && ev.text) ? ev.text : `Event ${i+1}`
					it.style.background = ev && ev.color ? ev.color : ''
					it.style.color = ev && ev.color ? this._contrastColor(ev.color) : ''
					panel.appendChild(it)
				})
			}

			this.root.appendChild(panel)
		}

	_ensureTooltip(){
		if (!this.tooltipEl){
			this.tooltipEl = document.createElement('div')
			this.tooltipEl.className = 'date-tooltip'
			this.tooltipEl.style.display = 'none'
			document.body.appendChild(this.tooltipEl)
		}
	}

	_onDayClick(e, btn){
		this._ensureTooltip()
		if (btn.disabled) return
		const date = btn.dataset.date
		const evRaw = this.events[date]
		let evs = []
		if (evRaw) evs = Array.isArray(evRaw) ? evRaw.slice() : [evRaw]
		let html = `<strong>${date}</strong>`
		if (evs.length > 0){
			html += `<div style="margin-top:8px">`
			evs.forEach(ev => {
				const color = ev && ev.color ? ev.color : 'transparent'
				const text = ev && ev.text ? ev.text : ''
				html += `<div style="display:flex;align-items:center;gap:8px;margin-top:6px">
					<span style="width:12px;height:12px;display:inline-block;border-radius:2px;background:${color};border:1px solid rgba(0,0,0,0.08)"></span>
					<span style="color:var(--muted)">${text}</span>
				</div>`
			})
			html += `</div>`
		}else{
			html += `<div style="margin-top:6px;color:var(--muted)">No events for this date.</div>`
		}
		html += `<div style="margin-top:8px;color:var(--muted)">Click outside to close</div>`
		this.tooltipEl.innerHTML = html
		this.tooltipEl.style.display = 'block'

		// position near the click (prefer pointer coordinates so it appears where user clicked)
		const rect = btn.getBoundingClientRect()
		const tooltipW = this.tooltipEl.offsetWidth || 200
		const tooltipH = this.tooltipEl.offsetHeight || 60
		// prefer using pointer coordinates if available
		const px = (e && typeof e.clientX === 'number') ? e.clientX : (rect.left + rect.width/2)
		const py = (e && typeof e.clientY === 'number') ? e.clientY : (rect.top + rect.height/2)

		let left = Math.round(px - tooltipW / 2)
		// clamp horizontally
		left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8))

		// try to place above the click, otherwise below
		let top = Math.round(py - tooltipH - 12)
		if (top < 8) top = Math.round(py + 12)

		this.tooltipEl.style.left = left + 'px'
		this.tooltipEl.style.top = top + 'px'

		const outside = (ev)=>{ if (!this.tooltipEl.contains(ev.target) && ev.target !== btn){ this.tooltipEl.style.display = 'none'; document.removeEventListener('click', outside) } }
		setTimeout(()=>document.addEventListener('click', outside), 0)
	}

	nextYear(){ this.currentYear++; this.render() }
	prevYear(){ this.currentYear--; this.render() }
	setYear(y){ this.currentYear = y; this.render() }

	// event helpers
	addEvent(dateStr, ev){
		// allow multiple events per date (store as array)
		if (!this.events[dateStr]) this.events[dateStr] = []
		if (!Array.isArray(this.events[dateStr])) this.events[dateStr] = [this.events[dateStr]]
		this.events[dateStr].push(ev)
		this.render()
	}

	removeEvent(dateStr, index = null){
		if (!this.events[dateStr]) return
		if (index === null){
			delete this.events[dateStr]
		}else{
			if (Array.isArray(this.events[dateStr])){
				this.events[dateStr].splice(index, 1)
				if (this.events[dateStr].length === 0) delete this.events[dateStr]
			}
		}
		this.render()
	}

	getEvent(dateStr){ return this.events[dateStr] || null }

	_formatDate(dt){
		if (!(dt instanceof Date)) return ''
		const y = dt.getFullYear()
		const m = String(dt.getMonth() + 1).padStart(2,'0')
		const d = String(dt.getDate()).padStart(2,'0')
		return `${y}-${m}-${d}`
	}

	_contrastColor(hex){
		// simple luminance check; accepts #rgb or #rrggbb
		if (!hex) return ''
		let h = hex.replace('#','')
		if (h.length === 3) h = h.split('').map(c=>c+c).join('')
		const r = parseInt(h.substr(0,2),16)
		const g = parseInt(h.substr(2,2),16)
		const b = parseInt(h.substr(4,2),16)
		const lum = (0.2126*r + 0.7152*g + 0.0722*b)/255
		return lum > 0.6 ? '#0b1220' : '#ffffff'
	}
}

// export Calendar to window for manual use
window.Calendar = Calendar

// Optional auto-initialize: if a `.calendar` element exists, create an instance automatically.
// You can override defaults by setting `window.__YEAR_VIEW_CALENDAR_OPTS = { autoInit: false, ... }` before this script runs.
try {
	document.addEventListener('DOMContentLoaded', () => {
		const globalOpts = (window.__YEAR_VIEW_CALENDAR_OPTS && typeof window.__YEAR_VIEW_CALENDAR_OPTS === 'object') ? window.__YEAR_VIEW_CALENDAR_OPTS : {}
		if (globalOpts.autoInit === false) return
		const el = document.querySelector('.calendar')
		if (!el) return
		if (el.__calendarInstance) return

			const opts = Object.assign({
			style: 'light',
			minDate: null,
			monthsPerRow: 3,
			startWeekOnMonday: false,
				events: globalOpts.events || {},
			showHeader: true,
			showArrows: true,
			showYearInput: true,
			displayYear: (new Date()).getFullYear()
		}, globalOpts)

		el.__calendarInstance = new Calendar(el, opts)
		window.myCalendar = el.__calendarInstance

		// demo controls are not created automatically here anymore.
		// If a page wants demo controls, it should include them in the HTML and attach listeners to `window.myCalendar`.
	})
} catch (err) {
	console.error('Auto-init error in year-view-calendar:', err)
}


