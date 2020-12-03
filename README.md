# VOEIS

## Overview
Visualization of the Online Encylodpedia of Integer Sequences (VOEIS) aims to visualize integer sequences for analaysis purposes. We use the [OEIS](https://oeis.org) database for our project.

## Online Version
The application is not currently hosted online (I accidentally ```git cleaned -df``` on the VM it was hosted and the nginx code was removed). 

## Local Version
The local version requires you to host the database locally. Because of this, we recommend running this on a machine with at least 6GB of RAM.

To run our project locally, be sure to first clone our repo:

```bash
git clone https://github.com/DavidJMiller/VOEIS
```

Then, move into the VOEIS directory and build the database (this step may take a few minutes):

```bash
cd VOEIS
python data/build_voeis_db.py
```

After the database is built, run our application:

```bash
python run.py
```

The application should be available on http://0.0.0.0:6060 or [localhost:6060](localhost:6060). If the above does not work, you can also run the application with:

```bash
flask run
```

The applicaiton will be available on http://0.0.0.0:5000 or [localhost:5000](localhost:5000).

## Requirements

The applicaiton requires [Flask](https://flask.palletsprojects.com/en/1.1.x/) and [PycURL](pycurl.io/docs/latest/index.html). The application also requires a working internet connection.
