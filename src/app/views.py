from flask import Flask, render_template, url_for, jsonify
from SPARQLWrapper import SPARQLWrapper, JSON
from app import app
import requests
import json


PREFIXES = """        
        PREFIX owsom: <http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/> 
        PREFIX bibo: <http://purl.org/ontology/bibo/> 
        PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
        PREFIX dcterms: <http://purl.org/dc/terms/> 
        PREFIX prism: <http://prismstandard.org/namespaces/basic/2.1/> 
        PREFIX owl: <http://www.w3.org/2002/07/owl#> 
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        PREFIX xml: <http://www.w3.org/XML/1998/namespace> 
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
        """

ENDPOINT_URI = 'http://localhost:5820/owsom/query'

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
    
    
@app.route('/scale/details', methods=['GET'])
def scale_details():
    uri = request.args.get('uri', False)
    
    if uri:
        app.logger.debug(uri)
        
        # Do whatever SPARQLy thing you want
        # return json
        
        return jsonify({'results': 'You sent me {}'.format(uri)})
        
    return jsonify({'results': 'error'})

@app.route('/match/study/<search>')
def match_study(search):
    print "Searching for", search
    
    query = PREFIXES + """
        SELECT DISTINCT ?study ?label ?paper ?title ?score
        WHERE {{
            ?study rdfs:label ?label.
            ?study rdf:type owsom:Study .
            ?study owsom:describedIn ?paper .
            ?paper dcterms:title ?title .
            ( ?label ?score ) <http://jena.hpl.hp.com/ARQ/property#textMatch> '{}' .
        }}""".format(search)
        

    
    headers = {'Accept': 'application/sparql-results+json'}    
    response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
    results = json.loads(response.content)
    

    
    # Flatten the results returned 
    papers = dictize(results)
    papers_with_authors = []
    
    # For each paper, get its authors.
    for p in papers:
        paper = p
        name_query = PREFIXES + """
            SELECT DISTINCT ?uri ?name WHERE {{
                <{}>  dcterms:creator ?creator .
                ?creator foaf:name ?name .
            }}
        """.format(p['paper'])

        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': name_query})
        name_results = json.loads(response.content)
        names = dictize(name_results)

        paper['names'] = names
        papers_with_authors.append(paper)
    

    return jsonify({'result': papers_with_authors})
    
@app.route('/match/scale/<search>')
def match_scale(search):
    print "Searching for", search
    
    query = PREFIXES + """
        SELECT DISTINCT ?scale ?label ?concept ?paper ?title ?score
        WHERE {{
            ?scale rdfs:label ?label.
            ?scale rdf:type owsom:Scale .
            ?scale owsom:hasConcept ?concept .
            ?study owsom:hasScale ?scale .
            ?paper dcterms:title ?title .
            ( ?label ?score ) <http://jena.hpl.hp.com/ARQ/property#textMatch> '{}'.
            FILTER(regex(str(?paper), '^http://dx.doi.org','i'))
        }}""".format(search)
        

    
    headers = {'Accept': 'application/sparql-results+json'}    
    response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
    results = json.loads(response.content)
    
    
    # Flatten the results returned 
    papers = dictize(results)
    
    print results
    
    papers_with_authors = []
    
    # For each paper, get its authors.
    for p in papers:
        paper = p
        name_query = PREFIXES + """
            SELECT DISTINCT ?uri ?name WHERE {{
                <{}>  dcterms:creator ?creator .
                ?creator foaf:name ?name .
            }}
        """.format(p['paper'])

        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': name_query})
        name_results = json.loads(response.content)
        names = dictize(name_results)

        paper['names'] = names
        papers_with_authors.append(paper)
    

    return jsonify({'result': papers_with_authors})
    
    
def dictize(sparql_results):
    # If the results are a dict, just return the list of bindings
    if isinstance(sparql_results, dict):
        sparql_results = sparql_results['results']['bindings']
    
    results = []
    for r in sparql_results :
        result = {}
        for k,v in r.items():
            result[k] = v['value']
        
        results.append(result)
        
    return results
    
if __name__ == '__main__':
    app.debug = True
    app.run()