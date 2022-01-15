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
    fetchActors();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["actors_table"];
        let newrow = table.appendRow(["", "", ""]);
        table.editHTMLRow([undefined, "text", "text"], newrow, saveNewActor, [], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};



const fetchActors = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=ACTORS";

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
                if (tables["actors_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createActorsTable(resp);
                } else {
                    resp.forEach(actor => {
                        tables["actors_table"].appendRow([actor["actor_id"], actor["first_name"], actor["last_name"]]);
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
const createActorsTable = (actorsData) => {
    if (actorsData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No actors found`;
        document.getElementsByClassName["main-content"][0].appendChild(nosh);
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "First Name", "Last Name"],
     [], 0, actorActions);
     actorsData.forEach(actor => {
        table.addInternalRow([actor["actor_id"], actor["first_name"], actor["last_name"]]);
     });
     table.createTable(true, fetchActors, false);
     tables["actors_table"] = table;
};


const editActor = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["actors_table"].editHTMLRow([undefined, "text", "test"], currentRow, confirmEditActor, []);
};


const confirmEditActor = (e, values) => {

    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = `{
        "type": "ACTOR",
        "action": "UPDATE",
        "actor_id": ${actor_id},
        "first_name": "${values[1]}",
        "last_name": "${values[2]}"
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
                makeToast("success", "Successfully updated actor", 1000);
                let tab = tables["actors_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating actor", 1000);
            }
        }
    };
};

const removeActor = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["actors_table"].editHTMLRow([], currentRow, confirmRemoveActor);
}

const confirmRemoveActor = (e, values) => {
    let actor_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "ACTOR",
        "action": "DELETE",
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
                makeToast("success", "Successfully removed actor", 1000);
                let tab = tables["actors_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchActors(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing actor", 1000);
            }
        }
    };

};

const saveNewActor = (e, values) => {
    activeAdd = false;

    tables["actors_table"].rows[tables["actors_table"].rows.length - 1] = values;

    let data = {
        "type": "ACTOR",
        "action": "ADD",
        "first_name": `${values[1]}`,
        "last_name": `${values[2]}`
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
                makeToast("success", "Successfully added actor", 1000);
                let tab = tables["actors_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchActors(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding actor", 1000);
            }
        }
    };

};


let actorActions = {
    "delete": {
        "func": removeActor,
        "desc": "Remove Actor"
    }
};

