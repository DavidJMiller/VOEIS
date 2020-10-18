from flask import render_template
from app import app

@app.route('/')
@app.route('/index')
def index():
    user = {'username':'Miguel'}
    posts = [
        {
            'author': {'username':'John'},
            'body':'Hello !!'
        },
        {
            'author': {'username':'Jacob'},
            'body':'Nice to meet you !!'
        }
    ]
    return render_template('index.html', title='HOME', user=user, posts=posts)
