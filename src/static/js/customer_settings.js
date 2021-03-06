let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");
const profileEndpoint = "/api/profile";
const addressEndpoint = "/api/address";
const subscriptionEndpoint = "/api/subscription";

let dropdown_IDS = ["country-select", "city-select", "sub-type-select"];
let profileData = {};
let globalAddressData = {};
let selectors = {}

window.onload = () => {
    dropdown_IDS.forEach((selector_id) => {
        let selector = document.getElementById(selector_id);
        selectors[selector_id] = new Selector(selector, [], -1, clears[selector_id]);
    });

    document.getElementById("log-out").addEventListener('click', () => {
        deleteAllCookies();
        window.location.href="/login";
    });

    let selector = document.getElementById("sub-type-select");
    selectors["sub-type-select"] = new Selector(selector, [], -1);

    document.body.addEventListener('click', (e) => { 
        dropdown_IDS.forEach((selector_id) => {
            let selector = document.getElementById(selector_id);
            if (!selector.contains(e.target)) {
                let menu = selector.getElementsByClassName("select-option-wrapper")[0];
                menu.classList.add("invisible-select-menu");
            }
        });
    });


    fetchUserData();
};


const fetchUserData = () => {
    let token = getCookie("sessid");
    
    let req = new XMLHttpRequest();
    let url = hostname+profileEndpoint;
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
                profileData = resp;
                insertProfileData(resp);
            } else {
                makeToast("failure", "Error fetching profile data", 1000);
            }
            fetchAddressData();
        }
    };
};

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
                initializeAddressData(resp);
            } else {
                makeToast("failure", "Error fetching address data", 1000);
            }
            fetchSubData();
        }
    };
}

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
                    selectors["sub-type-select"].addOption(
                        subtype[0].charAt(0) + subtype[0].slice(1).toLowerCase(), !subtype[0].toLowerCase().localeCompare(profileData.sub_type.toLowerCase())
                    );
                });
                
            } else {
                makeToast("failure", "Error fetching subscription data", 1000);
            }
        }
    };
};;

const insertProfileData = (profdata) => {
    console.log(profdata);
    let first_name_field = document.getElementById("first-name-input");
    let last_name_field = document.getElementById("last-name-input");
    let email_field = document.getElementById("email-input");
    let address_field = document.getElementById("address-input");
    let district_field = document.getElementById("district-input");
    let phone_field = document.getElementById("phone-input");
    let postal_code_field = document.getElementById("postal-code-input");

    first_name_field.value = profdata.first_name;
    last_name_field.value = profdata.last_name;
    email_field.value = profdata.email;
    address_field.value = profdata.address;
    district_field.value = profdata.district;
    phone_field.value = profdata.phone;
    postal_code_field.value = profdata.postal_code;


    selectors["country-select"].setText(profdata.country);
    selectors["city-select"].setText(profdata.city);
    selectors["sub-type-select"].setText(profdata.sub_type.charAt(0) + profdata.sub_type.slice(1).toLowerCase());

    document.getElementsByClassName("profile-form")[0].classList.add("profile-form-visible");
};

const initializeAddressData = (addrData) => {
    for (let country in addrData) {
        selectors["country-select"].addOption(country, country==profileData.country);
        if (profileData.country != country) {
            continue;
        }
        for (let city in addrData[country]) {
            selectors["city-select"].addOption(city, city==profileData.city);
            if (profileData.city != city) {
                continue;
            }
        }
    }
    
};

const clearSelectors = (to_clear) => {
    to_clear.forEach(selector_id => {
        selectors[selector_id].clear();
    });
};

const pickCountry = (new_selected_country) => {
    clearSelectors(["city-select"]);
    for (let city in globalAddressData[new_selected_country]) {
        selectors["city-select"].addOption(city, city==profileData.city);
    }

};



let clears = {
    "country-select": pickCountry
}

const submitData = (e) => {
    let first_name = document.getElementById("first-name-input").value;
    let last_name = document.getElementById("last-name-input").value;

    let phone = parseInt(document.getElementById("phone-input").value);
    if (!Number.isInteger(phone)) {
        makeToast("failure", "Phone number not valid", 1000);
        return;
    }
    let postal_code  = parseInt(document.getElementById("postal-code-input").value);
    if (!Number.isInteger(postal_code)) {
        makeToast("failure", "Postal code not vaild", 1000);
        return;
    }

    let data = `{
        "for_user": "${document.getElementById("email-input").value}",
        "first_name": "${first_name}",
        "last_name": "${last_name}",
        "country": "${selectors["country-select"].getSelected()}",
        "city": "${selectors["city-select"].getSelected()}",
        "district": "${document.getElementById("district-input").value}",
        "phone": "${phone}",
        "postal_code": "${postal_code}",
        "address": "${document.getElementById("address-input").value}",
        "sub_type": "${selectors["sub-type-select"].getSelected()}"
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
                document.cookie = `first_name=${first_name}`;
                document.cookie = `last_name=${last_name}`;
                document.cookie = `sub_type=${selectors["sub-type-select"].getSelected().toUpperCase()}`;
                makeToast("success", "Successfully updated profile", 1000);
            } else {
                makeToast("failure", "Error updating profile", 1000);
            }
        }
    };
    
}