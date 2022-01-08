from flask import redirect, render_template
from src import app
from src.modules import API
from storage import dbconn

API.init_app(app)

@app.route("/")
def index():
    return redirect("/login")

@app.route("/login")
def login():
    return render_template("login.html")


if __name__ == "__main__":
    app.run(host="localhost", port=5000)
