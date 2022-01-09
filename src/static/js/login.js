
let hostname = window.location.href.split("/");
hostname = hostname.slice(0, hostname.length-1).join("/");

const loginEndpoint = "/api/login"

const enterPressOnInput = (e) => {
    if (e.key === "Enter") {
        submitLoginForm();
    }
}

window.onload = () => {
    let loginbtn = document.getElementById("login-btn");
    loginbtn.addEventListener("click", submitLoginForm);
    let emailForm = document.getElementById("email-input");
    let passwordForm = document.getElementById("password-input");
    emailForm.addEventListener("keypress", enterPressOnInput);
    passwordForm.addEventListener("keypress", enterPressOnInput);
};


const submitLoginForm = (e) => {
    let emailForm = document.getElementById("email-input");
    let passwordForm = document.getElementById("password-input");
    let req = new XMLHttpRequest();
    const url = hostname+loginEndpoint;
    req.open("POST", url);
    req.setRequestHeader("Authorization", "Basic " + window.btoa(emailForm.value + ":" + passwordForm.value));
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState == 4) {
            if (req.status == 200) {
                makeToast("success", "Successfully logged in", 1500);
                resp = JSON.parse(req.response);
                document.cookie = "sessid="+resp.token+"; SameSite=Lax";
                document.cookie = "first_name="+resp.first_name+"; SameSite=Lax";
                document.cookie = "last_name="+resp.last_name+"; SameSite=Lax";
                document.cookie = "type="+resp.type+"; SameSite=Lax";
                window.location.href="/main";
            } else {
                makeToast("failure", "Incorrect credentials", 1500);
            }
        }
    }

};