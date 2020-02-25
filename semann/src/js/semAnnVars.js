var text = {}, saved = JSON.stringify(text);
var counter = 0, instructionNumber, toClassify, viewing;
var types = {}, announced = {};
var variables, selectedVariables = [], personalizedVariables = {};
var categVars, numVars;
var valuesNum, itemsNum;
var config = {
    'user' : '',
    'variables' : [],
    'personalized_variables' : [],
    'types' : []
};
user = "Subtle Annotator";
config['user'] = user;
text['user'] = user;
var msg;
var conc;

function start(msgSource) {
    msg = msgSource;
    variables = [
        { "label": msg['confidence_label'], "code": "confidence" },
        { "label": msg['keywords_label'], "code": "cues" },
        { "label": msg['comments_label'], "code": "comments" }
    ];

    // Set title (name of application)
    d3.select("title").text(msg["title"]);
    d3.select("h1").text(msg["title"]);

    d3.select("#welcomeUser")
        .html(msg['welcome_title'] + " <a href='#' id='selectUser'>" + user + "</a>")
        .style("font-weight", "bold");
        //   .on("mouseover", function() { //show tooltip})
    d3.select("#selectUser").on("click", userOnClick);

    // Set button to select/update variables
    d3.select("#uploadVarsMenu")
        .html(msg["upload_vars"]).style("font-weight", "bold")

    // Set button to upload a concordance
    d3.select("#uploadConcordances")
        .html('<strong class="text-success">' + msg['upload_conc'] + ' </strong>')
        .on("click", uploadType);

    // Set button to upload progress (json file)
    d3.select("#uploadProgress")
        .html('<strong class="text-primary">' + msg["upload_progress"] + '</strong>')
        .on("click", uploadProgress);

    // Set button to download progress
    d3.select("#download")
        .html('<strong>' + msg["download_json"] + '</strong>')
        .on("click", function () { downloadJSON(text, "progress") });


    // Set button to export file as tsv
    d3.select("#export")
        .html('<strong>' + msg["export_tsv"] + '</strong>')
        .on("click", downloadTSV);

    d3.selectAll("button[name='closeModal']").text(msg["close_modal"]);
    d3.selectAll("button[name='saveChanges']").text(msg["save_changes"]);

    offerVariables(variables, selectedVariables);

    $("#uploadVars").on("click", function (e) { e.stopPropagation(); });
    
    $(document).on('change', 'input[name="language"]', function(event) {
        const lang = d3.select(this).attr('value');
        loadData(lang);
      });
}









