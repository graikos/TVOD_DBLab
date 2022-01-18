from flask import redirect, render_template, request, redirect
from src import app
from src.modules import API
from src.models.User import Customer, Employee, Administrator
from storage import tokens
from PyQt5.QtCore import QUrl, Qt
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineProfile
import threading
import sys


API.init_app(app)

user_type_to_page = {
    "main": {
        Customer: "main_customer.html", 
        Employee: "all_customers.html", 
        Administrator: "all_customers.html"
    },
}

@app.route("/")
def index():
    return redirect("/login")

@app.route("/main")
def main():
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee) or isinstance(user, Administrator):
            return redirect("/customers")
        elif isinstance(user, Customer):
            pass
        else:
            raise ValueError

    except KeyError:
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    return render_template("main_customer.html", sub_type=request.cookies["sub_type"])

@app.route("/myaccount")
def my_account():
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if not isinstance(user, Customer):
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("customer_settings.html")


@app.route("/myrentals")
def my_rentals():
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if not isinstance(user, Customer):
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("customer_rentals.html")

@app.route("/customers")
def all_customers():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    return render_template("all_customers.html", user_type=user_type)

@app.route("/shows")
def all_shows():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_shows.html", user_type=user_type)


@app.route("/films")
def all_films():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_films.html", user_type=user_type)

@app.route("/actors")
def all_actors():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    return render_template("all_actors.html", user_type=user_type)

@app.route("/categories")
def all_categories():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_categories.html", user_type=user_type)

@app.route("/languages")
def all_languages():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_languages.html", user_type=user_type)


@app.route("/countries")
def all_countries():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_countries.html", user_type=user_type)

@app.route("/cities")
def all_cities():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_cities.html", user_type=user_type)

@app.route("/addresses")
def all_addresses():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_addresses.html", user_type=user_type)

@app.route("/mostrented")
def most_rented():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user,Employee):
            user_type = "Employee"
        elif isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("most_rented.html", user_type=user_type)


@app.route("/staff")
def all_accounts():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_accounts.html", user_type=user_type)


@app.route("/income")
def all_income():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("all_income.html", user_type=user_type)

@app.route("/prices")
def prices():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("prices.html", user_type=user_type)

@app.route("/logs")
def logs():
    user_type = ""
    try:
        token = request.cookies["sessid"]
        user = tokens[token]
        if isinstance(user, Administrator):
            user_type = "Administrator"
        else:
            raise ValueError

    except (KeyError, ValueError):
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    
    return render_template("logs.html", user_type=user_type)

@app.route("/login")
def login():
    return render_template("login.html")

def runServer():
    app.run(host="localhost", port=5000)


if __name__ == "__main__":
    serv = threading.Thread(target=runServer)
    serv.setDaemon(True)
    serv.start()
    qapp = QApplication(sys.argv)
    qapp.setApplicationDisplayName("TVOnDemand")
    web = QWebEngineView()
    web.page().profile().setHttpCacheType(QWebEngineProfile.HttpCacheType.NoCache)
    web.load(QUrl("http://localhost:5000"))
    window = QMainWindow()
    window.setFixedSize(1860, 933.75)
    window.setCentralWidget(web)
    window.show()
    

    sys.exit(qapp.exec_())

