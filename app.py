from flask import redirect, render_template, request
from src import app
from src.modules import API
from src.models.User import Customer, Employee, Administrator
from storage import dbconn, tokens

API.init_app(app)

user_type_to_page = {
    "main": {
        Customer: "main_customer.html", 
        Employee: "main_employee.html", 
        Administrator: "main_administrator.html"
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

    except KeyError:
        resp = redirect("/login")
        resp.delete_cookie("sessid")
        return resp

    return render_template(user_type_to_page["main"][type(user)], sub_type=request.cookies["sub_type"])

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

@app.route("/login")
def login():
    return render_template("login.html")


if __name__ == "__main__":
    app.run(host="localhost", port=5000)
