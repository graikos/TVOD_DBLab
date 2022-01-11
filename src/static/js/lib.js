let activeToast = undefined;

class Selector {
    constructor(element, options, selected, onSelectedAction, defaultText) {
        this.element = element;
        this.options = [];
        this.onSelectedAction = onSelectedAction;
        this.defaultText = defaultText;
        
        let currentOption = 0;
        for (let option in options) {
            this.addOption(option, selected == currentOption);
            ++currentOption;
        }
    }

    setText(text) {
        this.element.getElementsByClassName("selected-option-text")[0].innerHTML = `<span>${text}</span>`;
    }

    addOption(text, select) {
        let optionspan = document.createElement("span");
        let textspan = document.createElement("span");
        textspan.innerHTML = text;
        optionspan.classList.add("select-option")
        optionspan.setAttribute("data-option-index", this.options.length);
        let currentidx = this.options.length;
        optionspan.addEventListener("click", (e) => {
            this.selectOption(currentidx);
        });
        optionspan.appendChild(textspan);
        let wrapper = this.element.getElementsByClassName("select-option-wrapper")[0];
        wrapper.appendChild(optionspan);

        this.options.push(text);
        if (select) {
            this.selected = this.options.length - 1;
            this.selectOption(this.selected);
        }
    }

    selectOption(optionidx) {
        if (this.selected == optionidx) {
            return;
        }
        let selectedText = this.element.getElementsByClassName("selected-option-text")[0];

        let htmloptions = this.element.getElementsByClassName("select-option-wrapper")[0].children;
        if (this.selected >= 0) {
            htmloptions[this.selected].classList.remove("active-option");
        }
        htmloptions[optionidx].classList.add("active-option");

        selectedText.innerHTML = `<span>${this.options[optionidx]}</span>`;
        this.element.setAttribute("data-selected", optionidx);

        this.selected = optionidx;

        if (this.onSelectedAction === undefined) {
            return;
        }
        this.onSelectedAction(this.options[optionidx]);
    }

    clear() {
        this.options = [];
        this.selected = -1;
        this.element.setAttribute("data-selected", "");
        if (this.defaultText !== undefined) {
            this.setText(this.defaultText);
        } else {
            this.element.getElementsByClassName("selected-option-text")[0].innerHTML = `<span>&nbsp;</span>`;
        }
        this.element.getElementsByClassName("select-option-wrapper")[0].innerHTML = ``;
    }

    getSelected() {
        return this.options[this.selected];
    }
    
}


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
    if (activeToast != undefined) {
        activeToast.remove();
    }
    body.appendChild(toast);
    activeToast = toast;
    window.setTimeout(() => {
        toast.classList.add("toast-exit");
        window.setTimeout(() => {
            toast.remove();
        }, 500);
    }, duration);
};

const enableLoader = () => {
    let loader = document.getElementById("main-loader");
    loader.classList.add("loader-visible");
}

const disableLoader = () => {
    let loader = document.getElementById("main-loader");
    loader.classList.remove("loader-visible");
}

const selectClick = (e) =>  {
    let menu = e.getElementsByClassName("select-option-wrapper")[0];
    menu.classList.toggle("invisible-select-menu");
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

const deleteAllCookies = () => {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}