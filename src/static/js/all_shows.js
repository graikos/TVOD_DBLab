
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

/* type: CUSTOMERS, ?start end */

let tables = {};
let activeAdd = false;

const ratings = ["G","PG","PG-13","R","NC-17"];

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
        table.editHTMLRow([undefined, "text", "text", "select", "text", "text", "text", undefined], newrow, saveNewShow, [{"options": ratings}], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};

const saveNewShow = (e, values) => {
    activeAdd = false;

    tables["shows_table"].rows[tables["shows_table"].rows.length - 1] = values;

    let data = {
        "type": "SHOW",
        "action": "ADD",
        "show_id": show_id,
        "title": values[1],
        "description": values[2],
        "release_year": parseInt(values[6]),
        "language": replaceNA(values[4]),
        "original_language": replaceNA(values[5]),
        "rating": values[3],
        "special_features": ""
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
                makeToast("success", "Successfully added show", 1000);
                let tab = tables["shows_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchShows(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding show", 1000);
            }
        }
    };

};


const fetchShows = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=ALL_SHOWS";

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
                if (tables["shows_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length;
                    }
                    createShowsTable(resp);
                } else {
                    if (resp.length < batch) {
                        document.getElementById("load-more-btn").remove();
                    }
                    resp.forEach(show => {
                        tables["shows_table"].appendRow([show["show_id"], show["title"], show["description"],  
                        show["rating"], joinelem(show["language"]), joinelem(show["original_language"]), show["release_year"], (show["in_inventory"]? "Yes": "No")]);
                    });
                }
                start += itemnum;
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
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Title", "Description", "Rating",
     "Language", "Original Language", "Release Year", "Available"],
     [], 0, showsActions);
     showData.forEach(show => {
        table.addInternalRow([show["show_id"], show["title"], show["description"],  
        show["rating"], joinelem(show["language"]), joinelem(show["original_language"]), show["release_year"], (show["in_inventory"]? "Yes":"No")]);
     });
     table.createTable(true, fetchShows, true);
     tables["shows_table"] = table;
};


const editShow = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["shows_table"].editHTMLRow([undefined, "text", "text", "select", "text", "text", "text", undefined], currentRow, confirmEditShow, [
        {
            "options": ratings
        }
    ]);
};




const confirmEditShow = (e, values) => {

    let show_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "SHOW",
        "action": "UPDATE",
        "show_id": show_id,
        "title": values[1],
        "description": values[2],
        "release_year": parseInt(values[6]),
        "language": replaceNA(values[4]),
        "original_language": replaceNA(values[5]),
        "rating": values[3],
        "special_features": ""
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
                makeToast("success", "Successfully updated show", 1000);
                let tab = tables["shows_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating show", 1000);
            }
        }
    };
};


const toggleInventory = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["shows_table"].editHTMLRow([], currentRow, confirmToggleInventory, []);
};

const confirmToggleInventory = (e, values) => {
    let show_id = parseInt(e.target.getAttribute("data-row-id"));

    let in_inventory = (values[7] === "Yes");

    let data = {
        "type": "INVENTORY",
        "action": "ADD_SHOW",
        "show_id": show_id
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
                makeToast("success", "Successfully added to inventory", 1000);
                let tab = tables["shows_table"];
                values[7] = in_inventory? "No": "Yes";
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding to inventory", 1000);
            }
        }
    };
};




const removeShow = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["shows_table"].editHTMLRow([], currentRow, confirmRemoveShow);
}

const confirmRemoveShow = (e, values) => {
    let show_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "SHOW",
        "action": "DELETE",
        "show_id": show_id
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
                makeToast("success", "Successfully removed show", 1000);
                let tab = tables["shows_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchShows(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing show", 1000);
            }
        }
    };

};









const showActors = (e, noPop, show_id) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    if (show_id === undefined) {
        show_id = e.target.getAttribute("data-row-id")
    }
    let params = "?type=ACTORS_BY_SHOW_ID&show_id="+show_id;
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
                if (!noPop) {
                    let ppp = createPopUp(document.body, `Actors for: ${title}`, tables, "actors_table", show_id);
                    addFloatingButton(ppp, "add", addActor, "actor");
                }
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

    let show_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));

    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    tables["actors_table"].rows[tables["actors_table"].rows.length - 1] = values;
    let data = {
        "type": "SHOW",
        "action": "ADD_ACTOR",
        "show_id": show_id,
        "first_name": values[1],
        "last_name": values[2]
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
                makeToast("success", "Successfully updated actors", 1000);
                let tab = tables["actors_table"];
                tab.tableRoot.remove();
                showActors(e, true, show_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating actors", 1000);
            }
        }
    };

};

const removeActor = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["actors_table"].editHTMLRow([], currentRow, confirmRemoveActor);
}

const confirmRemoveActor = (e, values) => {
    let show_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));
    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "SHOW",
        "action": "DELETE_ACTOR",
        "show_id": show_id,
        "actor_id": actor_id
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
                makeToast("success", "Successfully updated actors", 1000);
                let tab = tables["actors_table"];
                tab.tableRoot.remove();
                showActors(e, true, show_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating actors", 1000);
            }
        }
    };

};



const addActor = (e) => {
    if (e.target.parentNode.getAttribute("data-active") == "1") {
        return;
    }
    e.target.parentNode.setAttribute("data-active", "1");
    let table = tables["actors_table"];
    let noentries = document.getElementsByClassName("no-entries-text")[0];
    if (table === undefined || noentries !== undefined) {
        createActorsTable([], true);
        table = tables["actors_table"];
        noentries.remove();
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



const showCategories = (e, noPop, show_id) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    if (show_id === undefined) {
        show_id = e.target.getAttribute("data-row-id");
    }
    let params = "?type=CATEGORIES_BY_SHOW_ID&show_id="+show_id;
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
                if (!noPop) {
                    let ppp = createPopUp(document.body, `Categories for: ${title}`, tables, "categories_table", show_id);
                    addFloatingButton(ppp, "add", addCategory, "category");
                }
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

    let show_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));

    let cat_id = parseInt(e.target.getAttribute("data-row-id"));

    tables["categories_table"].rows[tables["categories_table"].rows.length - 1] = values;
    let data = {
        "type": "SHOW",
        "action": "ADD_CATEGORY",
        "show_id": show_id,
        "name": values[1]
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
                makeToast("success", "Successfully updated categories", 1000);
                let tab = tables["categories_table"];
                tab.tableRoot.remove();
                showCategories(e, true, show_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating categories", 1000);
            }
        }
    };
};

const addCategory = (e) => {
    if (e.target.parentNode.getAttribute("data-active") == "1") {
        return;
    }
    e.target.parentNode.setAttribute("data-active", "1");
    let table = tables["categories_table"];
    let noentries = document.getElementsByClassName("no-entries-text")[0];
    if (table === undefined || noentries !== undefined) {
        createCategoriesTable([], true);
        document.getElementsByClassName("no-entries-text")[0].remove();
        noentries.remove();
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

const removeCategory = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["categories_table"].editHTMLRow([], currentRow, confirmRemoveCategory);
}

const confirmRemoveCategory = (e, values) => {
    let show_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));
    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "SHOW",
        "action": "DELETE_CATEGORY",
        "show_id": show_id,
        "category_id": parseInt(values[0])
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
                makeToast("success", "Successfully updated categories", 1000);
                let tab = tables["categories_table"];
                tab.tableRoot.remove();
                showCategories(e, true, show_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating categories", 1000);
            }
        }
    };

};







const showSeasons = (e, noPop, show_id) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    if (show_id === undefined) {
        show_id = e.target.getAttribute("data-row-id");
    }
    let params = "?type=SEASONS_BY_SHOW_ID&show_id="+show_id;
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
                if (!noPop) {
                    let ppp = createPopUp(document.body, `Seasons for: ${title}`, tables, "seasons_table", show_id);
                    addFloatingButton(ppp, "add", addSeason, "season");
                }
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

    let show_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));

    let season_id = parseInt(e.target.getAttribute("data-row-id"));

    tables["seasons_table"].rows[tables["seasons_table"].rows.length - 1] = values;
    let data = {
        "type": "SHOW",
        "action": "ADD_SEASON",
        "show_id": show_id,
        "episodes": parseInt(values[2])
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
                makeToast("success", "Successfully updated seasons", 1000);
                let tab = tables["seasons_table"];
                tab.tableRoot.remove();
                showSeasons(e, true, show_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating seasons", 1000);
            }
        }
    };

};

const addSeason = (e) => {
    if (e.target.parentNode.getAttribute("data-active") == "1") {
        return;
    }
    e.target.parentNode.setAttribute("data-active", "1");
    let table = tables["seasons_table"];
    let noentries = document.getElementsByClassName("no-entries-text")[0];
    if (table === undefined || noentries !== undefined) {
        createSeasonsTable([], true);
        table = tables["seasons_table"];
        noentries.remove();
    }
    let lastseason = table.getLastRow();
    let lastno = 0;
    if (lastseason !== undefined) {
        lastno = parseInt(lastseason[1]);
    }
    let newrow = table.appendRow(["", lastno+1, ""]);
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

const removeSeason = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["seasons_table"].editHTMLRow([], currentRow, confirmRemoveSeason);
}

const confirmRemoveSeason = (e, values) => {
    let show_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));
    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "SHOW",
        "action": "DELETE_SEASON",
        "show_id": show_id,
        "season_id": parseInt(values[0])
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
                makeToast("success", "Successfully updated seasons", 1000);
                let tab = tables["seasons_table"];
                tab.tableRoot.remove();
                showSeasons(e, true, show_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating seasons", 1000);
            }
        }
    };

};



const editSeason = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["seasons_table"].editHTMLRow([undefined, undefined, "text"], currentRow, confirmEditSeason);
};



const confirmEditSeason = (e, values) => {

    let season_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = `{
        "type": "SHOW",
        "action": "UPDATE_SEASON",
        "season_id": ${season_id},
        "episodes": ${parseInt(values[2])}
    }`;

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
                makeToast("success", "Successfully updated season", 1000);
                let tab = tables["seasons_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating season", 1000);
            }
        }
    };
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
    "rule_folder": {
        "func": toggleInventory,
        "desc": "Toggle Availability"
    },
    "delete": {
        "func": removeShow,
        "desc": "Remove Show"
    }
};

let actorActions = {
    "delete": {
        "func": removeActor,
        "desc": "Remove Actor"
    }
};

let categoriesActions = {
    "delete": {
        "func": removeCategory,
        "desc": "Remove Category"
    }
};


let seasonsActions = {
    "edit": {
        "func": editSeason,
        "desc": "Edit Season"
    },
    "delete": {
        "func": removeSeason,
        "desc": "Remove Season"
    }
};

const joinelem = (elem) => {
    if (elem === null) {
        return null;
    } else {
        return elem.join(", ");
    }
}