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
let itemnum = 0;


window.onload = () => {
    fetchLogs();
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

};



const fetchLogs = (checkPoint, refreshTable) => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let itemnum = batch;
    if (checkPoint && haveLoaded > batch) {
        itemnum = haveLoaded;
    }

    let params = "?start="+start+"&end="+itemnum+"&type=LOGS";

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
                if (tables["logs_table"] === undefined || refreshTable) {
                    if (refreshTable) {
                        haveLoaded = resp.length+1;
                    }
                    createLogsTable(resp);
                } else {
                    resp.forEach(log => {
                        tables["logs_table"].appendRow([log["log_id"], log["email"], log["user_type"], log["log_date"], log["success"], log["action_type"], log["on_table"]]);
                    });
                }
                if (resp.length < batch) {
                    document.getElementById("load-more-btn").remove();
                }
                start += itemnum;
            } else {
                makeToast("failure", "Error fetching logs", 1500);
            }
        }
    }
};
const createLogsTable = (logData) => {
    if (logData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No logs found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "E-mail", "User Type", "Date", "Success", "Action", "Table Affected"], [], 0, undefined);
    logData.forEach(log => {
        table.addInternalRow([log["log_id"], log["email"], log["user_type"], log["log_date"], log["success"], log["action_type"], log["on_table"]]);
    });
    table.createTable(true, fetchLogs, false);
    tables["logs_table"] = table;
};
