
let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");

const fetchEndpoint = "/api/fetch"
let numberOfEntries = 0;
let batch = 24;
let loadedAll = false;
let currentTab = undefined;


window.onload = () => {
    tabbtns = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tabbtns.length; ++i) {
        tabbtns[i].addEventListener('click', (e) => {
            tabSwitch(e);
        });
    }
    let sub_type = getCookie("sub_type");
    if (sub_type == "BOTH") {
        currentTab = "SHOWS";
    }
    else {
        currentTab = sub_type;
    }
    fetchData();
};

const tabSwitch = (e) => {
    document.getElementsByClassName("tab-btn-active")[0].classList.remove("tab-btn-active");
    e.target.classList.add("tab-btn-active");
    let container = document.getElementById("content-container");
    container.innerHTML = "";
    numberOfEntries = 0;
    switch (e.target.id) {
        case "films-tab-btn":
            currentTab = "FILMS";
            break;
        case "shows-tab-btn":
            currentTab = "SHOWS";
            break;
        case "categories-tab-btn":
            break;
        case "search-tab-btn":
            break;
        default:
            return;
    }
    currentData = {};
    fetchData();
};

window.addEventListener("scroll", () => {
    const winscroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (winscroll == height) {
        fetchData();
    }
});

let currentData = {}

const fetchData = () => {
    if (loadedAll) {
        return;
    }
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+fetchEndpoint;
    let params = "?start="+numberOfEntries+"&end="+batch+"&type=" + currentTab;

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
                if (resp.length == 0) {
                    loadedAll = true;
                    return;
                }
                resp.forEach(entry => {
                    if (currentTab == "FILMS") {
                        addFilmCard(entry);
                        currentData[entry.film_id] = entry;
                    } else if (currentTab == "SHOWS") {
                        addShowCard(entry)
                        currentData[entry.show_id] = entry;
                    }
                });
                numberOfEntries += resp.length;
            } else {
                makeToast("failure", "Error fetching data", 1500);
            }
        }
    }
    

};

const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const addFilmCard = (filmdata) => {
    let contentView = document.getElementById("content-container");
    temphtml = `
        <div class="content-card">
            <div class="card-text-wrapper">
                <div class="card-title-wrapper">
                    <span class="card-title">${filmdata.title}</span>
                    <span class="card-seasons">${filmdata["length"]} min</span><br>
                    <span class="card-release-year">${filmdata.release_year}</span>
                </div>
                <div class="card-tag-wrapper">
                    <div class="card-tags">
                        <span class="card-tag card-tag-rating">${filmdata.rating}</span>`;


    filmdata.categories.forEach(element => {
        temphtml += `<span class="card-tag">${element}</span>`
    });
    
    temphtml += `
                    </div>
                </div>
                <div class="card-details-wrapper">
                    <p class="card-description">${filmdata.description}</p>
                    <a class="card-cta-btn" data-entry-id=${filmdata.film_id}>Rent</a>
                </div>
            </div>
        </div>
    `;   
    contentView.innerHTML += temphtml;
}

const addShowCard = (showdata) => {
    let contentView = document.getElementById("content-container");
    temphtml = `
        <div class="content-card">
            <div class="card-text-wrapper">
                <div class="card-title-wrapper">
                    <span class="card-title">${showdata.title}</span>
                    <span class="card-seasons">${showdata.seasons.length} seasons</span><br>
                    <span class="card-release-year">${showdata.release_year}</span>
                </div>
                <div class="card-tag-wrapper">
                    <div class="card-tags">
                        <span class="card-tag card-tag-rating">${showdata.rating}</span>`;


    showdata.categories.forEach(element => {
        temphtml += `<span class="card-tag">${element}</span>`
    });
    
    temphtml += `
                    </div>
                </div>
                <div class="card-details-wrapper">
                    <p class="card-description">${showdata.description}</p>
                    <a class="card-cta-btn" data-entry-id=${showdata.show_id}>Rent</a>
                </div>
            </div>
        </div>
    `;   
    contentView.innerHTML += temphtml;
}