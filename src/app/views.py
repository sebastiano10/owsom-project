from flask import Flask, render_template, url_for, jsonify, request
from SPARQLWrapper import SPARQLWrapper, JSON
from app import app
import requests
import json
from collections import defaultdict

from rdflib import Graph, Namespace, RDF, RDFS, OWL, URIRef, Literal, BNode, XSD


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
    
    papers_query = render_template('queries/papers.sparql', PREFIXES=PREFIXES) 
    papers = query(papers_query)
    
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
    
    analyses_query = render_template('queries/analyses.sparql', PREFIXES=PREFIXES) 
    analyses = query(analyses_query)
    
    
    response = {
        'papers': papers,
        'studies': studies,
        'scales': scales,
        'concepts': concepts,
        'dimensions': dimensions,
        'items': items,
        'analyses': analyses
    }
    
    return jsonify(response)
    
    
@app.route('/paper/details', methods=['GET'])
def paper_details():
    uri = request.args.get('uri', False)
    
    if uri:
        paper_studies_query = render_template('queries/paper_studies.sparql', PREFIXES=PREFIXES, uri=uri)
        paper_studies = query(paper_studies_query)
        
        return jsonify({'studies': paper_studies})
    
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
    
    
@app.route('/dimension/details', methods=['GET'])
def dimension_details():
    uri = request.args.get('uri', False)
    
    print uri
    
    if uri:
        dimension_details_query = render_template('queries/dimension_details.sparql',PREFIXES=PREFIXES, uri=uri)
        dimension_details = query(dimension_details_query)
        
        dimension = {'uri': uri, 'items': [], 'subdimensions': []}
        subdimensions = defaultdict(list)
        
        
        for entry in dimension_details :
            if 'reliability' in entry:
                dimension['reliability'] = entry['reliability']
            
            if 'item' in entry:
                item = {'uri': entry['item']}
                if 'factorloading' in entry:
                    item['factorloading'] = entry['factorloading']
                if 'reversed' in entry:
                    item['reversed'] = entry['reversed']
                
                dimension['items'].append(item)
            if 'subdimension' in entry :
                item = {'uri': entry['subitem']}
                if 'subfactorloading' in entry:
                    item['subfactorloading'] = entry['subfactorloading']
                if 'subreversed' in entry:
                    item['subreversed'] = entry['subreversed']
                if 'subreliability' in entry:
                    dimension['subreliability'] = entry['subreliability']
                    
                subdimensions[entry['subdimension']].append(item)
        
        dimension['subdimensions'] = [{'uri': key, 'items': value} for key, value in subdimensions.items()]
                
        print dimension
        # return json
        return jsonify({'dimensions': dimension})
        
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
    

    
@app.route('/save', methods=['POST'])
def save():
    data = request.get_json(force=True)
    
    g = Graph()
    
    OWSOM = Namespace('http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/')
    g.bind('owsom',OWSOM)
    
    
    pub_uri = URIRef(data['doi-input']['uri'])
    study_uri = URIRef(data['studyName']['uri'])
    scale_uri = URIRef(data['scaleName']['uri'])
    concept_uri = URIRef(data['concept']['uri'])
    
    # Publication
    g.add((pub_uri, RDF.type, OWSOM['Paper']))
    g.add((pub_uri, RDFS.label, Literal(data['doi-input']['label'])))
    
    # Study
    g.add((study_uri, RDF.type, OWSOM['Study']))
    g.add((study_uri, RDFS.label, Literal(data['studyName']['label'])))
    g.add((study_uri, OWSOM['describedIn'], pub_uri))
    
    # Study details
    g.add((study_uri, OWSOM['hasSampleSize'], Literal(data['sampleSize'], datatype=XSD['int'])))
    g.add((study_uri, OWSOM['femalePercentage'], Literal(data['femPercentage'])))
    g.add((study_uri, OWSOM['hasCountryOfConduct'], Literal(data['country'])))
    
    if data['factor-analysis-type'] != None :
        g.add((study_uri, OWSOM['hasFactorAnalysisType'], URIRef(data['factor-analysis-type']['uri'])))
    
    g.add((study_uri, OWSOM['hasMeanAge'], Literal(data['meanAge'], datatype=XSD['float'])))
    
    # Link the study to the scale
    g.add((study_uri, OWSOM['hasScale'], scale_uri))
    
    # Scale
    
    if data['measureType1']:
        g.add((scale_uri, RDF.type, OWSOM['LikertScale']))
    elif data['measureType2']:
        g.add((scale_uri, RDF.type, OWSOM['GuttmanScale']))
    elif data['measureType3']:
        g.add((scale_uri, RDF.type, OWSOM['SemanticDifferentialScale']))
    else :
        g.add((scale_uri, RDF.type, OWSOM['Scale']))
            
    g.add((scale_uri, OWSOM['hasConcept'], concept_uri))
    
    # Scale details
    g.add((scale_uri, OWSOM['hasLowerAnchor'], Literal(data['likertPointsInfo1'])))
    g.add((scale_uri, OWSOM['hasHigherAnchor'], Literal(data['likertPointsInfo2'])))
    
    g.add((scale_uri, OWSOM['hasPoints'], Literal(data['likertPointsAmount'], datatype=XSD['int'])))
    g.add((scale_uri, OWSOM['hasScaleReliability'], Literal(data['totalReliability'], datatype=XSD['float'])))

    if data['scaleType1']:
        g.add((scale_uri, OWSOM['hasOriginality'], OWSOM['Original']))
    elif data['scaleType2']:
        g.add((scale_uri, OWSOM['hasOriginality'], OWSOM['Revised']))
    elif data['scaleType3']:
        g.add((scale_uri, OWSOM['hasOriginality'], OWSOM['Brief']))
        
    # Dimensions
    for dim in data['dimensions']:
        dim_uri = URIRef(dim['dimension'])
        
        g.add((dim_uri, RDF.type, OWSOM['Dimension']))
        g.add((dim_uri, RDFS.label, Literal(dim['label'])))
        
        if not 'parent' in dim:
            g.add((scale_uri, OWSOM['hasDimension'], dim_uri))
        else :
            g.add((URIRef(dim['parent']), OWSOM['hasDimension'], dim_uri))
            
    for rel in data['reliabilities']:
        g.add((URIRef(rel['dimension']), OWSOM['chronbachAlpha'], Literal(rel['value'], datatype=XSD['float'])))
     
    # Items  
    for item in data['items'] :
        item_uri = URIRef(item['item'])
        dim_uri = URIRef(item['dimension'])
        
        g.add((item_uri, RDF.type, OWSOM['Item']))
        g.add((item_uri, RDFS.label, Literal(item['label'])))
        g.add((dim_uri, OWSOM['hasItem'], item_uri))
        
    for loading in data['loadings']:
        item_uri = URIRef(loading['item'])
        
        g.add((item_uri, OWSOM['hasFactorLoading'], Literal(loading['value'], datatype=XSD['float'])))
    
    for rev in data['reverseds']:
        item_uri = URIRef(rev['item'])
        
        g.add((item_uri, OWSOM['isReversed'], Literal(rev['value'], datatype=XSD['boolean'])))
        
        
    
    print g.serialize(format='turtle')
    
    
    return jsonify({'status': 'yay'})
    
    
    
    
    
    
    
# @app.route('/dimension/details', methods=['GET'])
# def dimension_details():
#     uri = request.args.get('uri', False)
#
#     print uri
#
#     if uri:
#         app.logger.debug(uri)
#
#         # Get the dimension details to fill the dimension and item fields
#         param="<"+uri+">"
#         query = PREFIXES + """
#         SELECT DISTINCT ?label ?type ?def ?alpha ?item ?factor ?itemlabel ?reversed
#         WHERE {{
#             {0} rdfs:label ?label .
#             {0} rdf:type owsom:Dimension
#             OPTIONAL {{ {0} owsom:hasDefinition ?def }}
#             OPTIONAL {{ {0} owsom:chronbachAlpha ?alpha }}
#             OPTIONAL {{ {0} owsom:hasItem ?item }}
#             OPTIONAL {{ ?item owsom:hasFactorLoading ?factor }}
#             OPTIONAL {{ ?item rdfs:label ?itemlabel }}
#             OPTIONAL {{ ?item owsom:isReversed ?reversed }}
#         }}""".format(param)
#
#         headers = {'Accept': 'application/sparql-results+json'}
#         response = requests.get(ENDPOINT_URI,headers=headers,params={'query': query})
#         results = json.loads(response.content)
#
#         # Flatten the results returned
#         dimension = dictize(results)
#
#         # return json
#         return jsonify({'results': dimension})
#
#     return jsonify({'results': 'error'})
   
# ------
# Legacy stuff: THIS IS NO LONGER CALLED
# ------ 
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