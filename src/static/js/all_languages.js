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
    fetchLanguages();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["languages_table"];
        let newrow = table.appendRow(["", ""]);
        table.editHTMLRow([undefined, "text"], newrow, saveNewLanguage, [], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};



const fetchLanguages = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=LANGUAGES";

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
                if (tables["languages_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createLanguagesTable(resp);
                } else {
                    resp.forEach(lang => {
                        tables["languages_table"].appendRow([lang["language_id"], lang["name"]]);
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
const createLanguagesTable = (langData) => {
    if (langData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No languages found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Language Name"], [], 0, languageActions);
     langData.forEach(lang => {
        table.addInternalRow([lang["language_id"], lang["name"]]);
     });
     table.createTable(true, fetchLanguages, false);
     tables["languages_table"] = table;
};


const editLanguage = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["languages_table"].editHTMLRow([undefined, "text"], currentRow, confirmEditLanguage, []);
};


const confirmEditLanguage = (e, values) => {

    let lang_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "LANGUAGE",
        "action": "UPDATE",
        "language_id": lang_id,
        "name": `${values[1]}`
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
                makeToast("success", "Successfully updated language", 1000);
                let tab = tables["languages_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating language", 1000);
            }
        }
    };
};

const removeLanguage = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["languages_table"].editHTMLRow([], currentRow, confirmRemoveLanguage);
}

const confirmRemoveLanguage = (e, values) => {
    let lang_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "LANGUAGE",
        "action": "DELETE",
        "language_id": lang_id
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
                makeToast("success", "Successfully removed language", 1000);
                let tab = tables["languages_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchLanguages(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing language", 1000);
            }
        }
    };

};

const saveNewLanguage = (e, values) => {
    activeAdd = false;

    tables["languages_table"].rows[tables["languages_table"].rows.length - 1] = values;

    let data = {
        "type": "LANGUAGE",
        "action": "ADD",
        "name": `${values[1]}`
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
                makeToast("success", "Successfully added language", 1000);
                let tab = tables["languages_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchLanguages(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding language", 1000);
            }
        }
    };

};


let languageActions = {
    "delete": {
        "func": removeLanguage,
        "desc": "Remove Language"
    },
    "edit": {
        "func": editLanguage,
        "desc": "Edit Language"
    }
};

