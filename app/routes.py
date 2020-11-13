"""
Provides functions to handle routes for our web application.

VOEIS
Qianlang Chen
F 11/06/20
"""

from flask import jsonify, render_template, request
from app import app

from data import voeis_db

print("Loading database...")
voeis_db.init()
print("The database has been successfully loaded!")


@app.route("/")
def root():
    # return render_template("ajax_demo.html")
    # return render_template("root.html")
    return render_template("VOEIS.html")


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
    return str(voeis_db.get_sloanes())
