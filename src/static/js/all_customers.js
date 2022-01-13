let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");

const fetchEndpoint = "/api/fetch";
const addressEndpoint = "/api/address";
const subscriptionEndpoint = "/api/subscription";
const batch = 10;
let start = 0;

/* type: CUSTOMERS, ?start end */

let tables = {};

window.onload = () => {
    fetchCustomers();
};


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
                        cust["sub_type"], cust["phone"], cust["address"], cust["postal_code"], cust["city"], cust["country"]]);
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
                    suboptions.push(subtype[0].charAt(0) + subtype[0].slice(1).toLowerCase());
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
        document.getElementsByClassName["main-content"][0].appendChild(nocust);
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["E-mail", "First Name", "Last Name", 
     "Subscription", "Phone", "Address", "Postal Code", "Country", "City"], [], 0, customerActions);
     custData.forEach(cust => {
        table.addInternalRow([cust["email"], cust["first_name"], cust["last_name"],  
        cust["sub_type"], cust["phone"], cust["address"], cust["postal_code"], cust["country"], cust["city"]]);
     });
     table.createTable(true, fetchCustomers);
     tables["customers_table"] = table;
};

const editCustomer = (e) => {
    let currentRow = e.target.parentNode.parentNode;
    let currentCountry = currentRow.children[7];

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
    
    tables["customers_table"].editHTMLRow([undefined, "text", "text", "select", "text", "text", "text", "select", "select"],
     currentRow, (e, values) => {console.log(values);}, [{"options": [1,2]}, {"options": country_options, "onSelect": pickCountry, "enclose": [2]}, {"options": city_options}]);
};

let customerActions = {
    "edit": editCustomer
};


const pickCountry = (sels, new_selected_country) => {
    sels[0].clear();
    for (let city in globalAddressData[new_selected_country]) {
        // not setting selected
        sels[0].addOption(city, false);
    }

};