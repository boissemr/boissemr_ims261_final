$(document).ready(function() {

	// global variables
	comparedCountries = [];
	yearLocked = false;
	populationLocked = false;
	countryNames = [],
	countryCodes = [];

	// find country codes/names
	for(var i = 0; i < POPULATION.length; i++) {
		countryNames.push(POPULATION[i].CountryName);
		countryCodes.push(POPULATION[i].CountryCode);
	}

	// remove string from array
	Array.prototype.removeString = function() {
		var what, a = arguments, L = a.length, ax;
		while(L && this.length) {
			what = a[--L];
			while((ax = this.indexOf(what)) != -1) {
				this.splice(ax, 1);
			}
		}
		return this;
		}

	// get country code/name
	getCountryCode = function(countryName) {
		return POPULATION[$.inArray(countryName, countryNames)].CountryCode;
	}
	getCountryName = function(countryCode) {
		return POPULATION[$.inArray(countryCode, countryCodes)].CountryName;
	}

	// change slider value pairs
	setSlider = function(countryCode, isYear, value) {
		var thisSlider = $("#" + countryCode + " ." + (isYear ? "year" : "population") + " .bar");
		var siblingSlider = $("#" + countryCode + " ." + (!isYear ? "year" : "population") + " .bar");
		thisSlider.val(value);
		siblingValue = 0; //TODO: set sibling value according to thisSlider value
		siblingSlider.val(siblingValue);
		$("#" + countryCode + "year").val(isYear ? value : siblingValue);
		$("#" + countryCode + "population").val(!isYear ? value : siblingValue);
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
		setAllSliders(countryCode);
	}
	updatePopulation = function(countryCode, value) {
		$("#" + countryCode + "population").val(value);
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
				//TODO: set open or closed depending
				var yearSlider = $("#" + countryCode + " .year.slider");
				yearSlider.append("<h3>Year<input class='lock material-icons' type='button' value='" + ((yearLocked)?"lock":"lock_open") + "' onclick='lockToggle(this)'></h3>");
				yearSlider.append("<input class='bar' type='range' class='rangeinput' onchange='updateYear(" + countryCode + ".id,value)' value='1960' min='1960' max='2014'/>");
				yearSlider.append("<output id='" + yearID + "'>1960</output>");
				
				// append to population slider
				//TODO: set open or closed depending
				var populationSlider = $("#" + countryCode + " .population.slider");
				populationSlider.append("<h3>Population<input class='lock material-icons' type='button' value='" + ((populationLocked)?"lock":"lock_open") + "' onclick='lockToggle(this)'></h3>");
				populationSlider.append("<input class='bar' type='range' class='rangeinput' onchange='updatePopulation(" + countryCode + ".id,value)' value='0' min='0' max='1365'/>");
				populationSlider.append("<output id='" + populationID + "'>0</output>");

				// set values
				setAllSliders($("#left:nth-child(1)").attr("id"));
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
