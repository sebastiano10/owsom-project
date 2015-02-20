$(function(){
  // This is called when the page is fully loaded
  
  // Add a 'click handler' to the doi-button 
  $('#doi-button').on('click', function(){
    var doi = $('#doi-input').val();
    
    if(doi == ''){
      doi = '10.1037/rmh0000008';
    }
    
    console.log(doi);
    
    // TODO: Add some code here to check if the DOI starts with 'doi:' or 'http://dx.doi.org/' (should be removed)
    
    // First get the JSON description from the Crossref service (we'll worry about RDF later)
    $.getJSON('http://dx.doi.org/'+doi, function(data){
      console.log("Got a response!");
      console.log(data);
      
      // Add the publication to the HTML5 local storage, for future reference.
      $.localStorage.set('publication',data);
      
      // Show the publication in a table
      show_publication(data);
      
    }).fail(function(){
      console.log("Error: DOI does not exist");
      alert("DOI cannot be found (should not start with 'doi:' or 'http://dx.doi.org')");
    });
    
  });
  
  
});


function show_publication(publication){
  // Remove previously loaded publication details
  $("#publication-details").remove();
  
  var details_div = $('<div></div>');
  details_div.attr('id','publication-details');

  $.each(publication.author, function(index, item){
    details_div.append(item.family + ', '+item.given + ', ')
  });
  details_div.append('"' + publication.title + '"');
  details_div.append(' <i>' + publication['container-title'] + '</i>');
  details_div.append(' ('+ publication.issued['date-parts'][0] +')'); // not robust
  
  $('#publication-details-col').append(details_div);
  
}