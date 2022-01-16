let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");


const rentalEndpoint = "/api/rental"
const fetchEndpoint = "/api/fetch"

let currentTab = "SHOWS";

window.onload = () => {

    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });


    tabbtns = document.getElementsByClassName("content-tab-btn");
    for (i = 0; i < tabbtns.length; ++i) {
        tabbtns[i].addEventListener('click', (e) => {
            tabSwitch(e);
        });
    }
    fetchShows();
}


let tables = {};

const tabSwitch = (e) => {
    document.getElementsByClassName("content-tab-btn-active")[0].classList.remove("content-tab-btn-active");
    e.target.classList.add("content-tab-btn-active");
    let container = document.getElementsByClassName("main-content")[0];
    container.innerHTML = "";
    switch (e.target.id) {
        case "films-tab-btn":
            currentTab = "FILMS";
            delete tables["shows_table"];
            fetchFilms();
            break;
        case "shows-tab-btn":
            currentTab = "SHOWS";
            delete tables["films_table"];
            fetchShows();
            break;
        default:
            return;
    }
    loadedAll = false;
};



const fetchShows = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+rentalEndpoint;
    let params ="?most_rented=s";

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
                if (tables["shows_table"] === undefined) {
                    createShowsTable(resp);
                } else {
                    resp.forEach(show => {
                        tables["shows_table"].appendRow([show[0], show[1]]);
                    });
                }
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};

const createShowsTable = (showData) => {
    if (showData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No show rentals found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Title"], [], 0);
     showData.forEach(show => {
        table.addInternalRow([show[0], show[1]]);
    });
     table.createTable(true, undefined, false);
     tables["shows_table"] = table;
};





const fetchFilms = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+rentalEndpoint;
    let params ="?most_rented=m";

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
                if (tables["films_table"] === undefined) {
                    createFilmsTable(resp);
                } else {
                    resp.forEach(film => {
                        tables["films_table"].appendRow([film[0], film[1]]);
                    });
                }
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
};

const createFilmsTable = (filmData) => {
    if (filmData.length == 0) {
        let nosh = document.createElement("h2");
        nosh.classList.add("no-entries-text");
        nosh.innerHTML = `No film rentals found`;
        document.getElementsByClassName("main-content")[0].appendChild(nosh);
        return;
    }
    let table = new TableCreator(document.getElementsByClassName("main-content")[0], ["ID", "Title"], [], 0);
     filmData.forEach(film => {
        table.addInternalRow([film[0], film[1]]);
    });
     table.createTable(true, undefined, false);
     tables["films_table"] = table;
};