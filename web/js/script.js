/** IMPORTANT! Gebruik deze global variable(s) enkel tijdens testen en ontwikkelen! */
let lastScrollY;

const callMixcloud = () => {
	const request = new Request('https://api.mixcloud.com/urgentfm/cloudcasts/?limit=15');
	getData(request, populateEditorsPick, printErrorMessage);
};

const pageRequest = (getUrl) => {

	let url;
	if (getUrl === null) {
		url = getURL();
	} else {
		url = getUrl;
	}

	const request = new Request(url, {
		headers: new Headers({
			'X-Requested-With': 'XMLHttpRequest'
		})
	});

	getData(request, pageUpdate, printErrorMessage);
};

const getData = (request, succeed, fail) => {
	fetch(request)
		.then(response => handleErrors(response))
		.then(text => parseData(text))
		.then(data => succeed(data))
		.catch(error => fail(error));
}

const handleErrors = (response) => {
	let text;
	if (!response.ok) {
		throw (response.status + ': ' + response.statusText);
	}
	const contentType = response.headers.get('content-type');
	if (!contentType) {
		throw new TypeError('No content provided: ' + contentType);
	}

	if (contentType === 'application/json') {
		text = response.json();
	} else {
		text = response.text();
	}


	return text;
};

const parseData = (text) => {
	let data;
	try {
		data = JSON.parse(text);
		return data;
	}
	catch {
		return data = text;
	}
};

const printErrorMessage = (error) => {
	console.log(error);
};


const pageUpdate = (responseText) => {

	if (responseText !== null) {
		let parentNode = document.querySelector('.content');
		const parser = new DOMParser();
		const doc = parser.parseFromString(responseText, 'text/html');
		const newChildNodes = doc.body.childNodes;
		clearParentNode(parentNode);

		newChildNodes.forEach(n => parentNode.appendChild(n));
		const url = getURL();
		// set title
		let title = 'Urgent.fm 105.3';
		// if (url !== '/') {
		// 	let pageTitle = document.querySelector('h1 span').innerHTML;
		// 	title = pageTitle + ' | Urgent.fm 105.3';
		// }
		document.title = title; // TODO titel mag een beetje mooier gepresenteerd worden!
		router(url);
	}
};

/* Route to right endpoints for setting up functionallity */
const router = (url) => {
	// Ignore an incidental slash at ending of url but exclude pathname-url for homepage ('/').
	if (url.endsWith('/') && url.length > 1) {
		url = url.slice(0, url.length - 1);
	}
	// Route the destination url to the right set of webpage-related functions
	if (url === '/') {
		setAnchors();
		callMixcloud();
		swiffyslider.init(rootElement = document.body);
		// setDisplay();
	} else if (url === '/programma') {
		setAnchors();
		populateProgramSchema();
		setDisplay();
	} else if (url === '/nieuws' || url.includes('/nieuws?page')) {
		setAnchors();
		let filters;
		if (!history.state.filters) {
			// filters = initFilter();
		} else {
			filters = history.state.filters;
			let cbFilters = document.querySelectorAll('.cbFilter');
			cbFilters[0].addEventListener('change', checkDefaultfilter);
			cbFilters[0].checked = filters[0];
			for (let i = 1; i < cbFilters.length; i++) {
				cbFilters[i].addEventListener('change', checkFilter);
				cbFilters[i].checked = filters[i];
			}
		}
	
		let scrollY = history.state.scrollY;
		let url = location.pathname + location.search;
		history.replaceState({ scrollY: scrollY, filters: null }, '', url);
		setDisplay();
	} else if (url.startsWith('/programma') && url.includes('?page=')) { 
		console.log('gelukt')
	} else if (url === '/zoek/resultaten' || url.includes('/zoek/resultaten?page') || url === '/zoek' || url.includes('/zoek')) {
		closeSearch();
		setAnchors();
		let filters;
		if (!history.state.filters) {
			filters = initFilter();
		} else {
			filters = history.state.filters;
			let cbFilters = document.querySelectorAll('.cbFilter');
			cbFilters[0].addEventListener('change', checkDefaultfilter);
			cbFilters[0].checked = filters[0];
			for (let i = 1; i < cbFilters.length; i++) {
				cbFilters[i].addEventListener('change', checkFilter);
				cbFilters[i].checked = filters[i];
			}
		}

		history.replaceState({ scrollY: scrollY, filters: filters }, '', location.pathname + location.search)
		setDisplay();
	} else {
		setAnchors();
		setDisplay();
	}
};

// Navigate to new page when clicking on anchor link
const navigate = (e) => {
	e.preventDefault();
	// TODO verander fixed url (http. ... ) naar '/zoek' (hoe???)
	if ((e.currentTarget).href === 'http://localhost/zoek'
	) {
		return;
	}
	// first check for pagination
	let filters = null;

	if (history.state.filters !== null) {
		filters = history.state.filters;
	}

	let goToLocation = location.pathname + location.search;
	// if (((e.currentTarget).href.includes('/programma') && )
	history.replaceState({ scrollY: window.scrollY, filters: filters }, '', goToLocation);

	let nextUrl = null;

	// let forms = document.querySelectorAll('.formZoek');
	if ((e.currentTarget).classList.contains('btnZoek')) {
		let form;
		if ((e.currentTarget).classList.contains('btnZoek')) {
			let formAction;
			let q;
			let filterQ = '';
			let cbFilters = null;
			if (history.state.filters) {
				filters = history.state.filters;
				filters[0] = true;
				for (let i = 1; i < filters.length; i++) {
					filters[i] = false;
				}
			}
			form = (e.currentTarget).form;
			cbFilters = form.querySelectorAll('.cbFilter');
			
			formAction = `${form.action}?q=`;
			q = form[0].value;

			nextUrl = formAction + q + filterQ;
		} else {
			let forms = document.querySelectorAll('form');
			forms.forEach(thisForm => {
				console.log(thisForm.length);
				if (thisForm.length > 2) {
					form = thisForm;
				}
			});
			nextUrl = (e.currentTarget).href;
		}
		lastScrollY = window.scrollY;
		history.pushState({ scrollY: window.scrollY, filters: filters }, '', nextUrl);
		pageRequest(nextUrl);


	} else {
		let forms = document.querySelectorAll('.formZoek');
		forms.forEach(form => {
			form.value = '';
		})
		let href = (e.currentTarget).getAttribute('href');
		if (href !== getURL()) {
			nextUrl = href;

			let scrollY = 0;
			// Indien focus moet behouden worden op scrollpositie bij pagineren, zie of het a-element de pagination-focus klasnaam bezit:
			if (e.currentTarget.classList.contains('pagination-focus')){
				scrollY = window.scrollY;
			}
			history.pushState({ scrollY: scrollY, filters: null }, '', nextUrl);

			pageRequest(nextUrl);
		}
	}
};


/* Helper functions */
const clearParentNode = (parentNode) => {
	while (parentNode.lastChild) {
		// of lastchild.remove() gebruiken?
		parentNode.removeChild(parentNode.lastChild);
	}
};

// Set display on initial or last position
const setDisplay = () => {
	let scrollBackTo = history.state.scrollY;
	window.scroll(0, scrollBackTo);
};

const getURL = () => {
	return location.pathname.toLowerCase();
};

// Set internal anchorlinks.
const setAnchors = () => {
	// TODO: efficientere toepassing vinden (bv. pas bij click op juise anchor actie ondernemen, ipv telkens ankers te moeten toewijzen)
	let anchors = document.querySelectorAll('a:not(#yii-debug-toolbar a, .social-media-link, a[href^=\'mailto:\'], .mixcloud-link), .btnZoek'); // DEV: not statement enkel in DEV mode!

	anchors.forEach(a => a.addEventListener('click', navigate));
};

// Livestream player controls
const switchState = () => {
	if (liveAudio.stopped === true) {
		liveAudio.load();
		liveAudio.play();
		audioControl.textContent = "play";
	} else {
		liveAudio.stop();
	}
};

// Search overlay controls
const openSearch = (e) => {
	e.preventDefault();
	let modal = document.querySelector('.modal-search');
	let overlay = document.querySelector('.overlay');
	modal.style.display = 'block';
	overlay.style.display = 'block';
	let body = document.querySelector('body');
	body.style.overflow = 'hidden';
};

const closeSearch = (e) => {
	let overlay = document.querySelector('.overlay');
	let searchbar = document.querySelector('.modal-search');
	let btnClose = document.querySelector('.close');
		let body = document.querySelector('body');
		body.style.overflow = 'auto';
	overlay.style.display = 'none';
	searchbar.style.display = 'none';
};

// Initialize filters when loading paginated pages for the first time, set eventlisteners and return checkbox values
const initFilter = () => {
	let cbFilters = document.querySelectorAll('.cbFilter');
	let cbDefaultfilter = document.querySelector('.cbDefaultfilter');
	let filters = [];
	// Set defaultfilter and add eventlistener
	cbDefaultfilter.checked = true;
	cbDefaultfilter.addEventListener('change', checkDefaultfilter);
	// Collect checkbox values and add eventlistener(s)
	filters[0] = cbDefaultfilter.checked;
	for (let i = 1; i < cbFilters.length; i++) {
		cbFilters[i].addEventListener('change', checkFilter);
		filters[i] = cbFilters[i].checked;
	}

	return filters;
};

// Defaultfilter control
const checkDefaultfilter = () => {
	let cbDefaultfilter = document.querySelector('.cbDefaultfilter');
	let cbFilters = document.querySelectorAll('.cbFilter');
	let checkCount = 0;
	// Don't count defaultfilter, so let i = 1
	for (let i = 1; i < cbFilters.length; i++) {
		if (cbFilters[i].checked) {
			checkCount++;
		}
	}
	// If defaultfilter is not checked, but other filters are, then check defaultfilter and uncheck all other filters,
	// else if defaultfilter is checked, and no other filters, then do nothing
	if (cbDefaultfilter.checked === true && checkCount > 0) {
		let filters = [];
		filters[0] = cbDefaultfilter.checked;
		for (let i = 1; i < cbFilters.length; i++) {
			filters[i] = cbFilters[i].checked = false;
		}

		const url = buildFilterURLParam();
		history.replaceState({ scrollY: window.scrollY, page: null, filters: filters }, '', url);
		pageRequest(url);
	} else if (cbDefaultfilter.checked === false && checkCount === 0) {
		cbDefaultfilter.checked = true;
	}
};

const buildFilterURLParam = () => {
	let form;
	let forms = document.querySelectorAll('form');
	forms.forEach(thisForm => {
		console.log(thisForm.length);
		if (thisForm.length > 2) {
			form = thisForm;
		}
	});
	let formAction= `${form.action}`;
	let filterParam = '';
	let cbFilters = form.querySelectorAll('.cbFilter');

	if (location.pathname === '/zoek/resultaten' || location.pathname.includes('/zoek/resultaten/p')) {
		let q = `?q=${form[0].value}`;
		if (cbFilters.length > 0) {
			let filters = [];
			if (cbFilters.length > 0) {
				filterParam = '&categorie=';
			}
			let input = cbFilters[0];
			if (input.checked === true) {
				filterParam = '';
			}
			filters[0] = input.checked;
			for (let i = 1; i < cbFilters.length; i++) {
				let input = cbFilters[i];
				filters[i] = input.checked;
				if (input.checked === true) {
					filterParam += input.value;
					filterParam += ', ';
				}
			}
			filterParam = filterParam.trim();
			filterParam = filterParam.slice(0, filterParam.length-1);
		}
		formAction += q + filterParam;
	} else {
		let pathName = location.pathname.split('/');
		formAction = '/' + pathName[1];
		console.log(formAction);
		let filters = [];
		if (cbFilters.length > 0) {
			filterParam = '?categorie=';
		}
		let input = cbFilters[0];
		if (input.checked === true) {
			filterParam = '';
		}
		
		filters[0] = input.checked;
		for (let i = 1; i < cbFilters.length; i++) {
			let input = cbFilters[i];
			filters[i] = input.checked;
			if (input.checked === true) {
				filterParam += input.value;
				filterParam += ', ';
			}
		}
		filterParam = filterParam.trim();
		filterParam = filterParam.slice(0, filterParam.length-1);

		formAction += filterParam;	
	}
	
	return formAction;
};

// Switch off default checkbox on nieuwsindex when selecting other checkboxes
// or switch on when deselecting them.
const checkFilter = (e) => {
	let cbDefaultfilter = document.querySelector('.cbDefaultfilter');
	let cbFilters = document.querySelectorAll('.cbFilter');
	let filters = [];
	let checkCount = 0;
	// Don't count defaultfilter, so let i = 1
	for (let i = 1; i < cbFilters.length; i++) {
		if (cbFilters[i].checked) {
			checkCount++;
		}
	}
	// Select defaultfilter when no filter is selected, or vice versa
	if (checkCount === 0) {
		cbDefaultfilter.checked = true;
	} else {
		cbDefaultfilter.checked = false;
	}
	// Save filter check values to state object
	filters[0] = cbDefaultfilter.checked;
	for (let i = 1; i < cbFilters.length; i++) {
		filters[i] = cbFilters[i].checked;
	}

	const url = buildFilterURLParam();
	history.replaceState({ scrollY: window.scrollY, page: null, filters: filters }, '', url);
	pageRequest(url);
};

const populateEditorsPick = (response) => {
	const parsedData = response;

	let pick;
	let a;
	let img;
	let strong;
	let pictures;
	let name;

	data = parsedData['data'];

	for (let i = 0; i < data.length; i++) {
		let entry = data[i];
		pick = `#pick-${i}`;
		a = document.querySelector(`${pick} a`);
		img = document.querySelector(`${pick} img`);
		strong = document.querySelector(`${pick} strong`);
		pictures = entry['pictures'];
		name = entry['name'];
		a.href = `https://mixcloud.com${entry['key']}`;
		img.src = pictures['large'];
		img.alt = `Thumbnail of ${name}`;
		strong.textContent = name;
	}

	// !!! Scrolback positie klopt enkel indien hier scrollback uitgevoerd!!!
	setDisplay();
};

const getTimetable = () => {
	//TODO Kan searchquery nog verder gespecifieerd worden?
	const query = `{
		entries(section: "programScheme" orderBy: "title") {
		  title
		  ... on programScheme_programScheme_Entry {
			weekdag {
			  ... on weekdag_timeSlot_BlockType {
				beginuur
				einduur
				programma {
				  title
				  url
				}
			  }
			}
			}
		}
	  }
	  `;

	const request = new Request('http://localhost/api', {
		method: 'POST',
		headers: new Headers({
			'Content-type': 'application/json',
			'Accept': 'application/json'
		}),
		body: JSON.stringify({
			query})
	});
	
	getData(request, saveTimetable, printErrorMessage);
};

const saveTimetable = (data) => {
	let entries = data['data']['entries'];
	let d = new Date();
	let currentDay = d.getDay();
	let currentHour = parseInt(d.getHours());
	//  als h < 7 (== het is nog geen 7 uur AM), neem de vorige dag
	if (currentHour < 7) {
		currentDay = currentDay - 1;
		// indien dag == zondag, dan dagnr veranderen naar zaterdag
		if (currentDay < 0) {
			currentDay = 6;
		}
	}
	let ttDay = entries[currentDay];
	let timeslots = ttDay['weekdag'];
	console.log(timeslots);
	for (i=0; i < timeslots.length; i++) {
		let timeslot = timeslots[i];
		let beginuurTS = timeslot['beginuur'];
		let beginuur = parseInt(beginuurTS.substring(11,13));
		let einduurTS = timeslot['einduur'];
		let einduur = parseInt(einduurTS.substring(11,13));
		
		if ((currentHour >= beginuur && currentHour < einduur) || (currentHour >= beginuur && einduur < beginuur)) {
			console.log(beginuur);
			let programma = timeslot['programma'][0];

	
			let currentlyPlaying = document.querySelector('.audioplayer-currently-playing a');
			clearParentNode(currentlyPlaying);
			let strong = document.createElement('strong');
			currentlyPlaying.setAttribute('href', programma['url']);
			strong.textContent = programma['title'];
			currentlyPlaying.appendChild(strong);

			let nextTimeslot = timeslots[i+1];
			// if currentlyPlaying is last timeslot, then next falls out of array
			if (nextTimeslot == timeslots.length) {
				currentDay = currentDay + 1;
				// if currentday was saterday, set back to day number for sunday
				if (currentDay == 7) {
					currentDay = 0;
				}
				let nextDay = ttDay[currentDay];
				nextTimeslot = nextDay[0];
			}
			
			let nextProgramma = nextTimeslot['programma'][0];
			let next = document.querySelector('.audioplayer-playing-next a');
			clearParentNode(next);
			let u = document.createElement('u');
			next.setAttribute('href', nextProgramma['url']);
			u.textContent = nextProgramma['title'];
			next.appendChild(u);
		}	
	}

	//reload homepage
	//TODO: check of het nodig is om enkel een twig-include partial te herladen! 
	if (location.pathname == '/') {
		pageRequest(location.pathname);
	}

};

const checkCurrentTime = () => {
	let d = new Date();
	// Check if it's presicely a new hour (e.g. 15h00)
	let m = d.getMinutes();
	// if true, then get the timetable data from sessionstorage
	// and check if new program is on air or not
	if (m == 0) {
		getTimetable();
		setTimeout(checkCurrentTime, 60000);
	} else {
		// Check every 30 seconds again for current time
		setTimeout(checkCurrentTime, 30000);
	}
};
 
// Window Events
const onload = () => {
	lastScrollY = 0;

	// Ajax navigation
	history.scrollRestoration = 'auto';
	let currentUrl = getURL();
	let scrollY = 0;

	if (document.location.search)
	{
		currentUrl += document.location.search;
	}


	history.replaceState({ scrollY: scrollY, filters: null }, '', currentUrl);
	// Audio player 
	const liveAudio = document.querySelector('.live-audio');
	liveAudio.load();
	const audioControl = document.querySelector('.audio-control');
	// Searchform overlay
	const searchIcons = document.querySelectorAll('.toggle-search');
	const close = document.querySelector('.close');
	const searchModal = document.querySelector('.overlay');

	searchIcons.forEach((searchIcon) => searchIcon.addEventListener('click', openSearch));
	close.addEventListener('click', closeSearch);
	searchModal.addEventListener('click', closeSearch);

	audioControl.addEventListener('click', (e) => {
		if (liveAudio.paused === true) {
			if (!liveAudio.hasAttribute('src')) {
				liveAudio.setAttribute('src', 'http://urgentstream.radiostudio.be:8000/live?fbclid=IwAR0UT-WBLUyWbUAmZbwbPExIyY7IDasgTpHbYFTdEUYBT08ARQ4KhxevaAk');
			}
			liveAudio.play();
			// audioControl.textContent = 'play';
		} else {
			liveAudio.pause();
			// liveAudio.currentTime = 0;
			liveAudio.removeAttribute('src');
			liveAudio.load();
		}
	});

	// TEST: laad programma op en bekijk om de minuut of het uur voorbij is 
	// => indien ja: laadt volgende programma
	checkCurrentTime();

	router(currentUrl);
};

const saveLastState = () => {
	let lastState = history.state.filters;
	sessionStorage.setItem("urgentfm.laststate", lastState.toString());
};

const changeNavbarstate = () => {
	let header = document.querySelector('#navBar');
	if (lastScrollY < window.scrollY) {
		header.classList.add('header-hidden');
	} else {
		header.classList.remove('header-hidden');
	}
	lastScrollY = window.scrollY;
};

const hidePageLoading = () => {
	if (document.readyState !== 'complete') {
		let content = document.querySelector('.content');
	 	content.style.visibility = 'hidden';
	} else {
		let content = document.querySelector('.content');
	 	content.style.visibility = 'visible';
	}
};

// return to page when clicking on browser's "back" or "forward" button
window.addEventListener('popstate', e => {
	e.preventDefault();

	let url = getURL();
	if (location.search) {
		url = url.concat(location.search);
	}

	pageRequest(url);
});

window.addEventListener('load', onload);


window.addEventListener('pagehide', saveLastState);

window.addEventListener('scroll', changeNavbarstate);

document.addEventListener('readystatechange', hidePageLoading);