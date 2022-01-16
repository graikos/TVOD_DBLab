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
    fetchCities();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["addresses_table"];
        let newrow = table.appendRow(["", "", "", "", "", ""]);
        table.editHTMLRow([undefined, "select", "text", "text", "text", "text"], newrow, saveNewAddress, [{
            "options": allcities.map(c => c["city"])
        }], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};

let allcities = [];

const fetchCities = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?type=ALL_CITIES";

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
                resp.forEach(city => {
                    allcities.push(city);
                });
                fetchAddresses();
            } else {
                makeToast("failure", "Error fetching cities", 1500);
            }
        }
    }
};


const fetchAddresses = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=ADDRESSES";

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
                if (tables["addresses_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createAddressesTable(resp);
                } else {
                    resp.forEach(addr => {
                        tables["addresses_table"].appendRow([addr["address_id"], addr["city"], addr["address"],
                    addr["district"], addr["phone"], addr["postal_code"]]);
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

const createAddressesTable= (addrData) => {
    if (addrData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No addresses found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "City", "Address", "District", "Phone", "Postal Code"],
     [], 0, addressesActions);
     addrData.forEach(addr => {
        table.addInternalRow([addr["address_id"], addr["city"], addr["address"],
            addr["district"], addr["phone"], addr["postal_code"]]);
     });
     table.createTable(true, fetchAddresses, false);
     tables["addresses_table"] = table;
};


const editAddress = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["addresses_table"].editHTMLRow([undefined, "select", "text", "text", "text", "text"], currentRow, confirmEditAddress, [{
        "options": allcities.map(c => c["city"])
    }]);
};


const confirmEditAddress = (e, values) => {

    let addr_id = parseInt(e.target.getAttribute("data-row-id"));
    let city_name = values[1];
    let city_id;
    allcities.forEach(city => {
        if (city_name == city["city"]) {
            city_id = city["city_id"];
            return;
        }
    });
    if (city_id === undefined) {
        return;
    }

    let phone = parseInt(values[4]);
    if (!Number.isInteger(phone)) {
        makeToast("failure", "Phone number not valid", 1000);
        return;
    }
    let postal_code  = parseInt(values[5]);
    if (!Number.isInteger(postal_code)) {
        makeToast("failure", "Postal code not vaild", 1000);
        return;
    }


    let data = {
        "type": "ADDRESS",
        "action": "UPDATE",
        "city_id": city_id,
        "address_id": addr_id,
        "address": `${values[2]}`,
        "district": `${values[3]}`,
        "phone": phone,
        "postal_code": postal_code
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
                makeToast("success", "Successfully updated address", 1000);
                let tab = tables["addresses_table"];
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error updating address", 1000);
            }
        }
    };
};

const removeAddress = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["addresses_table"].editHTMLRow([], currentRow, confirmRemoveAddress);
}

const confirmRemoveAddress = (e, values) => {
    let address_id = parseInt(e.target.getAttribute("data-row-id"));

    let data = {
        "type": "ADDRESS",
        "action": "DELETE",
        "address_id": address_id
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
                makeToast("success", "Successfully removed address", 1000);
                let tab = tables["addresses_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchAddresses(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing address", 1000);
            }
        }
    };

};

const saveNewAddress = (e, values) => {
    activeAdd = false;

    tables["addresses_table"].rows[tables["addresses_table"].rows.length - 1] = values;

    let addr_id = parseInt(e.target.getAttribute("data-row-id"));
    let city_name = values[1];
    let city_id;
    allcities.forEach(city => {
        if (city_name == city["city"]) {
            city_id = city["city_id"];
            return;
        }
    });
    if (city_id === undefined) {
        return;
    }

    let phone = parseInt(values[4]);
    if (!Number.isInteger(phone)) {
        makeToast("failure", "Phone number not valid", 1000);
        return;
    }
    let postal_code  = parseInt(values[5]);
    if (!Number.isInteger(postal_code)) {
        makeToast("failure", "Postal code not vaild", 1000);
        return;
    }


    let data = {
        "type": "ADDRESS",
        "action": "ADD",
        "city_id": city_id,
        "address_id": addr_id,
        "address": `${values[2]}`,
        "district": `${values[3]}`,
        "phone": phone,
        "postal_code": postal_code
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
                makeToast("success", "Successfully added address", 1000);
                let tab = tables["addresses_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchAddresses(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding address", 1000);
            }
        }
    };

};


let addressesActions = {
    "delete": {
        "func": removeAddress,
        "desc": "Remove Address"
    },
    "edit": {
        "func": editAddress,
        "desc": "Edit Address"
    }
};