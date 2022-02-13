let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");

const fetchEndpoint = "/api/fetch";
const addressEndpoint = "/api/address";
const subscriptionEndpoint = "/api/subscription";
const profileEndpoint = "/api/profile";
const rentalsEndpoint = "/api/rental";
const batch = 10;
let start = 0;


let tables = {};
let adminMode = false;
let activeAdd = false;
let haveLoaded = 0;

window.onload = () => {
    fetchStaff();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });



    addFloatingButton(document.body, "add", () => {
        if (activeAdd) {
            return;
        }
        activeAdd = true;
        let table = tables["staff_table"];
        let newrow = table.appendRow(["", "", "", "", "", "", "", "", "", "No"]);

        let country_options = [];
        for (let country in globalAddressData) {
            country_options.push(country);
        }

        table.editHTMLRow(["text", "text", "text", "text", "text", "text", "text", "select", "select"], newrow, saveNewEmployee, [
        {
            "options": country_options,
            "onSelect": pickCountry,
            "enclose": [1]
        }, {
            "options": []
        }], () => {
            newrow.remove();
            activeAdd = false;
        }, true);
    });
};


const saveNewEmployee = (e, values) => {
    tables["staff_table"].rows[tables["staff_table"].rows.length - 1] = values;


    let popup = createPopUp(document.body, `Set password for new employee`);
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

    let phone = parseInt(values[3]);
    if (!Number.isInteger(phone)) {
        makeToast("failure", "Phone number not valid", 1000);
        return;
    }
    let postal_code  = parseInt(values[6]);
    if (!Number.isInteger(postal_code)) {
        makeToast("failure", "Postal code not vaild", 1000);
        return;
    }

    let data = {
        "type": "employee",
        "for_user": `${values[0]}`,
        "first_name": `${first_name}`,
        "last_name": `${last_name}`,
        "country": `${values[7]}`,
        "city": `${values[8]}`,
        "district": `${values[5]}`,
        "phone": phone,
        "postal_code": postal_code,
        "address": `${values[4]}`,
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
                makeToast("success", `Successfully ${req.status == 200? "updated" : "added"} staff member`, 1000);
                activeAdd = false;
                let tab = tables["staff_table"];
                tab.tableRoot.remove();
                e.target.parentNode.remove();
                start = 0;
                fetchStaff(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error adding staff member", 1000);
            }
        }
    };
}

const fetchStaff = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }
    let params = "?start="+start+"&end="+itemnum+"&type=STAFF";

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
                if (resp.length < batch) {
                    document.getElementById("load-more-btn").remove();
                }
                haveLoaded += resp.length;
                resp = resp.filter((el) => el["email"] !== getCookie("email"));
                if (tables["staff_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createStaffTable(resp);
                } else {
                    resp.forEach(cust => {
                        tables["staff_table"].appendRow([cust["email"], cust["first_name"], cust["last_name"],  
                        cust["phone"], cust["address"], cust["district"] ,cust["postal_code"], 
                        cust["country"], cust["city"], (cust["is_admin"]? "Yes" : "No")]);
                    });
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

const createStaffTable = (staffData) => {
    if (staffData.length == 0) {
        let nocust = document.createElement("h2");
        nocust.classList.add("no-entries-text");
        nocust.innerHTML = `No staff found`;
        document.getElementsByClassName("main-content")[0].appendChild(nocust);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["E-mail", "First Name", "Last Name", 
     "Phone", "Address", "District", "Postal Code", "Country", "City", "Administrator"], [], 0, staffActions);
     staffData.forEach(st => {
        table.addInternalRow([st["email"], st["first_name"], st["last_name"],  
         st["phone"], st["address"], st["district"], st["postal_code"], st["country"], st["city"], (st["is_admin"])? "Yes":"No"]);
     });
     table.createTable(true, fetchStaff, true);
     tables["staff_table"] = table;
};


const removeStaff = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["staff_table"].editHTMLRow([], currentRow, confirmRemoveStaff);
}

const confirmRemoveStaff = (e, values) => {
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
                makeToast("success", "Successfully removed staff member", 1000);
                let tab = tables["staff_table"];
                tab.tableRoot.remove();
                start = 0;
                fetchStaff(true, true);
                tab.activeClose = false;
            } else {
                makeToast("failure", "Error removing staff member", 1000);
            }
        }
    };

};



const toggleAdmin = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    tables["staff_table"].editHTMLRow([], currentRow, confirmToggleAdmin, []);
};

const confirmToggleAdmin = (e, values) => {
    let email = e.target.getAttribute("data-row-id");

    let is_admin = (values[9] === "Yes");

    let data = {
        "for_user": email,
        "toggle": 0
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
            if (req.status == 200) {
                makeToast("success", `Successfully ${(is_admin)? "demoted": "promoted"} staff member`, 1000);
                let tab = tables["staff_table"];
                values[9] = is_admin? "No": "Yes";
                tab.replaceHTMLRow(values, e.target.parentNode.parentNode);
                tab.replaceActionsInHTMLRow(tab.actions, e.target.parentNode.parentNode);
                tab.activeClose = false;
            } else {
                makeToast("failure", `Error ${(is_admin)? "demoting": "promoting"} staff member`, 1000);
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




let staffActions = {
    "elevator": {
        "func": toggleAdmin,
        "desc": "Promote/Demote Staff Member"
    },
    "delete": {
        "func": removeStaff,
        "desc": "Remove Staff Member"
    }
};