
let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");


const rentalEndpoint = "/api/rental"
const fetchEndpoint = "/api/fetch"

const months = [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let currentTab = "SHOWS";

window.onload = () => {

    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });
    fetchIncome();
}


let tables = {};

const fetchIncome = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+rentalEndpoint;
    let params ="?income=0";

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
                if (tables["income_table"] === undefined) {
                    createIncomeTable(resp);
                } else {
                    resp.forEach(inc => {
                        tables["income_table"].appendRow([inc[0], months[inc[1]], "$"+inc[2]]);
                    });
                }
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};

const createIncomeTable = (incData) => {
    if (incData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No income found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["Year", "Month", "Income"], [], 0);
    incData.forEach(inc => {
        table.addInternalRow([inc[0], months[inc[1]], "$"+inc[2]]);
    });
    table.createTable(true, undefined, false);
    tables["income_table"] = table;
};


