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
    fetchFilms();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["films_table"];
        let newrow = table.appendRow(["", "", "", "", "", "", "", "", "", "No"]);
        table.editHTMLRow([undefined, "text", "text", "select", "text", "text", "text", "text", "text"], newrow, saveNewFilm, [{"options": ratings}], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};


const saveNewFilm = (e, values) => {
    activeAdd = false;

    tables["films_table"].rows[tables["films_table"].rows.length - 1] = values;

    let data = `{
        "type": "FILM",
        "action": "ADD",
        "title": "${values[1]}",
        "description": "${values[2]}",
        "length": ${parseInt(values[6])},
        "release_year": ${parseInt(values[7])},
        "language": "${values[4]}",
        "original_language": "${values[5]}",
        "rating": "${values[3]}",
        "special_features": ""
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
                makeToast("success", "Successfully added film", 1000);
                let tab = tables["films_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchFilms(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding film", 1000);
            }
        }
    };

};


const fetchFilms = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=ALL_FILMS";

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
                if (tables["films_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length;
                    }
                    createFilmsTable(resp);
                } else {
                    if (resp.length < batch) {
                        document.getElementById("load-more-btn").remove();
                    }
                    resp.forEach(film => {
                        tables["films_table"].appendRow([film["film_id"], film["title"], film["description"],  
                        film["rating"], joinelem(film["language"]), joinelem(film["original_language"]), film["length"], 
                        film["release_year"],film["special_features"], (film["in_inventory"]? "Yes":"No")]);
                    });
                }
                start += itemnum;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};
const createFilmsTable = (filmsData) => {
    if (filmsData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No shows found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Title", "Description",
     "Rating", "Language", "Original Language", "Length", "Release Year", "Special Features", "Available"],
     [], 0, filmsActions);
     filmsData.forEach(film => {

        table.addInternalRow([film["film_id"], film["title"], film["description"],  
        film["rating"], joinelem(film["language"]), joinelem(film["original_language"]), film["length"], film["release_year"], film["special_features"], film["in_inventory"]? "Yes":"No"]);
     });
     table.createTable(true, fetchFilms, true);
     tables["films_table"] = table;
};


const editFilm = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["films_table"].editHTMLRow([undefined, "text", "text", "select", "text", "text", "text", "text", "text", undefined], currentRow, confirmEditFilm, [
        {
            "options": ratings
        }
    ]);
};


const confirmEditFilm = (e, values) => {

    let film_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = `{
        "type": "FILM",
        "action": "UPDATE",
        "film_id": ${film_id},
        "title": "${values[1]}",
        "description": "${values[2]}",
        "release_year": ${parseInt(values[7])},
        "length": ${parseInt(values[6])},
        "language": "${values[4]}",
        "original_language": "${values[5]}",
        "rating": "${values[3]}",
        "special_features": "${values[8]}"
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
                makeToast("success", "Successfully updated film", 1000);
                let tab = tables["films_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating film", 1000);
            }
        }
    };
};

const toggleInventory = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["films_table"].editHTMLRow([], currentRow, confirmToggleInventory, []);
};

const confirmToggleInventory = (e, values) => {
    let film_id = parseInt(e.target.getAttribute("data-row-id"));

    let in_inventory = (values[9] === "Yes");

    let data = {
        "type": "INVENTORY",
        "action": "ADD_FILM",
        "film_id": film_id
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
                makeToast("success", `Successfully ${(in_inventory)? "removed from": "added to"} inventory`, 1000);
                let tab = tables["films_table"];
                values[9] = in_inventory? "No": "Yes";
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", `Error ${(in_inventory)? "removing from": "adding to"} inventory`, 1000);
            }
        }
    };
};




const removeFilm = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["films_table"].editHTMLRow([], currentRow, confirmRemoveFilm);
}

const confirmRemoveFilm = (e, values) => {
    let film_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "FILM",
        "action": "DELETE",
        "film_id": film_id
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
                makeToast("success", "Successfully removed film", 1000);
                let tab = tables["films_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchFilms(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing film", 1000);
            }
        }
    };

};






const showActors = (e, noPop, film_id) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    if (film_id === undefined) {
        film_id = e.target.getAttribute("data-row-id")
    }
    let params = "?type=ACTORS_BY_FILM_ID&film_id="+film_id;
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
                    let ppp = createPopUp(document.body, `Actors for: ${title}`, tables, "actors_table", film_id);
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

    let film_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));

    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    tables["actors_table"].rows[tables["actors_table"].rows.length - 1] = values;
    let data = {
        "type": "FILM",
        "action": "ADD_ACTOR",
        "film_id": film_id,
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
                showActors(e, true, film_id);
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
    let film_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));
    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "FILM",
        "action": "DELETE_ACTOR",
        "film_id": film_id,
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
                showActors(e, true, film_id);
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





const showCategories = (e, noPop, film_id) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    if (film_id === undefined) {
        film_id = e.target.getAttribute("data-row-id");
    }
    let params = "?type=CATEGORIES_BY_FILM_ID&film_id="+film_id;
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
                    let ppp = createPopUp(document.body, `Categories for: ${title}`, tables, "categories_table", film_id);
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

    let film_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));

    let cat_id = parseInt(e.target.getAttribute("data-row-id"));

    tables["categories_table"].rows[tables["categories_table"].rows.length - 1] = values;
    let data = {
        "type": "FILM",
        "action": "ADD_CATEGORY",
        "film_id": film_id,
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
                showCategories(e, true, film_id);
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
    let film_id = parseInt(document.getElementsByClassName("popup")[0].getAttribute("data-for-id"));
    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "FILM",
        "action": "DELETE_CATEGORY",
        "film_id": film_id,
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
                showCategories(e, true, film_id);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating categories", 1000);
            }
        }
    };

};














let filmsActions = {
    "edit": {
        "func": editFilm,
        "desc": "Edit"
    },
    "people": {
        "func": showActors,
        "desc": "Show Actors"
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
        "func": removeFilm,
        "desc": "Remove Film"
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

const joinelem = (elem) => {
    if (elem === null) {
        return null;
    } else {
        return elem.join(", ");
    }
}