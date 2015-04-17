var papers;
var concepts;
var studies;
var scales;
var dimensions;
var items;
var analyses;


$(function(){
  // This is called when the page is fully loaded
  $('#study-details').hide();
  $('#scale-details').hide();
  
  
  // Retrieve the data for filling in the forms
  $.get('data', function(data){
    papers = data.papers;
    concepts = data.concepts;
    studies = data.studies;
    scales = data.scales;
    dimensions = data.dimensions;
    items = data.items;
    analyses = data.analyses;
    
    
    $('#doi-input').selectize({
      valueField: 'paper',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: papers,
      create: function(input){
        retrieve_doi_details(input);
        
        var paper = {
          label: input,
          paper: 'http://dx.doi.org/' + input
        };
        papers.push(paper);
        return paper;
      },
      onChange: function(value){
        
        retrieve_doi_details(value);
        
        $.getJSON('/paper/details', {'uri': value}, function(data){
          var paper_studies = data['studies'];
          
          if (paper_studies.length >0){
          
            var selectize = $('#studyName')[0].selectize;

            selectize.clear();
            selectize.clearOptions();
            selectize.renderCache['option'] = {};
            selectize.renderCache['item'] = {};

            selectize.addOption(paper_studies);
          }
          
        });
      }      
    });
    
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
        
        // Remove all data entered
        $('.data.secondary').val('');
        $("input[type='radio']").removeAttr('checked');
        $('#dimension-list').empty();
        
        get_study_details(value);
        $('#study-details').show();
      }
    });
    
    $('#show-all-studies-button').on('click',function(){
      var selectize = $('#studyName')[0].selectize;

      selectize.clear();
      selectize.clearOptions();
      selectize.renderCache['option'] = {};
      selectize.renderCache['item'] = {};
      
      selectize.addOption(studies);
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
          scale: 'http://example.com/scale/'+input
        };
        scales.push(scale);
        return scale;
      },
      onChange: function(value){
        console.log('Selected scale value: ' + value);
        
        // Remove all data entered
        $('.data.secondary').val('');
        $("input[type='radio']").removeAttr('checked');
        $('#dimension-list').empty();
        
        get_scale_details(value);
        $('#scale-details').show();
      }
    });
    
    $("#concept").selectize({
      valueField: 'concept',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: concepts,
      create: function(input){
        var concept = {
          label: input,
          concept: 'http://example.com/concept/'+input
        };
        concepts.push(concept);
        return concept;
      }
    });
    
    $("#factor-analysis-type").selectize({
      valueField: 'analysis',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: analyses
    })
    
    $('#toggle-scale-details').on('click',function(){
      $('#scale-details').toggle();
    });
    
    
    $('#add-dimension').on('click',function(){
      add_dimension($('#dimension-list'));
    });
    
    $('#save-button').on('click', function(){
      if ($('#doi-input').val() == ''){
        alert('Must specify the DOI of a publication!');
        return;
      }
      
      
      data = {};
      items = [];
      dimensions = [];
      reliabilities = [];
      loadings = [];
      reverseds = [];
      
      $('input').each(function(index){
        // console.log($(this).prop('id') + '> ' + $(this).val());
        
        elem = $(this);
        elem_id = elem.prop('id');
        
        if (elem.hasClass('loading')) {
          item_uri = $(elem.attr('item')).val();
          
          loadings.push({'item': item_uri, 'value': elem.val()});
        } else if (elem.hasClass('reversed')){
          item_uri = $(elem.attr('item')).val();
          
          reverseds.push({'item': item_uri, 'value': elem.prop('checked')});
        } else if (elem.hasClass('item')) {
          dimension_uri = $(elem.attr('dimension')).val();
          
          var label = elem[0].selectize.getItem(elem.val())[0].innerHTML;
          
          items.push({'dimension': dimension_uri, 'item': elem.val(), 'label': label})
        } else if (elem.hasClass('dimension')) {
          parent_dimension_uri = $(elem.attr('dimension')).val();
          
          var label = elem[0].selectize.getItem(elem.val())[0].innerHTML;
          
          if(parent_dimension_uri){
            dimensions.push({'dimension': elem.val(), 'parent': parent_dimension_uri, 'label': label});
          } else {
            dimensions.push({'dimension': elem.val(), 'label': label});
          }
        } else if (elem.hasClass('reliability')) {
          dimension_uri = $(elem.attr('dimension')).val();
          
          reliabilities.push({'dimension': dimension_uri, 'value': elem.val()});
        } else if (elem.prop('type') == 'radio'){
          data[elem_id] = elem.prop('checked');
        } else if (elem.hasClass('selectized')){
          console.log(elem);
          console.log($(elem));
          var uri = $(elem)[0].selectize.getValue();
          if(uri!=''){            
            var label = $(elem)[0].selectize.getItem(uri)[0].innerHTML;
            data[elem_id] = {'uri': uri, 'label': label};
          } else {
            data[elem_id] = null;
          }
        } else {
          if (elem_id == ''){
            console.log(elem);
          } else {
            data[elem_id] = elem.val();
          }
        }
        
        
      });
      
      data['items'] = items;
      data['dimensions'] = dimensions;
      data['reliabilities'] = reliabilities;
      data['reverseds'] = reverseds;
      data['loadings'] = loadings;
      
      console.log(data);
      
      $.post('/save', JSON.stringify(data), function(d){
        console.log(d);
        
      }, "json");
      
    });
    
    
    // TESTING
    // var dims = [{
    //   'uri': 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/DisgustSensitivity_1',
    //   'items': [{'uri': 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/NauseousScare'}],
    //   'subdimensions': [
    //     {'uri': 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/DisgustSensitivity_1',
    //      'items': [{'uri': 'http://onlinesocialmeasures.hoekstra.ops.few.vu.nl/vocab/NauseousScare'}]
    //     }
    //   ]
    // }]
    
    
    

    
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
  
  function add_dimension(parent, parent_uri, sub, data){
    sub = typeof sub !== 'undefined' ? sub : false;
    data = typeof data !== 'undefined' ? data : {};
    console.log(data);
    
    var dimensioninputid = generateUUID();
    
    var dimli = $('<li></li>');
    dimli.addClass('list-group-item');    
    dimli.prop('dimension','#'+dimensioninputid);
    
    
    var dimdiv = $('<div></div>');
    dimdiv.addClass('form-inline');
    
    var diminputgroup = $('<div></div>');
    diminputgroup.addClass('form-group');
    var diminputlabel = $('<label>Dimension&nbsp;</label>');
    var diminput = $('<input type="text" style="width: 300px;" class="form-control input data secondary dimension" placeholder="Please enter a dimension">');
    
    diminput.attr('id',dimensioninputid);
    
    if (parent_uri != null){
      diminput.attr('parent',parent_uri);
    }
    
    var dimreliabilitygroup = $('<div></div>');
    dimreliabilitygroup.addClass('form-group');
    var dimreliabilitylabel = $('<label>Reliability&nbsp;</label>');
    var dimreliability = $('<input type="text" style="width: 100px" class="form-control input-sm data secondary reliability" name="dimension" placeholder="Reliability">');
    dimreliability.attr('dimension', '#' + dimensioninputid);
    
    if (!sub) {
      var subdimbtn = $('<span class="btn btn-default btn-xs pull-right">Add Sub-dimension</span>');
      subdimbtn.on('click', function(){
        add_dimension($(this).parent(), $(this).parent().prop('dimension'), true);
      });
    }
    
    
    var itembtn = $('<span class="btn btn-info btn-xs pull-right">Add Item</div>');
    var removebtn = $('<span class="btn btn-danger btn-xs pull-right"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></div>');
    
    var subdimul = $('<ul></ul>');
    subdimul.addClass('list-group');

    var itemul = $('<ul></ul>');
    itemul.addClass('list-group');
    itemulid = generateUUID();
    
    itemul.prop('id',itemulid);
    
    

    
    itembtn.on('click', function(){
      add_item($(this).parent(), $(this).parent().prop('dimension'));
    });
    
    removebtn.on('click',function(){
      $(this).parent().remove();
    });
    
    dimli.append(removebtn);
    dimli.append(itembtn);
    dimli.append(subdimbtn);
    
    
    
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
    parent.attr('itemul','#'+itemulid);
    
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
    
    if (data['uri']){
      diminput[0].selectize.setValue(data['uri']);
      
      if (data['reliability']){
        dimreliability.val(data['reliability']);
      }
      
      
      if (data['items']){
        for (n in data['items']) {
          add_item(dimli, '#'+dimensioninputid, data['items'][n]);
        } 
      } 
      if (data['subdimensions']){
        for (n in data['subdimensions']) {
          add_dimension(dimli, '#'+dimensioninputid, true, data['subdimensions'][n]);
        }
      }
    }
  }
  
  function add_item(parent, parent_uri, data){
    data = typeof data !== 'undefined' ? data : {};
    
    var itemli = $('<li></li>');
    itemli.addClass('list-group-item');
    itemli.addClass('well');
    
    var iteminputid = generateUUID();
    
    var removebtn = $('<span class="btn btn-danger btn-xs pull-right"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></div>');
    
    removebtn.on('click',function(){
      parent.remove();
    });
    
    var itemdiv = $('<div></div>');
    itemdiv.addClass('form-inline');
    
    var itemgroup =  $('<div></div>');
    itemgroup.addClass('form-group');
    var itemlabel = $('<label>Item</label>');
    var iteminput = $('<input type="text" style="width: 300px;" class="form-control data secondary item" name="item" placeholder="Please enter an Item">');
    iteminput.attr('dimension',parent_uri);
    iteminput.attr('id',iteminputid);
    
    var itemreversedgroup = $('<div></div>');
    itemreversedgroup.addClass('form-group');
    var itemreversedlabel = $('<label>Reversed</label>');
    var itemreversed = $('<input type="checkbox" class="form-control data secondary reversed">y/n</input>');
    itemreversed.attr('item','#'+iteminputid);
    
    var itemfactorloadinggroup = $('<div></div>');
    itemfactorloadinggroup.addClass('form-group');
    var itemfactorloadinglabel = $('<label>Factor loading</label>');
    var itemfactorloading = $('<input type="text" style="width: 100px;" class="form-control input-sm data secondary loading">');
    itemfactorloading.attr('item','#'+iteminputid);
    
    
    itemli.append(removebtn);
    
    itemli.append(itemdiv);
    itemdiv.append(itemgroup);
    itemgroup.append(itemlabel);
    itemgroup.append(iteminput);
    
    itemdiv.append(itemreversedgroup);
    itemreversedgroup.append(itemreversedlabel);
    itemreversedgroup.append(itemreversed);
    
    itemdiv.append(itemfactorloadinggroup);
    itemfactorloadinggroup.append(itemfactorloadinglabel);
    itemfactorloadinggroup.append(itemfactorloading);
    
    console.log(parent.parent());
    $(parent.parent().attr('itemul')).append(itemli);     
    
    
    iteminput.selectize({
      valueField: 'item',
      labelField: 'label',
      searchField: 'label',
      create: true,
      maxItems: 1,
      options: items,
      create: function(input){
        var item = {
          label: input,
          item: 'http://example.com/item/'+input
        }
        items.push(item);
        return item
      }
    }); 
    
    if (data['uri']){
      iteminput[0].selectize.setValue(data['uri']);
      
      if (data['reversed']){
        if (data['reversed'] == 'true') {
          itemreversed.attr('checked',true);
        }
      }
      if (data['factorloading']){
        itemfactorloading.val(data['factorloading'])
      }
    }
    
    
  }
  








function get_study_details(value){
  // Get study details
  $.get('study/details', {'uri': value}, function(data){
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
    console.log(study.analysis)
    if(study.analysis) {
      $('#factor-analysis-type')[0].selectize.setValue(study.analysis);
    }
  });
}

function get_scale_details(value){
  // Get scale details
  $.get('scale/details', {'uri': value, 'graph': publication}, function(data){
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
    $("#concept")[0].selectize.setValue(scale.concept);
  
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
    
    
    for (n in dimensions){
      
      $.getJSON('/dimension/details', {'uri': dimensions[n]['dimension']}, function(data){
        var dim = data['dimensions'];
        
        add_dimension($('#dimension-list'),null, false, dim);
        
        
      })
      
      
    }
    
  // for(index=0; index < dimensions.length; ++index) {
  //     // better query dimension seperately to get the dimension label
  //     $("#dimensions1").prop("checked", true);
  //
  //     $("#subscale"+index).val(dimensions[index].label);
  //
  //        // fill chronbach alpha field per dimension
  //     if(dimensions[index].alpha) {
  //       $("#subscaleReliability"+index).val(dimensions[index].alpha);
  //     }
  //
  //     // get dimension details
  //     var dim = dimensions[index].dimension;
  //       $.get('/dimension/details', {'uri': dim}, function(data){
  //         console.log(data);
  //
  //        // populate items per dimension
  //     for(index=0; index < data.results.length; index++) {
  //         if(dimensions[0]) {
  //           $("#dimensionItem"+index).val(data.results[index].itemlabel);
  //
  //             if(data.results[index].reversed == true) {
  //           $("#dimensionItem"+index+"Rev").prop("checked", true)
  //         }
  //
  //         if(data.results[index].factor) {
  //           $("#dimensionItem"+index+"FactorLoading").val(data.results[index].factor);
  //         }
  //
  //         }
  //       else if(dimension[1]){
  //         // add another dimensions' item fields
  //         console.log('to do second');
  //       }
  //
  //     }
  //
  //     });
  //
  //   }
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
  if(doi.indexOf("http://dx.doi.org/") != -1) {
    doi = doi.slice(18,doi.length);
    console.log(doi);
  } else if(doi.indexOf("doi") !=-1) {
    doi = doi.slice(4,doi.length);
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

});