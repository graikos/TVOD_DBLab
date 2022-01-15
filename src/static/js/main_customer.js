
let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");


const rentalEndpoint = "/api/rental"
const fetchEndpoint = "/api/fetch"

let numberOfEntries = 0;
let batch = 24;
let loadedAll = false;
let currentTab = undefined;

let activeRentDialog = false;
let activeRentID = undefined;

let dropdown_IDS = {"season-select": `<em>Pick a season</em>`, "episode-select": `<em>Pick an episode</em>`};
let selectors = {};

window.onload = () => {
    tabbtns = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tabbtns.length; ++i) {
        tabbtns[i].addEventListener('click', (e) => {
            tabSwitch(e);
        });
    }

    for (selector_id in dropdown_IDS) {
        let selector = document.getElementById(selector_id);
        selectors[selector_id] = new Selector(selector, [], -1, clears[selector_id], dropdown_IDS[selector_id]);
    }

    document.body.addEventListener('click', (e) => { 
        for (selector_id in dropdown_IDS) {
            let selector = document.getElementById(selector_id);
            if (!selector.contains(e.target)) {
                let menu = selector.getElementsByClassName("select-option-wrapper")[0];
                menu.classList.add("invisible-select-menu");
            }
        }
    });

    let sub_type = getCookie("sub_type");
    if (sub_type == "BOTH") {
        currentTab = "SHOWS";
    }
    else {
        currentTab = sub_type;
    }
    fetchData();
};

const tabSwitch = (e) => {
    closeRentDialog();
    document.getElementsByClassName("tab-btn-active")[0].classList.remove("tab-btn-active");
    e.target.classList.add("tab-btn-active");
    let container = document.getElementById("content-container");
    container.innerHTML = "";
    numberOfEntries = 0;
    switch (e.target.id) {
        case "films-tab-btn":
            currentTab = "FILMS";
            break;
        case "shows-tab-btn":
            currentTab = "SHOWS";
            break;
        case "categories-tab-btn":
            break;
        case "search-tab-btn":
            break;
        default:
            return;
    }
    currentData = {};
    loadedAll = false;
    fetchData();
};

window.addEventListener("scroll", () => {
    const winscroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (winscroll == height) {
        fetchData();
    }
});

let currentData = {}

const fetchData = () => {
    if (loadedAll) {
        return;
    }
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?start="+numberOfEntries+"&end="+batch+"&type=" + currentTab;

    url = encodeURI(url+params);

    req.open("get", url);
    req.setRequestHeader("Authorization", token);
    req.send();
    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                if (resp.length == 0) {
                    loadedAll = true;
                    return;
                }
                console.log(resp);
                resp.forEach(entry => {
                    if (currentTab == "FILMS") {
                        addFilmCard(entry);
                        currentData[entry.film_id] = entry;
                    } else if (currentTab == "SHOWS") {
                        addShowCard(entry)
                        currentData[entry.show_id] = entry;
                    }
                });
                numberOfEntries += resp.length;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
    

};



const addFilmCard = (filmdata) => {
    let contentView = document.getElementById("content-container");
    temphtml = `
        <div class="content-card">
            <div class="card-text-wrapper">
                <div class="card-title-wrapper">
                    <span class="card-title">${filmdata.title}</span>
                    <span class="card-seasons">${filmdata["length"]} min</span><br>
                    <span class="card-release-year">${filmdata.release_year}</span>
                </div>
                <div class="card-tag-wrapper">
                    <div class="card-tags">
                        <span class="card-tag card-tag-rating">${filmdata.rating}</span>`;


    filmdata.categories.forEach(element => {
        temphtml += `<span class="card-tag">${element}</span>`
    });
    
    temphtml += `
                    </div>
                </div>
                <div class="card-details-wrapper">
                    <p class="card-description">${filmdata.description}</p>
                    <a class="card-cta-btn" data-entry-id=${filmdata.film_id} data-entry-type="FILMS" onclick="rentDialog(this)">Rent</a>
                </div>
            </div>
        </div>
    `;   
    contentView.innerHTML += temphtml;
}

const addShowCard = (showdata) => {
    let contentView = document.getElementById("content-container");
    temphtml = `
        <div class="content-card">
            <div class="card-text-wrapper">
                <div class="card-title-wrapper">
                    <span class="card-title">${showdata.title}</span>
                    <span class="card-seasons">${showdata.seasons.length} seasons</span><br>
                    <span class="card-release-year">${showdata.release_year}</span>
                </div>
                <div class="card-tag-wrapper">
                    <div class="card-tags">
                        <span class="card-tag card-tag-rating">${showdata.rating}</span>`;


    showdata.categories.forEach(element => {
        temphtml += `<span class="card-tag">${element}</span>`
    });
    
    temphtml += `
                    </div>
                </div>
                <div class="card-details-wrapper">
                    <p class="card-description">${showdata.description}</p>
                    <a class="card-cta-btn" data-entry-id=${showdata.show_id} data-entry-type="SHOWS" onclick="rentDialog(this)">Rent</a>
                </div>
            </div>
        </div>
    `;   
    contentView.innerHTML += temphtml;
}

const rentDialog = (e) => {
    let entry_type = e.getAttribute("data-entry-type");
    let entry_id = parseInt(e.getAttribute("data-entry-id"));
    let rent_dialog = document.getElementById("rent-dialog");
    let rent_button = document.getElementById("rent-now-btn");
    rent_button.setAttribute("data-entry-type", entry_type);
    rent_button.setAttribute("data-entry-id", entry_id);
    clearSelectors(["season-select", "episode-select"]);

    activeRentID = entry_id;

    selectors["season-select"].setText(`<i>Pick a season</i>`);
    selectors["episode-select"].setText(`<i>Pick an episode</i>`);

    if (!activeRentDialog) {
        rent_dialog.classList.add("active-rent-dialog");
    }

    document.getElementById("title-details").innerHTML = `<span>Title: </span>` + currentData[entry_id].title;
    actors = "";
    currentData[entry_id].actors.forEach(actorarr => {
        actors += (", " + actorarr.join(" "))
    });
    let castDetails = document.getElementById("cast-details");
    if (actors.length > 0) {
        actors = actors.slice(2);
        castDetails.classList.remove("hidden-details");
        castDetails.innerHTML = `<span>Cast: </span>` + actors;
    } else {
        castDetails.classList.add("hidden-details");
        document.getElementById("cast-details")
    }

    let descriptionDetails = document.getElementById("description-details");
    if (currentData[entry_id].description.length > 0) {
        descriptionDetails.classList.remove("hidden-details");
        descriptionDetails.innerHTML = `<span>Description: </span>` + currentData[entry_id].description;
    } else {
        descriptionDetails.classList.add("hidden-details");
    }

    let yearDetails = document.getElementById("release-year-details");
    if (currentData[entry_id].release_year !== undefined) {
        yearDetails.classList.remove("hidden-details");
        yearDetails.innerHTML = `<span>Release Year: </span>` + currentData[entry_id].release_year;
    } else {
        yearDetails.classList.add("hidden-details");
    }


    let ratingDetails = document.getElementById("rating-details");
    if (currentData[entry_id].rating.length > 0) {
        ratingDetails.classList.remove("hidden-details");
        ratingDetails.innerHTML = `<span>Rating: </span>` + currentData[entry_id].rating;
    } else {
        ratingDetails.classList.add("hidden-details");
    }

    languages = "";
    currentData[entry_id].language.forEach(lang => {
         languages += (", " + lang);
    });

    let languageDetails = document.getElementById("languages-details");
    if (currentData[entry_id].language.length > 0) {
        languages = languages.slice(2);
        languageDetails.classList.remove("hidden-details");
        languageDetails.innerHTML = `<span>Languages: </span>` + languages;
    } else {
        languageDetails.classList.add("hidden-details");
    }
    
    oglanguages = "";
    let ogLangDetails = document.getElementById("og-languages-details");
    if (currentData[entry_id.original_language]) {
        currentData[entry_id].original_language.forEach(lang => {
            oglanguages += (", " + lang);
        });
        if (currentData[entry_id].original_language.length > 0) {
            oglanguages = oglanguages.slice(2);
            ogLangDetails.classList.remove("hidden-details");
            ogLangDetails.innerHTML = `<span>Original Language: </span>` + oglanguages;
        } else {
            ogLangDetails.classList.add("hidden-details");
        }
    } else {
        ogLangDetails.classList.add("hidden-details");
    }

    categories = "";
    currentData[entry_id].categories.forEach(cat => {
        categories += (", " + cat);
    });
    let categoriesDetails = document.getElementById("categories-details");
    if (categories.length > 0) {
        categories = categories.slice(2);
        categoriesDetails.classList.remove("hidden-details");
        categoriesDetails.innerHTML = `<span>Categories: </span>` + categories;
    } else {
        categoriesDetails.classList.add("hidden-details");
    }


    let spdetails = document.getElementById("special-features-details");
    if (entry_type == "FILMS") {
        specialfeat = "";
        currentData[entry_id].special_features.forEach(sp => {
            specialfeat += (", " + sp);
        });
        if (specialfeat.length > 0) {
            specialfeat = specialfeat.slice(2);
            spdetails.classList.remove("hidden-details");
            spdetails.innerHTML = `<span>Special Features: </span>` + specialfeat;
        } else {
            spdetails.classList.add("hidden-details");
        }
    } else {
        spdetails.classList.add("hidden-details");
    }

    let durationDetails = document.getElementById("duration-details");
    if (entry_type == "FILMS") {
        durationDetails.innerHTML = `<span>Duration: </span>` + currentData[entry_id]["length"] + "min";
    } else {
        durationDetails.innerHTML = `<span>Seasons: </span>` + currentData[entry_id].seasons.length;
    }

    let pickerswrap = document.getElementById("picker-wrapper");
    if (entry_type == "SHOWS") {
        rent_dialog.classList.remove("rent-dialog-film");
        pickerswrap.classList.remove("hidden-details");


        for (i = 0; i < currentData[entry_id].seasons.length; ++i) {
            selectors["season-select"].addOption(i+1);
        }

    } else {
        rent_dialog.classList.add("rent-dialog-film");
        pickerswrap.classList.add("hidden-details");
    }
};

const rent = (e) => {

    let entry_type = e.getAttribute("data-entry-type");
    let data;
    if (entry_type == "FILMS") {
        data = `{
            "rental_type": "${entry_type}",
            "for_user": "${getCookie("email")}",
            "film_id": "${e.getAttribute("data-entry-id")}"
        }`;
    } else if (entry_type == "SHOWS") {
        data = `{
            "rental_type": "${entry_type}",
            "for_user": "${getCookie("email")}",
            "show_id": "${e.getAttribute("data-entry-id")}",
            "season_number": ${parseInt(selectors["season-select"].getSelected())},
            "episode_number": ${parseInt(selectors["episode-select"].getSelected())}
        }`;
    } else {
        makeToast("failure", "Error submitting rental", 1000);
        return;
    }

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+rentalEndpoint;
    

    url = encodeURI(url);
    req.open("post", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", token);
    req.send(data);

    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                makeToast("success", "Successfully rented item", 1000);
            } else {
                makeToast("failure", "Error renting item", 1000);
            }
        }
    };

};

const clearSelectors = (to_clear) => {
    to_clear.forEach(selector_id => {
        selectors[selector_id].clear();
    });
};

const pickSeason = (new_selected_season) => {
    clearSelectors(["episode-select"]);
    for (i = 0; i < currentData[activeRentID].seasons[parseInt(new_selected_season-1)].episodes; ++i) {
        selectors["episode-select"].addOption(i+1);
    }
}

const closeRentDialog = () => {
    document.getElementById("rent-dialog").classList.remove("active-rent-dialog");
    activeRentDialog = false;
}


let clears = {
    "season-select": pickSeason
};