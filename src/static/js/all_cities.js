let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");

const fetchEndpoint = "/api/fetch";
const addressEndpoint = "/api/address";
const subscriptionEndpoint = "/api/subscription";
const profileEndpoint = "/api/profile";
const rentalsEndpoint = "/api/rental";
const editEndpoint = "/api/edit";
const batch = 10;

let start = 0;
let haveLoaded = 0;
let tables = {};
let activeAdd = false;


window.onload = () => {
    fetchCountries();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["cities_table"];
        let newrow = table.appendRow(["", "", ""]);
        table.editHTMLRow([undefined, "select", "text"], newrow, saveNewCity, [{
            "options": allcountries.map(c => c["country"])
        }], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};

let allcountries = [];

const fetchCountries = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?type=ALL_COUNTRIES";

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
                resp.forEach(country => {
                    allcountries.push(country);
                });
                fetchCities();
            } else {
                makeToast("failure", "Error fetching countries", 1500);
            }
        }
    }
};


const fetchCities = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=CITIES";

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
                haveLoaded += resp.length;
                if (tables["cities_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createCitiesTable(resp);
                } else {
                    resp.forEach(city => {
                        tables["cities_table"].appendRow([city["city_id"], city["country"], city["city"]]);
                    });
                }
                if (resp.length < batch) {
                    document.getElementById("load-more-btn").remove();
                }
                start += itemnum;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};

const createCitiesTable = (cityData) => {
    if (cityData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No cities found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Country", "City"],
     [], 0, citiesActions);
     cityData.forEach(city => {
        table.addInternalRow([city["city_id"], city["country"], city["city"]]);
     });
     table.createTable(true, fetchCities, false);
     tables["cities_table"] = table;
};


const editCity = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["cities_table"].editHTMLRow([undefined, "select", "text"], currentRow, confirmEditCity, [{
        "options": allcountries.map(c => c["country"])
    }]);
};


const confirmEditCity = (e, values) => {

    let city_id = parseInt(e.target.getAttribute("data-row-id"));
    let country_name = values[1];
    let country_id;
    allcountries.forEach(count => {
        if (country_name == count["country"]) {
            country_id = count["country_id"];
            return;
        }
    });
    if (country_id === undefined) {
        console.log("country not found");
        console.log(country_name);
        return;
    }


    let data = {
        "type": "CITY",
        "action": "UPDATE",
        "country_id": country_id,
        "city_id": city_id,
        "city": `${values[2]}`
    };

    data = JSON.stringify(data);

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+editEndpoint;

    url = encodeURI(url);
    req.open("put", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", token);
    req.send(data);


    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                makeToast("success", "Successfully updated city", 1000);
                let tab = tables["cities_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating city", 1000);
            }
        }
    };
};

const removeCity = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["cities_table"].editHTMLRow([], currentRow, confirmRemoveCity);
}

const confirmRemoveCity = (e, values) => {
    let city_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "CITY",
        "action": "DELETE",
        "city_id": city_id
    };
    data = JSON.stringify(data);

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+editEndpoint;

    url = encodeURI(url);
    req.open("put", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", token);
    req.send(data);


    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                makeToast("success", "Successfully removed city", 1000);
                let tab = tables["cities_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCities(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing city", 1000);
            }
        }
    };

};

const saveNewCity = (e, values) => {
    activeAdd = false;

    tables["cities_table"].rows[tables["cities_table"].rows.length - 1] = values;

    let data = {
        "type": "CITY",
        "action": "ADD",
        "to_country": `${values[1]}`,
        "city": `${values[2]}`
    };

    data = JSON.stringify(data);

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+editEndpoint;

    url = encodeURI(url);
    req.open("put", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", token);
    req.send(data);


    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                makeToast("success", "Successfully added city", 1000);
                let tab = tables["cities_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCities(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding city", 1000);
            }
        }
    };

};


let citiesActions = {
    "delete": {
        "func": removeCity,
        "desc": "Remove City"
    },
    "edit": {
        "func": editCity,
        "desc": "Edit City"
    }
};