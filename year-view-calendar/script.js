class Calendar {
	constructor(selector, opts = {}){
		this.root = (typeof selector === 'string') ? document.querySelector(selector) : selector
		if (!this.root) throw new Error('Root element not found')

		// merge defaults
		this.opts = Object.assign({
			style: 'dark', // or 'light'
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
		this.yearInput = this.wrapper.querySelector('#yearInput')

		this.today = new Date()
		this.currentYear = (typeof this.opts.displayYear === 'number' && Number.isInteger(this.opts.displayYear)) ? this.opts.displayYear : this.today.getFullYear()

		if (this.opts.minDate instanceof Date) this.minDate = this._stripTime(this.opts.minDate)
		else this.minDate = null

		this.monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
		this.weekdayShort = this.opts.startWeekOnMonday ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

		this._bindControls()
		this._ensureTooltip()
		this.render()
	}

	_applyStyle(){
		if (!this.wrapper) return
		if (this.opts.style === 'light') this.wrapper.classList.add('light')
		else this.wrapper.classList.remove('light')
	}

	_bindControls(){
		if (this.prevBtn && this.opts.showArrows) this.prevBtn.addEventListener('click', ()=>this.prevYear())
		if (this.nextBtn && this.opts.showArrows) this.nextBtn.addEventListener('click', ()=>this.nextYear())
		if (this.yearInput && this.opts.showYearInput) this.yearInput.addEventListener('change', ()=>{ const v = parseInt(this.yearInput.value,10); if (!Number.isNaN(v)) { this.setYear(v) } })
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
			input.id = 'yearInput'
			input.type = 'number'
			input.style.width = '100px'
			input.style.textAlign = 'center'

			const next = document.createElement('button')
			next.className = 'btn'
			next.id = 'nextYear'
			next.textContent = '▶'

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
		this.root.innerHTML = ''
		if (this.yearDisplay) this.yearDisplay.textContent = String(this.currentYear)
		if (this.yearInput) this.yearInput.value = String(this.currentYear)

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

				// render event badge if present
				const ev = this.events[btn.dataset.date]
				if (ev){
					const badge = document.createElement('span')
					badge.className = 'event-badge'
					badge.style.background = ev.color || 'var(--accent)'
					badge.title = ev.text || ''
					badge.textContent = ev.text ? (ev.text.length > 2 ? ev.text.slice(0,2) : ev.text) : ''
					btn.appendChild(badge)
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
		const ev = this.events[date]
		this.tooltipEl.innerHTML = `<strong>${date}</strong>` + (ev ? `<div style="margin-top:6px;color:var(--muted)">${ev.text || ''}</div>` : '') + `<div style="margin-top:6px;color:var(--muted)">Click outside to close</div>`
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
	addEvent(dateStr, ev){ this.events[dateStr] = ev; this.render() }
	removeEvent(dateStr){ delete this.events[dateStr]; this.render() }
	getEvent(dateStr){ return this.events[dateStr] || null }
}

// export Calendar to window for manual use
window.Calendar = Calendar


