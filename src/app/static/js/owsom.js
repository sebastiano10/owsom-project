var concepts;
var studies;
var scales;
var dimensions;
var items;


$(function(){
  // This is called when the page is fully loaded
  $('#study-details').hide();
  $('#scale-details').hide();
  
  
  // Retrieve the data for filling in the forms
  $.get('/data', function(data){
    concepts = data.concepts;
    studies = data.studies;
    scales = data.scales;
    dimensions = data.dimensions;
    items = data.items;
    
    
    $('#studyName').selectize({
      valueField: 'study',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: studies,
      create: function(input){
        var study = {
          label: input,
          study: 'http://example.com/study/'+input
        };
        studies.push(study);
        return study;
      },
      onChange: function(value){
        console.log('Selected study value: ' + value);
        $('.data.secondary').val('');
        $("input[type='radio']").removeAttr('checked');
        get_study_details(value);
        $('#study-details').show();
      }
    });
    
    $('#toggle-study-details').on('click',function(){
      $('#study-details').toggle();
    });
    
    $('#scaleName').selectize({
      valueField: 'scale',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: scales,
      create: function(input){
        var scale = {
          label: input,
          study: 'http://example.com/scale/'+input
        };
        scales.push(scale);
        return scale;
      },
      onChange: function(value){
        console.log('Selected scale value: ' + value);
        $('.data.secondary').val('');
        $("input[type='radio']").removeAttr('checked');
        get_scale_details(value);
        $('#scale-details').show();
      }
    });
    
    $('#toggle-scale-details').on('click',function(){
      $('#scale-details').toggle();
    });
    
    
    $('#add-dimension').on('click',function(){
      add_dimension($('#dimension-list', null));
    });
    
    
  });
  
  
  function generateUUID(){
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
  };
  
  function add_dimension(parent, parent_uri){
    
    uri = 'http://example.com/dimension/' + generateUUID();
    
    var dimli = $('<li></li>');
    dimli.addClass('list-group-item');    
    dimli.prop('dimension',uri);
    
    
    var dimdiv = $('<div></div>');
    dimdiv.addClass('form-inline');
    
    var diminputgroup = $('<div></div>');
    diminputgroup.addClass('form-group');
    var diminputlabel = $('<label>Dimension&nbsp;</label><br/>');
    var diminput = $('<input type="text" style="width: 300px;" class="form-control input data secondary dimension" id="subscale[0]" placeholder="Please enter a dimension">');
    
    diminput.prop('id',uri);
    
    if (parent_uri != null){
      diminput.prop('parent',parent_uri);
    }
    
    var dimreliabilitygroup = $('<div></div>');
    dimreliabilitygroup.addClass('form-group');
    var dimreliabilitylabel = $('<label>Reliability&nbsp;</label><br/>');
    var dimreliability = $('<input type="text" style="width: 100px" class="form-control input-sm data secondary dimension" name="dimension" placeholder="Reliability">');
    dimreliability.prop('dimension', uri);
    
    var subdimbtn = $('<span class="badge">Add Sub-dimension</span>');
    var itembtn = $('<span class="badge">Add Item</div>');
    var removebtn = $('<span class="badge"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></div>');
    
    var subdimul = $('<ul></ul>');
    subdimul.addClass('list-group');

    var itemul = $('<ul></ul>');
    itemul.addClass('list-group');
    
    
    subdimbtn.on('click', function(){
      add_dimension($(this).parent(), $(this).parent().prop('dimension'));
      
      // var subdimli = $('<li><label>Sub-Dimension<label></li>');
      // subdimli.addClass('list-group-item');
      // var subdimtext = $('<input type="text" style="width: 300px;" class="form-control data secondary dimension" id="subscale[0]" placeholder="Please enter a sub dimension">');
      // subdimli.append(subdimtext);
      // subdimul.append(subdimli);
    });
    
    itembtn.on('click', function(){
      var itemli = $('<li></li>');
      itemli.addClass('list-group-item');
      
      var removebtn = $('<span class="badge"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></div>');
      
      removebtn.on('click',function(){
        $(this).parent().remove();
      });
      
      var itemdiv = $('<div></div>');
      itemdiv.addClass('form-inline');
      
      var itemgroup =  $('<div></div>');
      itemgroup.addClass('form-group');
      var itemlabel = $('<label>Item</label><br/>');
      var iteminput = $('<input type="text" style="width: 300px;" class="form-control data secondary dimension" name="item" placeholder="Please enter an Item">');
      iteminput.prop('dimension',$(this).parent().prop('dimension'));
      
      var itemreversedgroup = $('<div></div>');
      itemreversedgroup.addClass('form-group');
      var itemreversedlabel = $('<label>Reversed</label><br/>');
      var itemreversed = $('<input type="checkbox" class="form-control data secondary dimension">y/n</input>');
      itemreversed.prop('dimension',$(this).parent().prop('dimension'));
      
      itemli.append(removebtn);
      
      itemli.append(itemdiv);
      itemdiv.append(itemgroup);
      itemgroup.append(itemlabel);
      itemgroup.append(iteminput);
      
      itemdiv.append(itemreversedgroup);
      itemreversedgroup.append(itemreversedlabel);
      itemreversedgroup.append(itemreversed);
      
      
      itemul.append(itemli);     
      
      
      iteminput.selectize({
        valueField: 'item',
        labelField: 'label',
        searchField: 'label',
        create: true,
        maxItems: 1,
        options: items,
        create: function(input){
          var dim = {
            label: input,
            item: 'http://example.com/item/'+input
          }
          items.push(item);
          return item
        }
      }); 
    });
    
    removebtn.on('click',function(){
      $(this).parent().remove();
    });
    
    dimli.append(subdimbtn);
    dimli.append(itembtn);
    dimli.append(removebtn);
    
    dimli.append(dimdiv);
    dimdiv.append(diminputgroup);
    dimdiv.append(dimreliabilitygroup);
    diminputgroup.append(diminputlabel);
    diminputgroup.append(diminput);
    dimreliabilitygroup.append(dimreliabilitylabel);
    dimreliabilitygroup.append(dimreliability);
    
    dimli.append(subdimul);
    dimli.append(itemul);
    
    parent.append(dimli);
    
    diminput.selectize({
      valueField: 'dimension',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: dimensions,
      create: function(input){
        var dim = {
          label: input,
          dimension: 'http://example.com/dimension/'+input
        }
        dimensions.push(dim);
        return dim
      }
    });
  }
  
  // Add a 'change handler' to the doi-input 
  $('#doi-input').on('change', function(){
    var doi = $('#doi-input').val();
    
    retrieve_doi_details(doi);
    
  });
  
  // $('#studyName').selectize({
  //   valueField: 'study',
  //   labelField: 'label',
  //   searchField: 'label',
  //   create: false,
  //   maxItems: 1,
  //   render: {
  //       option: function(item, escape) {
  //           return '<div>' +
  //               '<span class="title">' +
  //                   escape(item.label)
  //               '</span>' +
  //               '<span class="uri">' + escape(item.study) + '</span>' +
  //               '<ul class="meta">' +
  //                 item.title
  //               '</ul>' +
  //           '</div>';
  //       }
  //   },
  //   score: function(search) {
  //     var score = this.getScoreFunction(search);
  //     return function(item) {
  //       return item.score;
  //     };
  //   },
  //   load: function(query, callback) {
  //       if (!query.length) return callback();
  //       $.ajax({
  //           url: '/match/study/' + encodeURIComponent(query),
  //           type: 'GET',
  //           error: function() {
  //             console.log('error')
  //             callback();
  //           },
  //           success: function(res) {
  //             console.log(res)
  //             callback(res['result']);
  //           }
  //       });
  //   },
  //   onChange: function(value){
  //     if (!value.length) return ;
  //
  //     console.log('Selected: ' + value);
  //
  //     // Get study details
  //     $.get('/study/details', {'uri': value}, function(data){
  //       console.log(data);
  //
  //           // fill sample size field
  //       if(data.results[0].size) {
  //             $("#sampleSize").val(data.results[0].size);
  //       }
  //
  //           // fill female participants field
  //       if(data.results[0].female) {
  //         $("#femPercentage").val(data.results[0].female)
  //       }
  //
  //       // fill mean participants age field
  //       if(data.results[0].age) {
  //         $("#meanAge").val(data.results[0].age)
  //       }
  //
  //           // fill country of conduct field
  //       if(data.results[0].country) {
  //             $("#country").val(data.results[0].country);
  //       }
  //
  //       // fill factor analysis fields
  //       if(data.results[0].analysis)
  //         $("#factorAnalysisYes").prop("checked", true);
  //       else
  //         $("#factorAnalysisNo").prop("checked", true);
  //
  //         if (data.results[0].analysis = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/EFA')
  //           $("#factorAnalysisType1").prop("checked", true);
  //         else if (data.results[0].analysis = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/CFA')
  //           $("#factorAnalysisType2").prop("checked", true);
  //         else if (data.results[0].analysis = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/EFACCFA')
  //             $("#factorAnalysisType3").prop("checked", true);
  //         else (data.results[0].originality = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/PCA')
  //           $("#factorAnalysisType4").prop("checked", true);
  //     });
  //     }
  // });
  
//   $('#scaleName').selectize({
//     valueField: 'scale',
//     labelField: 'label',
//     searchField: 'label',
//     create: false,
//     maxItems: 1,
//     render: {
//         option: function(item, escape) {
//             return '<div>' +
//                 '<span class="title">' +
//                     item.label
//                 '</span>' +
//                 '<span class="description">' + item.study + '</span>' +
//                 '<ul class="meta"><li>' +
//                   item.title
//                 '</li></ul>' +
//             '</div>';
//         }
//     },
//     score: function(search) {
//       var score = this.getScoreFunction(search);
//       return function(item) {
//         return item.score;
//       };
//     },
//     load: function(query, callback) {
//         if (!query.length) return callback();
//         $.ajax({
//             url: '/match/scale/' + encodeURIComponent(query),
//             type: 'GET',
//             error: function() {
//               console.log('error')
//               callback();
//             },
//             success: function(res) {
//               console.log(res)
//               callback(res['result']);
//             }
//         });
//     }
// });
});






function get_study_details(value){
  // Get study details
  $.get('/study/details', {'uri': value}, function(data){
    console.log(data);

    var study = data;
    
    if (study.scale) {
      console.log(study.scale);
      $('#scaleName')[0].selectize.setValue(study.scale);
    }

    // fill sample size field
    if(study.size) {
          $("#sampleSize").val(study.size);
    }

        // fill female participants field
    if(study.female) {
      $("#femPercentage").val(study.female)
    }

    // fill mean participants age field
    if(study.age) {
      $("#meanAge").val(study.age)
    }

        // fill country of conduct field
    if(study.country) {
          $("#country").val(study.country);
    }

    // fill factor analysis fields
    if(study.analysis)
      $("#factorAnalysisYes").prop("checked", true);
    else
      $("#factorAnalysisNo").prop("checked", true);

      if (study.analysis = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/EFA')
        $("#factorAnalysisType1").prop("checked", true);
      else if (study.analysis = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/CFA')
        $("#factorAnalysisType2").prop("checked", true);
      else if (study.analysis = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/EFACCFA')
          $("#factorAnalysisType3").prop("checked", true);
      else (study.originality = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/PCA')
        $("#factorAnalysisType4").prop("checked", true);
  });
}

function get_scale_details(value){
  // Get scale details
  $.get('/scale/details', {'uri': value}, function(data){
    console.log(data);
    var scale = data.scale;
    var dimensions = data.dimensions; 
    
	  // fill scale type field
	  if (scale.originality = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/Original')
		  $("#scaleType1").prop("checked", true);
	  else if (scale.originality = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/Revised')
		  $("#scaleType2").prop("checked", true);
	  else 
		  $("#scaleType3").prop("checked", true);
  
	  // fill scale measure type field
	  if (scale.type = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/LikertScale')
		  $("#measureType1").prop("checked", true);
	  else if(scale.type = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/GuttmanScale')
		  $("#measureType2").prop("checked", true);
	  else if(scale.type = 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/SemanticDifferentialScale')
		  $("#measureType3").prop("checked", true);
	  else
		  $("#measureType4").prop("checked", true);
  
	  // fill concept field
	  $("#concept").val(scale.concept);
  
	  // fill concept definition field
	  $("#conceptDef").val(scale.definition);
  
	  // fill likert scale points field
	  $("#likertPointsAmount").val(scale.scalePoints);
  
	  // fill anchors for likert scale
	  $("#likertPointsInfo1").val(scale.lowerAnchor);
	  $("#likertPointsInfo2").val(scale.higherAnchor);
  
	      // fill scale reliability
	  if(scale.reliability) {
		  var reliability = scale.reliability;
     	  reliability = reliability.slice(1,reliability.length);
  	  	  $("#totalReliability").val(reliability);
	  }
  
	  // fill dimensions
	  var index;
    
    $("#subscales").val(dimensions.length);
    
	  for(index=0; index < dimensions.length; ++index) {
		  // better query dimension seperately to get the dimension label
		  $("#dimensions1").prop("checked", true);
        	  // TODO: Now adding the dimension_label, but we should keep the uri itself as well!
		  $("#subscale["+ index +"]").val(dimensions[index].label);
	  
	   	  // fill chronbach alpha field per dimension
		  if(dimensions[index].alpha) {
			  $("subscaleReliability"+ index).val(dimensions[index].alpha);
		  }
			
		  // get dimension details
		  var dim = dimensions[index].dimension;
	      $.get('/dimension/details', {'uri': dim}, function(data){
	        console.log(data);
		
	   	  // populate items per dimension
		  });
  			  
	  }
  });
}


function retrieve_doi_details(doi){
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
}

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