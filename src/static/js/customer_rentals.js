let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");
const rentalsEndpoint = "/api/rental"

window.onload = () => {
    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    fetchRentals();
};

/*
for_user : email
*/

let tables = {};

const fetchRentals = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+rentalsEndpoint;
    let params = "?for_user="+getCookie("email");
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
        document.getElementsByClassName("main-content")[0].appendChild(norentals);
        return;
    }
    table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Date", "Amount", "Type", "Title", "Season Number",
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
     table.createTable(true);
     tables["rentals_table"] = table;
};