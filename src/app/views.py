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
    

def query(query, inferencing=False):
    headers = {'Accept': 'application/sparql-results+json'}    
    if not inferencing:
        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
    else :
        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query, 'reasoning': 'RDFS'})
    
    app.logger.debug(response.content)
    results = json.loads(response.content)

    # Flatten the results returned 
    flattened_results = dictize(results)    
    
    return flattened_results

@app.route('/data')
def data():
    app.logger.debug('Retrieving data necessary for rendering the forms')
    
    studies_query = render_template('queries/studies.sparql', PREFIXES=PREFIXES) 
    studies = query(studies_query)
    
    scales_query = render_template('queries/scales.sparql', PREFIXES=PREFIXES)
    scales = query(scales_query, inferencing=True)
    
    concepts_query = render_template('queries/concepts.sparql', PREFIXES=PREFIXES) 
    concepts = query(concepts_query)
    
    dimensions_query = render_template('queries/dimensions.sparql', PREFIXES=PREFIXES) 
    dimensions = query(dimensions_query)
    
    items_query = render_template('queries/items.sparql', PREFIXES=PREFIXES) 
    items = query(items_query)
    
    
    response = {
        'studies': studies,
        'scales': scales,
        'concepts': concepts,
        'dimensions': dimensions,
        'items': items
    }
    
    return jsonify(response)
    
    
    
@app.route('/scale/details', methods=['GET'])
def scale_details():
    uri = request.args.get('uri', False)
    
    print uri
    
    if uri:
        scale_details_query = render_template('queries/scale_details.sparql',PREFIXES=PREFIXES, uri=uri)
        scale_details = query(scale_details_query)
        
        scale_dimensions_query = render_template('queries/scale_dimensions.sparql',PREFIXES=PREFIXES, uri=uri)
        scale_dimensions = query(scale_dimensions_query)
        
        # return only the first result
        return jsonify({'scale': scale_details[0], 'dimensions': scale_dimensions})
        
    return jsonify({'results': 'error'})

@app.route('/study/details', methods=['GET'])
def study_details():
    uri = request.args.get('uri', False)
    
    print uri
    
    if uri:
        study_details_query = render_template('queries/study_details.sparql',PREFIXES=PREFIXES, uri=uri)
        study_details = query(study_details_query)
        
        # return json
        return jsonify(study_details[0])
        
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
            ( ?label ?score ) <http://jena.hpl.hp.com/ARQ/property#textMatch> ('{}' 0.1 50) .
        }}""".format(search)
    
    
    
    headers = {'Accept': 'application/sparql-results+json'}    
    response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
    print response.content
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
    

    
@app.route('/dimension/details', methods=['GET'])
def dimension_details():
    uri = request.args.get('uri', False)
    
    print uri
    
    if uri:
        app.logger.debug(uri)

        # Get the study details to fill the scale-related fields
        param="<"+uri+">"
        query = PREFIXES + """
        SELECT DISTINCT ?label ?type ?def ?alpha ?item ?itemlabel ?reversed
        WHERE {{
            {0} rdfs:label ?label .
            {0} rdf:type owsom:Dimension 
            OPTIONAL {{ {0} owsom:hasDefinition ?def }}
            OPTIONAL {{ {0} owsom:chronbachAlpha ?alpha }}
            OPTIONAL {{ {0} owsom:hasItem ?item }}
            OPTIONAL {{ ?item rdfs:label ?itemlabel }}
            OPTIONAL {{ ?item owsom:isReversed ?reversed }}
        }}""".format(param)

        headers = {'Accept': 'application/sparql-results+json'}    
        response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
        results = json.loads(response.content)

        # Flatten the results returned 
        dimension = dictize(results)
        
        # return json
        return jsonify({'results': dimension})
        
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