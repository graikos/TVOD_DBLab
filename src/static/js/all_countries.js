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
        let table = tables["countries_table"];
        let newrow = table.appendRow(["", ""]);
        table.editHTMLRow([undefined, "text"], newrow, saveNewCountry, [], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};



const fetchCountries = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=COUNTRIES";

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
                if (tables["countries_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createCountriesTable(resp);
                } else {
                    resp.forEach(country => {
                        tables["countries_table"].appendRow([country["country_id"], country["country"]]);
                    });
                }
                if (resp.length < batch) {
                    document.getElementById("load-more-btn").remove();
                }
                start += batch;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};

const createCountriesTable = (countData) => {
    if (countData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No countries found`;
        document.getElementsByClassName["main-content"][0].appendChild(nosh);
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Country"],
     [], 0, countriesActions);
     countData.forEach(country => {
        table.addInternalRow([country["country_id"], country["country"]]);
     });
     table.createTable(true, fetchCountries, false);
     tables["countries_table"] = table;
};


const editCountry = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["countries_table"].editHTMLRow([undefined, "text"], currentRow, confirmEditCountry, []);
};


const confirmEditCountry = (e, values) => {

    let country_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "COUNTRY",
        "action": "UPDATE",
        "country_id": country_id,
        "country": `${values[1]}`
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
                makeToast("success", "Successfully updated country", 1000);
                let tab = tables["countries_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating country", 1000);
            }
        }
    };
};

const removeCountry = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["countries_table"].editHTMLRow([], currentRow, confirmRemoveCountry);
}

const confirmRemoveCountry = (e, values) => {
    let country_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "COUNTRY",
        "action": "DELETE",
        "country_id": country_id
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
                makeToast("success", "Successfully removed country", 1000);
                let tab = tables["countries_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCountries(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing country", 1000);
            }
        }
    };

};

const saveNewCountry = (e, values) => {
    activeAdd = false;

    tables["countries_table"].rows[tables["countries_table"].rows.length - 1] = values;

    let data = {
        "type": "COUNTRY",
        "action": "ADD",
        "country": `${values[1]}`
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
                makeToast("success", "Successfully added country", 1000);
                let tab = tables["countries_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCountries(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding country", 1000);
            }
        }
    };

};


let countriesActions = {
    "delete": {
        "func": removeCountry,
        "desc": "Remove Country"
    },
    "edit": {
        "func": editCountry,
        "desc": "Edit Country"
    }
};