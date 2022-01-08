
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
                // success message
                // save token
                // save first name
                // redirect
            } else {
                makeToast("failure", "Incorrect credentials", 1500);
                // fail message
            }
        }
    }

};

const makeToast = (type, msg, duration) => {
    let body = document.getElementsByTagName("body")[0];
    let toast = document.createElement("div");
    toast.classList.add("toast");
    let icon = document.createElement("span");
    icon.classList.add("material-icons");
    switch (type) {
        case "success":
            toast.classList.add("success-toast");
            toast.innerHTML = msg;
            icon.innerHTML = "done";
            toast.appendChild(icon);
            break;
        case "failure":
            toast.classList.add("failure-toast");
            toast.innerHTML = msg;
            icon.innerHTML = "close";
            toast.appendChild(icon);
            break;
    }
    body.appendChild(toast);
    window.setTimeout(() => {
        toast.classList.add("toast-exit");
        window.setTimeout(() => {
            toast.remove();
        }, 500);
    }, duration);
};
