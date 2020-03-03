let text = {};
let saved = JSON.stringify(text);
let counter = 0;
let toClassify = 0;
let viewing = '';
let types = {}, announced = {};
let variables, selectedVariables = [], personalizedVariables = {};
let categVars, numVars, anns;
let valuesNum, itemsNum, forms;
// var detachedVariables = {};
const config = {
    'user' : '',
    'variables' : [],
    'personalized_variables' : [],
    'types' : []
};
let user = "Subtle Annotator";
config['user'] = user;
text['user'] = user;
let msg;
let conc;

function start(msgSource) {
    msg = msgSource;
    variables = [
        { "label": msg['confidence_label'], "code": "confidence", "type" :"default"},
        { "label": msg['keywords_label'], "code": "cues", "type" :"default"},
        { "label": msg['comments_label'], "code": "comments", "type" :"default"}
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

    offerVariables(variables);
    if (d3.keys(types).length > 0) {
        offerTypes(d3.keys(types));
    }

    $("#uploadVars").on("click", function (e) { e.stopPropagation(); });
    
    $(document).on('change', 'input[name="language"]', function(event) {
        const lang = d3.select(this).attr('value');
        loadData(lang);
      });
}









