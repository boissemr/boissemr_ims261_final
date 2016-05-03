$(document).ready(function() {

	// global variables
	comparedCountries = [];
	yearLocked = false;
	populationLocked = false;
	countryNames = [],
	countryCodes = [];
	color = d3.scale.category10();
	colorIndex = 0;
	lockedYear = 1960;

	// find country codes/names
	for(var i = 0; i < POPULATION.length; i++) {
		countryNames.push(POPULATION[i].CountryName);
		countryCodes.push(POPULATION[i].CountryCode);
	}

	// svg re-ordering
	orderZ = function(elements) {
		elements.sort(function(a, b) {
			return parseInt($(b).attr("z")) - parseInt($(a).attr("z"));
		});
		for(var i = 0; i < elements.length; i++) {
			d3.select(elements[i]).moveToFront();
		}
	}

	// https://github.com/wbkd/d3-extended
	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	};
	d3.selection.prototype.moveToBack = function() {
		return this.each(function() { 
			var firstChild = this.parentNode.firstChild; 
			if(firstChild) { 
				this.parentNode.insertBefore(this, firstChild); 
			}
		});
	};

	// remove string from array
	Array.prototype.removeString = function() {
		var what,
			a = arguments,
			L = a.length, ax;
		while(L && this.length) {
			what = a[--L];
			while((ax = this.indexOf(what)) != -1) {
				this.splice(ax, 1);
			}
		}
		return this;
	}

	// get country code/name/index
	getCountryCode = function(countryName) {
		return POPULATION[$.inArray(countryName, countryNames)].CountryCode;
	}
	getCountryName = function(countryCode) {
		return POPULATION[$.inArray(countryCode, countryCodes)].CountryName;
	}
	getCountryIndex = function(countryCode) {
		return $.inArray(countryCode, countryCodes);
	}

	// change slider value pairs
	setSlider = function(countryCode, isYear, value) {

		// slider
		var thisSlider = $("#" + countryCode + " ." + (isYear ? "year" : "population") + " .bar");
		var siblingSlider = $("#" + countryCode + " ." + (!isYear ? "year" : "population") + " .bar");
		thisSlider.val(value);
		var year = 0;
		var yearText = "";
		if(isYear) {
			var pop = Math.round(eval("POPULATION[getCountryIndex(countryCode)].year" + value) / 1000000);
			siblingValue = pop;
			year = thisSlider.val();
			yearText = year;
		} else {
			year = 2014;
			while(year >= 1960 && Math.round(eval("POPULATION[getCountryIndex(countryCode)].year" + year) / 1000000) > value) {
				year -= 1;
				if(year < 1960) {
					yearText = "before 1960";
					year = 1960;
					break;
				} else {
					yearText = year;
				}
			}
			if(year == 2014) {
				yearText = "maybe in the future";
				year = 2014;
			}
			siblingValue = yearText;
		}
		if(yearLocked) {
			lockedYear = year;
		} else {
			lockedYear = 1960;
		}
		siblingSlider.val(siblingValue);
		$("#" + countryCode + "year").val(isYear ? value : siblingValue);
		$("#" + countryCode + "population").val(!isYear ? value : siblingValue);

		// circle
		setCircle(countryCode, year);
	}

	// update circles
	setCircle = function(countryCode, year) {
		window.setTimeout(function() {
			var index = getCountryIndex(countryCode);
			var cx = eval("LIFE_EXPECTANCY[" + index + "].year" + year);
			var cy = 100 - eval("(GDP[" + index + "].year" + year + "/ 600)");
			var r = eval("(POPULATION[" + index + "].year" + year + " ^ .1) / 20000000");
			r = Math.max(r, 2);
			d3.select("#graph ." + countryCode)
				.attr("cx", cx + "%")
				.attr("cy", cy + "%")
				.attr("r", r + "%");
		}, 1);
	}

	// change all sliders
	setAllSliders = function(countryCode) {
		if(yearLocked || populationLocked) {
			for(var i = 0; i < comparedCountries.length; i++) {
				var value = $("#" + countryCode + " ." + (yearLocked ? "year" : "population") + " .bar").val();
				setSlider(getCountryCode(comparedCountries[i]), yearLocked, value);
			}
		}
	}

	// update slider value displays
	updateYear = function(countryCode, value) {
		$("#" + countryCode + "year").val(value);
		setSlider(countryCode, true, value);
		setAllSliders(countryCode);
	}
	updatePopulation = function(countryCode, value) {
		$("#" + countryCode + "population").val(value);
		setSlider(countryCode, false, value);
		setAllSliders(countryCode);
	}

	// lock or unlock
	lockToggle = function(lockButton) {

		// find country
		var countryCode = $(lockButton).parent().parent().parent().parent().attr("id");

		// change lock state
		if($(lockButton).parent().parent().hasClass("year")) {
			yearLocked = !yearLocked;
			if(yearLocked) populationLocked = false;
		} else {
			populationLocked = !populationLocked;
			if(populationLocked) yearLocked = false;
		}
		$(".year .lock").attr("value", (yearLocked)?"lock":"lock_open");
		$(".population .lock").attr("value", (populationLocked)?"lock":"lock_open");

		// actually lock number
		setAllSliders(countryCode);
	}

	// remove a country
	removeCountry = function(removeButton) {

		// find country controller and country name
		var countryController = $(removeButton).parent();
		var country = countryController.attr('id');

		// debug log
		console.log("remove this country: " + country);

		// delete country controller
		countryController.remove();
		comparedCountries.removeString(country);

		// delete circle
		$("#graph ." + country).remove();
	}

	// add a country
	addCountry = function(override) {

		// unfocus
		$("#addCountry input[type='text']").blur();

		// find country
		var country = $("#addCountry input[type='text']").val();

		// override country if available
		if(override != null) {
			country = override;
		}

		// check if valid
		var isValidCountry = $.inArray(country, countryNames) > -1;
		var isValidCode = $.inArray(country, countryCodes) > -1;

		// debug log
		console.log("add this country: " + country + " (" + ((isValidCountry || isValidCode) ? "valid" : "invalid") + ")");

		if(isValidCountry || isValidCode) {

			// other variables and stuff
			var countryCode = isValidCountry ? getCountryCode(country) : country;
			var yearID = countryCode + "year";
			var populationID = countryCode + "population";
			country = getCountryName(countryCode);

			// add country controller
			if(!$("#" + countryCode).length) {

				// add to array
				comparedCountries.push(country);

				// add circle
				//NOTE: these are %
				var cx = 0;
				var cy = 100;
				var r = 0;
				var z = POPULATION[getCountryIndex(countryCode)].year2014;
				makeCircle(cx, cy, r, z, countryCode);

				// clear text input
				$("#addCountry input[type='text']").val("");
				$("#errorMessage").html("");

				// append to left
				$("#addCountry").before("<div id='" + countryCode + "' class='countryControls'></div>");
				
				// append to country controller
				var countryController = $("#" + countryCode);
				countryController.append("<input class='addRemove remove' type='button' onclick='removeCountry(this)' value='+'>");
				countryController.append("<h2>" + country + "</h2>");
				countryController.append("<div class='sliderContainer'></div>");

				// append to slider container
				var sliderContainer = $("#" + countryCode + " .sliderContainer");
				sliderContainer.append("<div class='year slider'></div>");
				sliderContainer.append("<div class='population slider'></div>");
				
				// append to year slider
				var yearSlider = $("#" + countryCode + " .year.slider");
				yearSlider.append("<h3>Year<input class='lock material-icons' type='button' value='" + ((yearLocked)?"lock":"lock_open") + "' onclick='lockToggle(this)'></h3>");
				yearSlider.append("<input class='bar' type='range' class='rangeinput' oninput='updateYear(" + countryCode + ".id,value)' value='1960' min='1960' max='2014'/>");
				yearSlider.append("<output id='" + yearID + "'>1960</output>");
				
				// append to population slider
				var populationSlider = $("#" + countryCode + " .population.slider");
				populationSlider.append("<h3>Population<input class='lock material-icons' type='button' value='" + ((populationLocked)?"lock":"lock_open") + "' onclick='lockToggle(this)'></h3>");
				populationSlider.append("<input class='bar' type='range' class='rangeinput' oninput='updatePopulation(" + countryCode + ".id,value)' value='0' min='0' max='500'/>");
				populationSlider.append("<output id='" + populationID + "'>0</output>");

				// set values
				setAllSliders($("#left div:nth-child(1)").attr("id"));
				setCircle(countryCode, lockedYear);
				orderZ($("#graph circle"));
			}

			// this country is already being compared
			else {
				$("#errorMessage").html("This country is already being compared.");
			}
		} else {

			// there is no text in the input
			if(country == "") {
				$("#errorMessage").html("You have not entered a country.");
			}

			// the input is not a valid country
			else {
				$("#errorMessage").html("You have not entered a country we have data for.");
			}
		}

		// set all sliders
		setAllSliders(countryCode);
	}

	// draw circle
	makeCircle = function(x, y, r, z, countryCode) {
		d3.select("#graph").append("circle")
			.attr("cx", x + "%")
			.attr("cy", y + "%")
			.attr("r", r + "%")
			.attr("z", z)
			.attr("class", countryCode)
			.attr("fill", color(colorIndex));
		$("head").append("<style>#" + countryCode + " h2 { color: " + color(colorIndex) + " }</stlye>");
		colorIndex += 1;
	}

	// color bullshit
	for(var i = 0; i < 0; i++) {
		color(colorIndex);
		colorIndex += 1;
	}

	// add some random countries to start
	console.log("Adding two random countries...");
	var randomCountry = [POPULATION[Math.floor(Math.random() * POPULATION.length)].CountryName, null];
	do {
		randomCountry[1] = POPULATION[Math.floor(Math.random() * POPULATION.length)].CountryName;
	} while(randomCountry[1] == randomCountry[0])
	addCountry(randomCountry[0]);
	addCountry(randomCountry[1]);

	// done loading
	console.log("Fully loaded!");
});
