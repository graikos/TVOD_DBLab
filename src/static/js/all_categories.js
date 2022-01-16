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
    fetchCategories();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["categories_table"];
        let newrow = table.appendRow(["", ""]);
        table.editHTMLRow([undefined, "text"], newrow, saveNewCategory, [], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};



const fetchCategories = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=CATEGORIES";

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
                if (tables["categories_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createCategoriesTable(resp);
                } else {
                    resp.forEach(cat => {
                        tables["categories_table"].appendRow([cat["category_id"], cat["name"]]);
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

const createCategoriesTable = (catData) => {
    if (catData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No categories found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Category Name"],
     [], 0, categoriesActions);
     catData.forEach(cat => {
        table.addInternalRow([cat["category_id"], cat["name"]]);
     });
     table.createTable(true, fetchCategories, false);
     tables["categories_table"] = table;
};


const editCategory = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["categories_table"].editHTMLRow([undefined, "text"], currentRow, confirmEditCategory, []);
};


const confirmEditCategory = (e, values) => {

    let cat_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "CATEGORY",
        "action": "UPDATE",
        "category_id": cat_id,
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
                makeToast("success", "Successfully updated category", 1000);
                let tab = tables["categories_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating category", 1000);
            }
        }
    };
};

const removeCategory = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["categories_table"].editHTMLRow([], currentRow, confirmRemoveCategory);
}

const confirmRemoveCategory = (e, values) => {
    let category_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "CATEGORY",
        "action": "DELETE",
        "category_id": category_id
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
                makeToast("success", "Successfully removed category", 1000);
                let tab = tables["categories_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCategories(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing category", 1000);
            }
        }
    };

};

const saveNewCategory = (e, values) => {
    activeAdd = false;

    tables["categories_table"].rows[tables["categories_table"].rows.length - 1] = values;

    let data = {
        "type": "CATEGORY",
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
                makeToast("success", "Successfully added category", 1000);
                let tab = tables["categories_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCategories(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding category", 1000);
            }
        }
    };

};


let categoriesActions = {
    "delete": {
        "func": removeCategory,
        "desc": "Remove Category"
    },
    "edit": {
        "func": editCategory,
        "desc": "Edit Category"
    }
};