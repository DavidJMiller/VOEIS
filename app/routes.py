"""
Provides functions to handle routes for our web application.

VOEIS
Qianlang Chen
T 11/24/20
"""

from flask import jsonify, render_template, request
from app import app
import time

from data import voeis_db

print("Loading database...")
voeis_db.init()
print("The database has been successfully loaded!")

ALWAYS_RELOAD_APP_FILES = False


@app.route("/")
def root():
    update_time = f"?u={int(time.time())}" if ALWAYS_RELOAD_APP_FILES else ""
    return render_template("VOEIS.html", update_time=update_time)


@app.route("/get-number", methods=["POST"])
def get_number():
    num = int(request.get_data().decode("utf-8"))
    return jsonify(voeis_db.get_number(num))


@app.route("/get-sequence", methods=["POST"])
def get_sequence():
    a_num = request.get_data().decode("utf-8")
    return jsonify(voeis_db.get_sequence(a_num))


@app.route("/get-more-of-sequence", methods=["POST"])
def get_more_of_sequence():
    a_num = request.get_data().decode("utf-8")
    return jsonify(voeis_db.more_of_sequence(a_num))


@app.route("/search-sequence", methods=["POST"])
def search_sequence():
    query = request.get_data().decode("utf-8")
    return jsonify(voeis_db.search(query))


@app.route("/get-sloanes", methods=["POST"])
def get_sloanes():
    return jsonify(voeis_db.get_sloanes())
