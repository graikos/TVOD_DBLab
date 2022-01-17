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
let adminMode = false;
let activeAdd = false;
let haveLoaded = 0;

window.onload = () => {
    fetchCustomers();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    adminMode = (document.body.getAttribute("data-user") === "Administrator");

    if (adminMode) {

        customerActions["delete"] = {
            "func": removeCustomer,
            "desc": "Remove Customer"
        };


        addFloatingButton(document.body, "add", () => {
            if (activeAdd) {
                return;
            }
            activeAdd = true;
            let table = tables["customers_table"];
            let newrow = table.appendRow(["", "", "", "", "", "", "", "", "", ""]);

            let country_options = [];
            for (let country in globalAddressData) {
                country_options.push(country);
            }

            table.editHTMLRow(["text", "text", "text", "select", "text", "text", "text", "text", "select", "select"], newrow, saveNewCustomer, [{
                "options": suboptions
            }, {
                "options": country_options,
                "onSelect": pickCountry,
                "enclose": [2]
            }, {
                "options": []
            }], () => {
                newrow.remove();
                activeAdd = false;
            }, true);
        });
    }
};


const saveNewCustomer = (e, values) => {
    tables["customers_table"].rows[tables["customers_table"].rows.length - 1] = values;


    let popup = createPopUp(document.body, `Set password for new user`);
    let passinput = document.createElement("input")
    passinput.setAttribute("type", "password");
    passinput.setAttribute("placeholder", "Enter password");
    passinput.id = "new-pass-input";
    passinput.classList.add("new-pass-input");
    passinput.classList.add("form-input");


    let confirmpass = document.createElement("input")
    confirmpass.setAttribute("type", "password");
    confirmpass.setAttribute("placeholder", "Confirm password");
    confirmpass.id = "confirm-pass-input";
    confirmpass.classList.add("new-pass-input");
    confirmpass.classList.add("form-input");

    let submit = document.createElement("button");
    submit.classList.add("load-more");
    submit.innerHTML = `Submit`;
    submit.classList.add("submit-pass");

    submit.addEventListener("click", (e) => {
        submitNewUser(e, values);
    });

    const enterPressOnInput = (e) => {
        if (e.key === "Enter") {
            submitNewUser(e, values);
        }
    }
    passinput.addEventListener("keypress", enterPressOnInput);
    confirmpass.addEventListener("keypress", enterPressOnInput);

    popup.append(passinput);
    popup.append(confirmpass);
    popup.append(submit);

}

const submitNewUser = (e, values) => {
    let newpass = document.getElementById("new-pass-input").value;
    let confirmnewpass = document.getElementById("confirm-pass-input").value;

    if (newpass.length === 0) {
        makeToast("failure", "Password cannot be empty", 1000);
    }
    if (newpass !== confirmnewpass) {
        makeToast("failure", "Passwords do not match", 1000);
        return;
    }

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

    let data = {
        "type": "customer",
        "for_user": `${values[0]}`,
        "first_name": `${first_name}`,
        "last_name": `${last_name}`,
        "sub_type": `${values[3]}`,
        "country": `${values[8]}`,
        "city": `${values[9]}`,
        "district": `${values[6]}`,
        "phone": phone,
        "postal_code": postal_code,
        "address": `${values[5]}`,
        "password": `${newpass}` 
    };

    data = JSON.stringify(data);

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
            if (req.status == 200 || req.status == 201) {
                makeToast("success", `Successfully ${req.status == 200? "updated" : "added"} customer`, 1000);
                activeAdd = false;
                let tab = tables["customers_table"];
                tab.tableRoot.remove();
                e.target.parentNode.remove();
                start = 0;
                fetchCustomers(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding customer", 1000);
            }
        }
    };

}

/*
const fetchCustomers = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?start="+start+"&end="+batch+"&type=CUSTOMERS";
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
                if (tables["customers_table"] === undefined) {
                    createCustomersTable(resp);
                } else {
                    if (resp.length < batch) {
                        document.getElementById("load-more-btn").remove();
                    }
                    resp.forEach(cust => {
                        tables["customers_table"].appendRow([cust["email"], cust["first_name"], cust["last_name"],  
                        cust["sub_type"], cust["phone"], cust["address"], cust["district"] ,cust["postal_code"], cust["country"], cust["city"]]);
                    });
                }
                if (globalAddressData === undefined) {
                    fetchAddressData();
                }
                start += batch;
            } else {
                makeToast("failure", "Error fetching customers", 1000);
            }
        }
    };
};
*/

const fetchCustomers = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=CUSTOMERS";

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
                if (tables["customers_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createCustomersTable(resp);
                } else {
                    resp.forEach(cust => {
                        tables["customers_table"].appendRow([cust["email"], cust["first_name"], cust["last_name"],  
                        cust["sub_type"], cust["phone"], cust["address"], cust["district"] ,cust["postal_code"], cust["country"], cust["city"]]);
                    });
                }
                if (resp.length < batch) {
                    document.getElementById("load-more-btn").remove();
                }
                if (globalAddressData === undefined) {
                    fetchAddressData();
                }
                start += itemnum;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};


let globalAddressData;

const fetchAddressData = () => {
    let req = new XMLHttpRequest();
    let url = hostname+addressEndpoint;
    
    url = encodeURI(url);
    req.open("get", url);
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                globalAddressData = resp;
            } else {
                makeToast("failure", "Error fetching address data", 1000);
            }
            fetchSubData();
        }
    };
}

let suboptions = [];

const fetchSubData = () => {
    let req = new XMLHttpRequest();
    let url = hostname+subscriptionEndpoint;
    
    url = encodeURI(url);
    req.open("get", url);
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                resp.forEach(subtype => {
                    suboptions.push(subtype[0]);
                });
                
            } else {
                makeToast("failure", "Error fetching subscription data", 1000);
            }
        }
    };
};;

const createCustomersTable = (custData) => {
    if (custData.length == 0) {
        let nocust = document.createElement("h2");
        nocust.classList.add("no-entries-text");
        nocust.innerHTML = `No customers found`;
        document.getElementsByClassName("main-content")[0].appendChild(nocust);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["E-mail", "First Name", "Last Name", 
     "Subscription", "Phone", "Address", "District", "Postal Code", "Country", "City"], [], 0, customerActions);
     custData.forEach(cust => {
        table.addInternalRow([cust["email"], cust["first_name"], cust["last_name"],  
        cust["sub_type"], cust["phone"], cust["address"], cust["district"], cust["postal_code"], cust["country"], cust["city"]]);
     });
     table.createTable(true, fetchCustomers, true);
     tables["customers_table"] = table;
};

const editCustomer = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    let currentCountry = currentRow.children[8].innerHTML;

    let country_options = [];
    let city_options = []
    for (let country in globalAddressData) {
        country_options.push(country);
        if (currentCountry != country) {
            continue;
        }
        for (let city in globalAddressData[country]) {
            city_options.push(city);
        }
    }
    
    tables["customers_table"].editHTMLRow([undefined, "text", "text", "select", "text", "text", "text", "text", "select", "select"],
     currentRow, confirmEditCustomer, [{"options": suboptions}, {"options": country_options, "onSelect": pickCountry, "enclose": [2]}, {"options": city_options}]);
};

const viewRentalHistory = (e) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+rentalsEndpoint;
    let params = "?for_user="+e.target.getAttribute("data-row-id");
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
                createPopUp(document.body, `Rentals for: ${e.target.getAttribute("data-row-id")}`);
                createRentalsTable(resp);
            } else {
                makeToast("failure", "Error fetching rentals data", 1000);
            }
        }
    };
};

const createRentalsTable = (rentalsData) => {
    if (rentalsData.length == 0) {
        let norentals = document.createElement("h2");
        norentals.classList.add("no-entries-text");
        norentals.innerHTML = `No rentals found`;
        document.getElementsByClassName("popup")[0].appendChild(norentals);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("popup")[0], ["ID", "Date", "Amount", "Type", "Title", "Season Number",
     "Episode Number"], [], 0);
     rentalsData.forEach(rental => {
        if (rental[3] == "SHOW"){
            rental.splice(4,1);
        } else if (rental[3] == "FILM") {
            rental.splice(5,1);
        } else {
            return;
        }
        rental[3] = rental[3].charAt(0).toUpperCase() + rental[3].slice(1);
        table.addInternalRow(rental);
     });
     table.createTable(false);
     tables["rentals_table"] = table;
};
let customerActions = {
    "edit": {
        "func": editCustomer,
        "desc": "Edit Customer"
    },
    "description": {
        "func": viewRentalHistory,
        "desc": "View Rentals"
    },
};


const confirmEditCustomer = (e, values) => {
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

const removeCustomer = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["customers_table"].editHTMLRow([], currentRow, confirmRemoveCustomer);
}

const confirmRemoveCustomer = (e, values) => {
    let data = {
        "for_user": `${values[0]}`
    };
    data = JSON.stringify(data);

    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+profileEndpoint;

    url = encodeURI(url);
    req.open("delete", url);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", token);
    req.send(data);


    enableLoader();
    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            disableLoader();
            if (req.status == 200) {
                makeToast("success", "Successfully removed customer", 1000);
                let tab = tables["customers_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchCustomers(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing customer", 1000);
            }
        }
    };

};

const pickCountry = (sels, new_selected_country) => {
    sels[0].clear();
    for (let city in globalAddressData[new_selected_country]) {
        // not setting selected
        sels[0].addOption(city, false);
    }

};
