from flask import Flask, render_template, url_for
from app import app


@app.route('/')
def index():
    app.logger.debug('Now on ' + url_for('index'))
    return render_template('index.html')
    
@app.route('/storage')
def storage():
    app.logger.debug('Now on ' + url_for('index'))
    return render_template('store.html')
    
@app.route('/store', methods=['POST'])
def store():
    app.logger.debug('Now on ' + url_for('store'))
    app.logger.debug('Got the arguments' + str(request.form))
    
    data = request.form['data'].encode('utf-8')
    
    url = OWSOM_REPO + "/statements"
    headers = {'content-type': 'application/x-turtle'}
    
    app.logger.debug('POST to {}'.format(url))
    response = requests.post(url, data=data, headers=headers)
    
    app.logger.debug(response.status_code)
    
    return str(response.status_code)
    
@app.route('/match/study/<search>')
def match_study(search):
    sparql = SPARQLWrapper('http://localhost:5820/owsom/query')
    
    query = """SELECT ?s ?p WHERE {{ ?s  }}"""
    
if __name__ == '__main__':
    app.debug = True
    app.run()