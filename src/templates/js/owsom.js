$(document).ready(function() {
	$("#journalName").hide();
	$("#journalDOI").hide();
	$("#bookTitle").hide();
	$("#bookISBN").hide();
});

$('#store2').on('click',function(e) {
	var rdf_data = $('#publicationType').val();
	
	$.post('/store',data={'data': rdf_data});
});

$("input[type='radio']").change(function() {
	if($(this).val()=="option1") {
		$("#journalName").show();
	}
});