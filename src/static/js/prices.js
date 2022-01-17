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
    fetchPrices();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

};



const fetchPrices = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+subscriptionEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }

    url = encodeURI(url);

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
                if (tables["prices_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createPricesTable(resp);
                } else {
                    resp.forEach(price => {
                        tables["prices_table"].appendRow([price[0], price[1], price[2]]);
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
const createPricesTable = (priceData) => {
    if (priceData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No prices found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["Subscription Type", "Cost per Film", "Cost per Series Episode"], [], 0, pricesActions);
    priceData.forEach(price => {
        table.addInternalRow([price[0], price[1], price[2]]);
    });
    table.createTable(true, fetchPrices, false);
    tables["prices_table"] = table;
};


const editPrice = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    let sub_type = e.target.getAttribute("data-row-id");
    switch (sub_type) {
        case "FILMS":
            tables["prices_table"].editHTMLRow([undefined, "text", undefined], currentRow, confirmEditPrice, []);
            break;
        case "SHOWS":
            tables["prices_table"].editHTMLRow([undefined, undefined, "text"], currentRow, confirmEditPrice, []);
            break;
        case "BOTH":
            tables["prices_table"].editHTMLRow([undefined, "text", "text"], currentRow, confirmEditPrice, []);
            break;
        default:
            return;
    }
};


const confirmEditPrice = (e, values) => {

    let sub_type = e.target.getAttribute("data-row-id");

    let film_cost;
    let episode_cost;
    let data = {};
    switch (sub_type) {
        case "FILMS":
            film_cost = parseFloat(values[1]);
            if (!Number.isFinite(film_cost)) {
                makeToast("failure", "Film cost is not valid", 1000);
                return;
            }
            data = {
                "for_sub_type": sub_type,
                "film": film_cost
            }
            break;
        case "SHOWS":
            episode_cost = parseFloat(values[2]);
            if (!Number.isFinite(episode_cost)) {
                makeToast("failure", "Episode cost not vaild", 1000);
                return;
            }
            data = {
                "for_sub_type": sub_type,
                "episode": episode_cost
            }
            break;
        case "BOTH":
            film_cost = parseFloat(values[1]);
            episode_cost = parseFloat(values[2]);

            if (!Number.isFinite(film_cost)) {
                makeToast("failure", "Film cost is not valid", 1000);
                return;
            }
            if (!Number.isFinite(episode_cost)) {
                makeToast("failure", "Episode cost not vaild", 1000);
                return;
            }
            data = {
                "for_sub_type": sub_type,
                "film": film_cost,
                "episode": episode_cost
            }
            break;
        default:
            return;
    }

    data = JSON.stringify(data);

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+subscriptionEndpoint;

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
                makeToast("success", "Successfully updated prices", 1000);
                let tab = tables["prices_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating prices", 1000);
            }
        }
    };
};



let pricesActions = {
    "edit": {
        "func": editPrice,
        "desc": "Edit Price"
    }
};

