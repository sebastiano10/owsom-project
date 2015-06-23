from app import ENDPOINT_URI
import networkx as nx
import requests
import json
from networkx.readwrite import json_graph



edges_query = """
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


    SELECT DISTINCT ?paper ?study ?scale ?dimension ?paper_label ?study_label ?scale_label ?dimension_label WHERE {
        GRAPH ?g {
            ?study  owsom:describedIn   ?paper .
            ?study  owsom:hasScale      ?scale .
            ?scale  owsom:hasDimension  ?dimension .
            OPTIONAL {
                ?paper dcterms:title    ?paper_label .
            }
            OPTIONAL {
                ?study rdfs:label    ?study_label .
            }
            OPTIONAL {
                ?scale rdfs:label    ?scale_label .
            }
            OPTIONAL {
                ?dimension rdfs:label    ?dimension_label .
            }
        }
    }
"""


def query():
    # This is old style, but leaving for backwards compatibility with earlier versions of Stardog
    QUERY_HEADERS = {'Accept': 'application/sparql-results+json'}

    result = requests.get(ENDPOINT_URI,
                          params={'query': edges_query},
                          headers=QUERY_HEADERS)

    results = json.loads(result.content)['results']['bindings']

    return results


def build_graph(results):
    g = nx.DiGraph()

    for r in results:
        for k, v in r.items():
            if v == 'tag:stardog:api:':
                # Skip the stardog specific stuff that we don't need
                continue
            elif k in ['paper', 'study', 'scale', 'dimension']:
                label_key = "{}_label".format(k)
                if label_key in r:
                    g.add_node(v, {'name': r[label_key], 'type': k})
                else:
                    g.add_node(v, {'name': v, 'type': k})

        print "Edge between {} and {}".format(r['paper'], r['study'])
        g.add_edge(r['paper'], r['study'])
        print "Edge between {} and {}".format(r['study'], r['scale'])
        g.add_edge(r['study'], r['scale'])
        print "Edge between {} and {}".format(r['scale'], r['dimension'])
        g.add_edge(r['scale'], r['dimension'])

    return g


def update(graph=None):
    print "Graph is: {}".format(graph)
    if graph is None:
        results = query()
        results = dictize(results)
    else:
        results = graph.query(edges_query)
        results = [r.asdict() for r in results]

    # results = query()
    # results = dictize(results)

    g = build_graph(results)

    data = json_graph.node_link_data(g)

    print data

    with open('graph.json', 'w') as f:
        json.dump(data, f)

    return data


def dictize(sparql_results):
    # If the results are a dict, just return the list of bindings
    if isinstance(sparql_results, dict):
        sparql_results = sparql_results['results']['bindings']

    results = []

    for r in sparql_results :
        result = {}
        for k,v in r.items():
            try :
                result[k] = v['value']
            except :
                print k, v

        results.append(result)


    return results
