$(function(){
  // This is called when the page is fully loaded
  
  // Add a 'change handler' to the doi-input 
  $('#doi-input').on('change', function(){
    var doi = $('#doi-input').val();
    
    $('#publication-details-col').hide();
    
    // Just to have something to query
    if(doi == ''){
      doi = '10.1037/rmh0000008';
    }
    
    console.log(doi);
    
    // Check if the DOI starts with 'doi:' or 'http://dx.doi.org/' (should be removed)
    if(doi.indexOf("doi") !=-1) {
      doi = doi.slice(4,doi.length);
      console.log(doi);
    } else if(doi.indexOf("http://dx.doi.org/") != -1) {
      doi = doi.slice(18,doi.length);
      console.log(doi);
    }

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
  
  $('#studyName').selectize({
    valueField: 'study',
    labelField: 'label',
    searchField: 'label',
    create: false,
    maxItems: 1,
    render: {
        option: function(item, escape) {
            return '<div>' +
                '<span class="title">' +
                    escape(item.label)
                '</span>' +
                '<span class="uri">' + escape(item.study) + '</span>' +
                '<ul class="meta">' +
                  item.title 
                '</ul>' +
            '</div>';
        }
    },
    score: function(search) {
      var score = this.getScoreFunction(search);
      return function(item) {
        return item.score;
      };
    },
    load: function(query, callback) {
        if (!query.length) return callback();
        $.ajax({
            url: '/match/study/' + encodeURIComponent(query),
            type: 'GET',
            error: function() {
              console.log('error')
              callback();
            },
            success: function(res) {
              console.log(res)
              callback(res['result']);
            }
        });
    },
    onChange: function(value){
      if (!value.length) return ;
      
      console.log('Selected: ' + value);

      // Get study details
      $.get('/study/details', {'uri': value}, function(data){
        console.log(data);
		
  	    // fill sample size field
  	    $("#sampleSize").val(data.results[0].size);
  
        // make a seperate query for female participants and mean age?
  
  	    // fill country of conduct field
  	    $("#country").val(data.results[0].country);
      });
	  
	}  
  });
  
  $('#scaleName').selectize({
    valueField: 'scale',
    labelField: 'label',
    searchField: 'label',
    create: false,
    maxItems: 1,
    render: {
        option: function(item, escape) {
            return '<div>' +
                '<span class="title">' +
                    item.label
                '</span>' +
                '<span class="description">' + item.study + '</span>' +
                '<ul class="meta"><li>' +
                  item.title 
                '</li></ul>' +
            '</div>';
        }
    },
    score: function(search) {
      var score = this.getScoreFunction(search);
      return function(item) {
        return item.score;
      };
    },
    load: function(query, callback) {
        if (!query.length) return callback();
        $.ajax({
            url: '/match/scale/' + encodeURIComponent(query),
            type: 'GET',
            error: function() {
              console.log('error')
              callback();
            },
            success: function(res) {
              console.log(res)
              callback(res['result']);
            }
        });
    },
    onChange: function(value){
      if (!value.length) return ;
      
      console.log('Selected: ' + value);
      console.log('Retrieving details for the scale');

      // Get scale details
      $.get('/scale/details', {'uri': value}, function(data){
        console.log(data);
		  
		  // fill scale type field
		  if (data.results[0].originality = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/Original')
			  $("#scaleType1").prop("checked", true);
		  else if (data.results[0].originality = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/Revised')
			  $("#scaleType2").prop("checked", true);
		  else 
			  $("#scaleType3").prop("checked", true);
		  
		  // fill scale measure type field
		  if (data.results[0].type = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/LikertScale')
			  $("#measureType1").prop("checked", true);
		  else if(data.results[0].type = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/GuttmanScale')
			  $("#measureType2").prop("checked", true);
		  else if(data.results[0].type = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/SemanticDifferentialScale')
			  $("#measureType3").prop("checked", true);
		  else
			  $("#measureType4").prop("checked", true);
		  
		  // fill concept field
		  $("#concept").val(data.results[0].concept);
		  
		  // fill concept definition field
		  $("#conceptDef").val(data.results[0].definition);
		  
		  // fill likert scale points field
		  $("#likertPointsAmount").val(data.results[0].scalePoints);
		  
		  // fill anchors for likert scale
		  $("#likertPointsInfo1").val(data.results[0].lowerAnchor);
		  $("#likertPointsInfo2").val(data.results[0].higherAnchor);
		  
		  // fill dimensions
		  var index;
		  for(index=0; index < data.results.length; ++index) {
			  // better query dimension seperately to get the dimension label
			  $("#dimensions1").prop("checked", true);
			  document.getElementById("subscales").value = data.results.length;
        // TODO: Now adding the dimension_label, but we should keep the uri itself as well!
			  document.getElementById("subscale["+ index +"]").value = data.results[index].dimension_label;
		  }
		  
  	   // fill scale reliability
		$.get('/scale/reliability', {'uri': value}, function(data){
			// a try-catch here would be nicer to avoid the "TypeError" when there is no reliability
			if(data.results[0].reliability == null) {
				console.log('no reliability available for this scale')
			} else {
				var reliability = data.results[0].reliability;
				
				if(reliability.indexOf("0.") !=-1) {
		     	 reliability = reliability.slice(1,reliability.length);
	    	  		$("#totalReliability").val(reliability);
				}
			}	
  	   });	
  		
   });
	}
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
  $('#publication-details-col').show();
  
}