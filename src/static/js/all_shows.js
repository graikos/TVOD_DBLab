
let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");

const fetchEndpoint = "/api/fetch";
const addressEndpoint = "/api/address";
const subscriptionEndpoint = "/api/subscription";
const profileEndpoint = "/api/profile";
const rentalsEndpoint = "/api/rental";
const batch = 10;
let start = 0;

/* type: CUSTOMERS, ?start end */

let tables = {};
let activeAdd = false;

window.onload = () => {
    fetchShows();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["shows_table"];
        let newrow = table.appendRow(["", "", "", "", "", "", ""]);
        table.editHTMLRow([undefined, "text", "text", "text", "text", "text", "text"], newrow, saveNewShow, undefined, () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};

const saveNewShow = (e, values) => {
    activeAdd = false;
    let tab = tables["shows_table"];
    tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
    tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
    tab.activeClose = false;
};


const fetchShows = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?start="+start+"&end="+batch+"&type=ALL_SHOWS";

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
                if (tables["shows_table"] === undefined) {
                    createShowsTable(resp);
                } else {
                    if (resp.length < batch) {
                        document.getElementById("load-more-btn").remove();
                    }
                    resp.forEach(show => {
                        tables["shows_table"].appendRow([show["show_id"], show["title"], show["description"],  
                        show["rating"], show["language"].join(", "), show["original_language"].join(", "), show["release_year"]]);
                    });
                }
                start += batch;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};
const createShowsTable = (showData) => {
    if (showData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No shows found`;
        document.getElementsByClassName["main-content"][0].appendChild(nosh);
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Title", "Description", "Rating",
     "Language", "Original Language", "Release Year"],
     [], 0, showsActions);
     showData.forEach(show => {
        table.addInternalRow([show["show_id"], show["title"], show["description"],  
        show["rating"], show["language"].join(", "), show["original_language"].join(", "), show["release_year"]]);
     });
     table.createTable(true, fetchShows, true);
     tables["shows_table"] = table;
};


const editShow = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["shows_table"].editHTMLRow([undefined, "text", "text", "text", "text", "text", "text"], currentRow, confirmEditShow);
};



const confirmEditShow = (e, values) => {
    let first_name = values[1];
    let last_name = values[2];

    let phone = parseInt(values[4]);
    if (!Number.isInteger(phone)) {
        makeToast("failure", "Phone number not valid", 1000);
        return;
    }
    let postal_code  = parseInt(values[7]);
    if (!Number.isInteger(postal_code)) {
        makeToast("failure", "Postal code not vaild", 1000);
        return;
    }

    let data = `{
        "for_user": "${values[0]}",
        "first_name": "${first_name}",
        "last_name": "${last_name}",
        "sub_type": "${values[3]}",
        "country": "${values[8]}",
        "city": "${values[9]}",
        "district": "${values[6]}",
        "phone": "${phone}",
        "postal_code": "${postal_code}",
        "address": "${values[5]}"
    }`;

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+profileEndpoint;
    

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
                makeToast("success", "Successfully updated profile", 1000);
                let tab = tables["customers_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating profile", 1000);
            }
        }
    };
};










const showActors = (e) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?type=ACTORS_BY_SHOW_ID&show_id="+e.target.getAttribute("data-row-id");
    url = encodeURI(url+params);
    req.open("get", url);
    req.setRequestHeader("Authorization", token);
    req.send();

    let title = e.target.parentNode.parentNode.children[1].innerHTML;

    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                let ppp = createPopUp(document.body, `Actors for: ${title}`, tables, "actors_table");
                addFloatingButton(ppp, "add", addActor, "actor");
                createActorsTable(resp);
            } else {
                makeToast("failure", "Error fetching actors data", 1000);
            }
        }
    };
};

const saveNewActor = (e, values) => {
    var fl = document.querySelector('[data-source="actor"]');
    fl.setAttribute("data-active", "0");
    let tab = tables["actors_table"];
    tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
    tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
    tab.activeClose = false;
};

const addActor = (e) => {
    if (e.target.parentNode.getAttribute("data-active") == "1") {
        return;
    }
    e.target.parentNode.setAttribute("data-active", "1");
    let table = tables["actors_table"];
    if (table === undefined) {
        createActorsTable([], true);
        document.getElementsByClassName("no-entries-text")[0].remove();
        table = tables["actors_table"];
    }
    let newrow = table.appendRow(["", "", ""]);
    table.editHTMLRow([undefined, "text", "text"], newrow, saveNewActor, undefined, () => {
        newrow.remove();
        e.target.parentNode.setAttribute("data-active", "0");
    }, true);
}

const createActorsTable = (actorsData, allowEmpty) => {
    if (actorsData.length == 0 && !allowEmpty) {
        let noactors = document.createElement("h2");
        noactors.classList.add("no-entries-text");
        noactors.innerHTML = `No actors found`;
        document.getElementsByClassName("popup")[0].appendChild(noactors);
        return;
    }

    let table = new TableCreator(document.getElementsByClassName("popup")[0], ["ID", "First Name", "Last Name"], [], 0, actorActions);

     actorsData.forEach(actor => {
        table.addInternalRow([actor["actor_id"], actor["first_name"], actor["last_name"]]);
     });
     table.createTable(false);
     tables["actors_table"] = table;
};



const showCategories = (e) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    // TODO
    let params = "?type=CATEGORIES_BY_SHOW_ID&show_id="+e.target.getAttribute("data-row-id");
    url = encodeURI(url+params);
    req.open("get", url);
    req.setRequestHeader("Authorization", token);
    req.send();

    let title = e.target.parentNode.parentNode.children[1].innerHTML;

    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                let ppp = createPopUp(document.body, `Categories for: ${title}`, tables, "categories_table");
                addFloatingButton(ppp, "add", addCategory, "category");
                createCategoriesTable(resp);
            } else {
                makeToast("failure", "Error fetching categories data", 1000);
            }
        }
    };
};

const saveNewCategory = (e, values) => {
    var fl = document.querySelector('[data-source="category"]');
    fl.setAttribute("data-active", "0");
    let tab = tables["categories_table"];
    tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
    tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
    tab.activeClose = false;
};

const addCategory = (e) => {
    if (e.target.parentNode.getAttribute("data-active") == "1") {
        return;
    }
    e.target.parentNode.setAttribute("data-active", "1");
    let table = tables["categories_table"];
    if (table === undefined) {
        createCategoriesTable([], true);
        document.getElementsByClassName("no-entries-text")[0].remove();
        table = tables["categories_table"];
    }
    let newrow = table.appendRow(["", ""]);
    table.editHTMLRow([undefined, "text"], newrow, saveNewCategory, undefined, () => {
        newrow.remove();
        e.target.parentNode.setAttribute("data-active", "0");
    }, true);
}

const createCategoriesTable = (catData, allowEmpty) => {
    if (catData.length == 0 && !allowEmpty) {
        let nocats = document.createElement("h2");
        nocats.classList.add("no-entries-text");
        nocats.innerHTML = `No categories found`;
        document.getElementsByClassName("popup")[0].appendChild(nocats);
        return;
    }

    let table = new TableCreator(document.getElementsByClassName("popup")[0], ["ID", "Category Name"], [], 0, categoriesActions);

    catData.forEach(cat => {
       table.addInternalRow([cat["category_id"], cat["name"]]);
    });
    table.createTable(false);
    tables["categories_table"] = table;
};




const showSeasons = (e) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    // TODO
    let params = "?type=SEASONS_BY_SHOW_ID&show_id="+e.target.getAttribute("data-row-id");
    url = encodeURI(url+params);
    req.open("get", url);
    req.setRequestHeader("Authorization", token);
    req.send();

    let title = e.target.parentNode.parentNode.children[1].innerHTML;

    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                let ppp = createPopUp(document.body, `Seasons for: ${title}`, tables, "seasons_table");
                addFloatingButton(ppp, "add", addSeason, "season");
                createSeasonsTable(resp);
            } else {
                makeToast("failure", "Error fetching seasons data", 1000);
            }
        }
    };
};

const saveNewSeason = (e, values) => {
    var fl = document.querySelector('[data-source="season"]');
    fl.setAttribute("data-active", "0");
    let tab = tables["seasons_table"];
    tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
    tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
    tab.activeClose = false;
};

const addSeason = (e) => {
    if (e.target.parentNode.getAttribute("data-active") == "1") {
        return;
    }
    e.target.parentNode.setAttribute("data-active", "1");
    let table = tables["seasons_table"];
    if (table === undefined) {
        createSeasonsTable([], true);
        document.getElementsByClassName("no-entries-text")[0].remove();
        table = tables["seasons_table"];
    }
    let lastseason = table.getLastRow()[1];
    let newrow = table.appendRow(["", lastseason+1, ""]);
    table.editHTMLRow([undefined, undefined, "text"], newrow, saveNewSeason, undefined, () => {
        newrow.remove();
        e.target.parentNode.setAttribute("data-active", "0");
    }, true);
}

const createSeasonsTable = (seasonData, allowEmpty) => {
    if (seasonData.length == 0 && !allowEmpty) {
        let seasonData = document.createElement("h2");
        seasonData.classList.add("no-entries-text");
        seasonData.innerHTML = `No seasons found`;
        document.getElementsByClassName("popup")[0].appendChild(seasonData);
        return;
    }

    let table = new TableCreator(document.getElementsByClassName("popup")[0], ["ID", "Season Number", "No. of Episodes"], [], 0, seasonsActions);

    seasonData.forEach(s => {
       table.addInternalRow([s["season_id"], s["season_number"], s["episodes"]]);
    });
    table.createTable(false);
    tables["seasons_table"] = table;
};

let showsActions = {
    "edit": {
        "func": editShow,
        "desc": "Edit"
    },
    "people": {
        "func": showActors,
        "desc": "Show Actors"
    },
    "movie_creation": {
        "func": showSeasons,
        "desc": "Show Seasons"
    },
    "subject": {
        "func": showCategories,
        "desc": "Show Categories"
    },
    "delete": {
        "func": undefined,
        "desc": "Remove Show"
    }
};

let actorActions = {
    "delete": {
        "func": undefined,
        "desc": "Remove Actor"
    }
};

let categoriesActions = {
    "delete": {
        "func": undefined,
        "desc": "Remove Category"
    }
};


let seasonsActions = {
    "delete": {
        "func": undefined,
        "desc": "Remove Season"
    }
};