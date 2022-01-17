let activeToast = undefined;

class Selector {
    constructor(element, options, selected, onSelectedAction, defaultText) {
        this.element = element;
        this.options = [];
        this.onSelectedAction = onSelectedAction;
        this.defaultText = defaultText;
        this.selected = selected;
        
        let currentOption = 0;
        options.forEach(option => {
            this.addOption(option, selected == currentOption);
            ++currentOption;
        });
    }


    setText(text) {
        this.lastSetText = text;
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
        if (this.selected == -1 && this.lastSetText !== undefined) {
            return this.lastSetText;
        }
        return this.options[this.selected];
    }
    
}

const createSelector = (host_elem, options, default_idx, default_text, selectAction) => {
    let select = document.createElement("div");
    select.classList.add("select");
    select.setAttribute("data-selected", default_idx);
    select.setAttribute("onclick", `selectClick(this)`);

    let span = document.createElement("span");
    span.classList.add("selected-option-text");
    span.classList.add("select-option");
    let spanspan = document.createElement("span");
    spanspan.innerHTML = `${default_text}`;
    span.appendChild(spanspan);
    let menu = document.createElement("div");
    menu.classList.add("select-option-wrapper");
    menu.classList.add("invisible-select-menu");

    select.appendChild(span);
    select.appendChild(menu);

    host_elem.append(select);
    let sel = new Selector(select, options, default_idx, selectAction);
    if (default_text.length === 0) {
        sel.element.getElementsByClassName("selected-option-text")[0].innerHTML = `<span>&nbsp;</span>`;
    } else {
        sel.setText(default_text);
    }
    return sel;
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
    hideLoadMore();
}

const disableLoader = () => {
    let loader = document.getElementById("main-loader");
    loader.classList.remove("loader-visible");
    showLoadMore();
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


class TableCreator {
    constructor(host_elem, cols, rows, id_col, actions) {
        this.cols = cols;
        this.host_elem = host_elem;
        this.rows = rows;
        this.actions = actions;
        this.id_col = id_col;
        this.tableRoot = undefined;
        this.activeClose = false;
    }
    createTable(replace_host, loadMore, scrollable) {
        this.tableRoot = document.createElement("table");
        this.tableRoot.classList.add("data-table");
        if (scrollable) {
            this.tableRoot.classList.add("scrollable-table");
        }

        let headerRow = document.createElement("tr");
        this.cols.forEach(col => {
            let newHeader = document.createElement("th");
            newHeader.innerHTML = col;
            headerRow.appendChild(newHeader);
        });
        if (this.actions !== undefined) {
            let newHeader = document.createElement("th");
            newHeader.innerHTML = "Actions";
            headerRow.appendChild(newHeader);
        }
        
        this.tableRoot.appendChild(headerRow);

        this.rows.forEach(row => {
            let newtr = document.createElement("tr");
            row.forEach(cell => {
                let newtd = document.createElement("td");
                if (cell === null) {
                    cell = `NA`;
                } 
                newtd.innerHTML = cell
                newtr.appendChild(newtd);
            });
            if (this.actions !== undefined) {
                let actiontd = document.createElement("td");
                for (let action_name in this.actions) {
                    let actionspan = document.createElement("span");
                    actionspan.classList.add("material-icons");
                    actionspan.setAttribute("title", this.actions[action_name].desc);
                    actionspan.innerHTML = action_name;
                    actionspan.setAttribute("data-row-id", row[this.id_col]);
                    actionspan.addEventListener("click", this.actions[action_name].func);
                    actiontd.appendChild(actionspan);
                }
                newtr.append(actiontd);
            }
            this.tableRoot.appendChild(newtr);
        });

        if (replace_host) {
            this.host_elem.innerHTML = ``;
        }
        this.host_elem.appendChild(this.tableRoot);

        if (loadMore !== undefined) {
            let btn = document.createElement("button");
            btn.innerHTML = `Load More`;
            btn.id = "load-more-btn";
            btn.classList.add("load-more");
            btn.addEventListener("click", loadMore);
            this.host_elem.appendChild(btn);
        }
    }

    addInternalRow(rowData) {
        this.rows.push(rowData);
    }

    appendRow(row) {
        this.rows.push(row);
        let newtr = document.createElement("tr");
        row.forEach(cell => {
            let newtd = document.createElement("td");
            if (cell === null) {
                cell = `NA`;
            }
            newtd.innerHTML = cell
            newtr.appendChild(newtd);
        });
        if (this.actions !== undefined) {
            let actiontd = document.createElement("td");
            for (let action_name in this.actions) {
                let actionspan = document.createElement("span");
                actionspan.classList.add("material-icons");
                actionspan.innerHTML = action_name;
                actionspan.setAttribute("data-row-id", row[this.id_col]);
                actionspan.setAttribute("title", this.actions[action_name].desc);
                actionspan.addEventListener("click", this.actions[action_name].func);
                actiontd.appendChild(actionspan);
            }
            newtr.append(actiontd);
        }
        this.tableRoot.appendChild(newtr);
        return newtr;
    }

    replaceHTMLRow(rowData, htmlrow) {
        let tds = htmlrow.children;
        for (let i=0; i < rowData.length; ++i) {
            tds[i].innerHTML = `${rowData[i]}`;
        }
    }

    replaceActionsInHTMLRow(new_actions, htmlrow) {
        let actiontd = htmlrow.children[htmlrow.children.length-1];
        let row_id = actiontd.children[0].getAttribute("data-row-id")

        actiontd.innerHTML = ``;
        for (let action_name in new_actions) {
            let actionspan = document.createElement("span");
            actionspan.classList.add("material-icons");
            actionspan.innerHTML = action_name;
            actionspan.setAttribute("data-row-id", row_id);
            actionspan.setAttribute("title", new_actions[action_name].desc);
            actionspan.addEventListener("click", new_actions[action_name].func);
            actiontd.appendChild(actionspan);
        }
    }

    editHTMLRow(types, htmlrow, onSave, selectors, onClose, focusInput) {
        /*
        options: [],
        onSelect: action,
        enclose: []
        */
        if (this.activeClose) {
            return;
        }

        let tds = htmlrow.children;
        let oldrow = [];
        for (let i=0; i< tds.length; ++i) {
            oldrow.push(tds[i].innerHTML);
        }

        let inputs = {};
        let currentSelectors = [];
        let j = 0;
        for (let i=0; i < types.length; ++i) {
            if (types[i] === undefined) {
                continue;
            }
            let w = tds[i].offsetWidth;
            let col = this.cols[i].toLocaleLowerCase();
            if (types[i] == "text") {
                tds[i].innerHTML = `<input type="text" value="${tds[i].innerHTML}" style="max-width:${w}px" class="edit-row-input">`;
                inputs[col] = tds[i].children[0];
                if (focusInput) {
                    inputs[col].focus();
                    focusInput = false;
                }
            } else if (types[i] == "select") {
                let oldval = tds[i].innerHTML;
                tds[i].innerHTML= ``;
                inputs[col] = createSelector(tds[i], selectors[j].options, -1, `${oldval}`);
                currentSelectors.push(inputs[col]);
                j++;

                document.body.addEventListener("click", (e) => {
                    if (!inputs[col].element.contains(e.target)) {
                        let menu = inputs[col].element.getElementsByClassName("select-option-wrapper")[0];
                        menu.classList.add("invisible-select-menu");
                    }
                });
            }
        }


        for (let i=0; i < currentSelectors.length; ++i) {
            currentSelectors[i].onSelectedAction = (newSelected) => {
                if (selectors[i].onSelect !== undefined) {
                    selectors[i].onSelect(selectors[i].enclose.map(en => currentSelectors[en]), newSelected);
                }
            }
        }

        this.confirmHTMLRow(oldrow, tds, htmlrow, onSave, inputs, onClose);
    }

    confirmHTMLRow(oldrow, tds, htmlrow, onSave, inputs, onClose) {
        let actiontd = tds[tds.length-1];
        let row_id = actiontd.children[0].getAttribute("data-row-id");

        actiontd.innerHTML = ``;
        let done = document.createElement("span");
        done.classList.add("material-icons");
        done.innerHTML = `done`;
        done.setAttribute("data-row-id", row_id);
        done.addEventListener("click", (e) => {

            let values = []
            for (let i = 0; i < tds.length-1; ++i) {
                let col = this.cols[i].toLocaleLowerCase();
                if (inputs[col] === undefined) {
                    values.push(tds[i].innerHTML);
                } else {
                    if (inputs[col] instanceof Element) {
                        values.push(inputs[col].value);
                    } else if (inputs[col].constructor.name == "Selector") {
                        values.push(inputs[col].getSelected());
                    }
                }
            }

            onSave(e, values);
        });
        actiontd.appendChild(done);

        let cancel = document.createElement("span");
        cancel.classList.add("material-icons");
        cancel.innerHTML = `close`;
        cancel.setAttribute("data-row-id", row_id);
        const cancelAction = () => {

            if (onClose !== undefined) {
                onClose();
                this.activeClose = false;
                return;
            }

            this.replaceHTMLRow(oldrow.slice(0, oldrow.length-1), htmlrow);
            this.replaceActionsInHTMLRow(this.actions, htmlrow);
            this.activeClose = false;

        }
        this.activeClose = true;
        cancel.addEventListener("click",cancelAction);

        actiontd.appendChild(cancel);
    }

    getLastRow() {
        return this.rows[this.rows.length-1];
    }

}



createPopUp = (host_elem, ptitle, objToClear, keyToClear, for_id, capture, onClose) => {
    let popup = document.createElement("div");
    popup.classList.add("popup");
    popup.setAttribute("data-for-id", for_id);
    let x = document.createElement("span")
    x.classList.add("material-icons");
    x.classList.add("close");
    x.innerHTML = `close`;
    x.addEventListener("click", (e) => {
        closePopUp(e, objToClear, keyToClear);
    });
    popup.appendChild(x);
    let title = document.createElement("h1")
    title.innerHTML = `${ptitle}`;
    popup.appendChild(title);
    host_elem.insertBefore(popup, host_elem.firstChild, capture, onClose);
    return popup;
};

closePopUp = (p, objToClear, keyToClear, capture, onClose) => {
    /*
    {
        id,
        value (to be returned)
    }
    */
    if (capture !== undefined) {
        for (let item in capture) {
            let elem = document.getElementById(item);
            capture[item].value = elem.value;
        }
    }
    p.target.parentNode.remove();
    if (objToClear !== undefined) {
        delete objToClear[keyToClear];
    }
};

addFloatingButton = (host_elem, type, action, source) => {
    let btn = document.createElement("a");
    btn.classList.add("floating-button");
    btn.innerHTML = `<span class="material-icons">${type}</span>`
    btn.addEventListener("click", action);
    btn.setAttribute("data-active", "0");
    btn.setAttribute("data-source", source);
    host_elem.appendChild(btn);
    return btn;
}

hideLoadMore = () => {
    let loadmore = document.getElementById("load-more-btn");
    if (loadmore !== null) {
        loadmore.classList.add("hidden-element");
    }
}

showLoadMore = () => {
    let loadmore = document.getElementById("load-more-btn");
    if (loadmore !== null) {
        loadmore.classList.remove("hidden-element");
    }
}

replaceNA = (val) => {
    console.log(val);
    if (val === "NA") {
        console.log('returning null');
        return null;
    } else {
        return val
    }
}