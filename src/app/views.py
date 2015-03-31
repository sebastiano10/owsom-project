from flask import Flask, render_template, url_for, jsonify, request
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
    
    print uri
    
    if uri:
        app.logger.debug(uri)

        # Get the scale details to fill the scale-related fields
        param="<"+uri+">"
        query = PREFIXES + """
        SELECT DISTINCT ?label ?originality ?concept ?definition ?type ?scalePoints ?lowerAnchor ?higherAnchor ?dimension ?dimension_label ?reliability
        WHERE {{
            {0} rdfs:label ?label .
            OPTIONAL {{ {0} owsom:hasOriginality ?originality }}
            OPTIONAL {{ {0} owsom:hasConcept ?concept }}
            OPTIONAL {{ {0} owsom:hasDefinition ?definition }}
            OPTIONAL {{ {0} rdf:type ?type }}
            OPTIONAL {{ {0} owsom:hasPoints ?scalePoints }}
            OPTIONAL {{ {0} owsom:hasLowerAnchor ?lowerAnchor }}
            OPTIONAL {{ {0} owsom:hasHigherAnchor ?higherAnchor }}
            OPTIONAL {{ {0} owsom:hasDimension ?dimension }}
            OPTIONAL {{ ?dimension rdfs:label ?dimension_label }}
            OPTIONAL {{ {0} owsom:hasScaleReliability ?reliability }}
        }}""".format(param)
        
        headers = {'Accept': 'application/sparql-results+json'}    
        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
        results = json.loads(response.content)

        # Flatten the results returned 
        scaleDetails = dictize(results)
        
        # return json
        return jsonify({'results': scaleDetails})
        
    return jsonify({'results': 'error'})

@app.route('/match/study/<search>')
def match_study(search):
    print "Searching for", search
    
    query = PREFIXES + """
        SELECT DISTINCT ?study ?label ?paper ?title ?country ?size ?analysis ?score
        WHERE {{
            ?study rdfs:label ?label.
            ?study rdf:type owsom:Study .
            ?study owsom:describedIn ?paper .
            ?paper dcterms:title ?title 
            OPTIONAL {{ ?study owsom:hasCountryOfConduct ?country }}
            OPTIONAL {{ ?study owsom:hasSampleSize ?size }}
            OPTIONAL {{ ?study owsom:hasFactorAnalysisType ?analysis }}
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
    
@app.route('/study/details', methods=['GET'])
def study_details():
    uri = request.args.get('uri', False)
    
    print uri
    
    if uri:
        app.logger.debug(uri)

        # Get the study details to fill the scale-related fields
        param="<"+uri+">"
        query = PREFIXES + """
        SELECT DISTINCT ?label ?type ?paper ?def ?country ?size ?analysis ?age ?female
        WHERE {{
            {0} rdfs:label ?label .
            {0} rdf:type owsom:Study .
            {0} owsom:describedIn ?paper 
            OPTIONAL {{ {0} owsom:hasDefinition ?def }}
            OPTIONAL {{ {0} owsom:hasCountryOfConduct ?country }}
            OPTIONAL {{ {0} owsom:hasSampleSize ?size }}
            OPTIONAL {{ {0} owsom:hasFactorAnalysisType ?analysis }}
            OPTIONAL {{ {0} owsom:hasMeanAge ?age }}
            OPTIONAL {{ {0} owsom:femalePercentage ?female }}
        }}""".format(param)

        headers = {'Accept': 'application/sparql-results+json'}    
        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
        results = json.loads(response.content)

        # Flatten the results returned 
        studyDetails = dictize(results)
        
        # return json
        return jsonify({'results': studyDetails})
        
    return jsonify({'results': 'error'})
    
@app.route('/match/scale/<search>')
def match_scale(search):
    print "Searching for", search
    
    # LikertScale needs to be adjusted when other scale types are implemented
    query = PREFIXES + """
        SELECT DISTINCT ?scale ?label ?score
        WHERE {{
            ?scale rdfs:label ?label.
            ?scale rdf:type owsom:LikertScale .
            ( ?label ?score ) <http://jena.hpl.hp.com/ARQ/property#textMatch> '{}'.
        }}""".format(search)
        
        
        
    headers = {'Accept': 'application/sparql-results+json'}    
    response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
    results = json.loads(response.content)
    
    print results
    
    # Flatten the results returned 
    scales = dictize(results)
    
    result = {'result': scales}
    print result 
    return jsonify(result)
    
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