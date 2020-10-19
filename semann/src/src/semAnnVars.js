function start(msgSource) {
    let msg = msgSource;
    const currentSettings = {
        counter : 0,
        toClassify : 0,
        viewing : "",
        announced : {},
        type : "",
        conc : {},
        focus : msg["tab_1"]
    }

    const config = {
        project : "Annotation Project",
        variables : [
            { "label": msg["confidence_label"], "code": "confidence", "type" :"default"},
            { "label": msg["keywords_label"], "code": "cues", "type" :"default"},
            { "label": msg["comments_label"], "code": "comments", "type" :"default"}
        ],
        personalizedVariables : {},
        types : {},
        output : ""
    };
    let text = {"project" : config["project"]};
    

    // Set title (name of application)
    d3.select("title").text(msg["title"]);
    d3.select("h1").text(msg["title"]);

    d3.select("#welcomeUser")
        .html(msg["welcome_title"] + " <a href='#' id='selectUser'>" + config["project"] + "</a>")
        .style("font-weight", "bold");
        //   .on("mouseover", function() { //show tooltip})
    d3.select("#selectUser").on("click", () => projectOnClick(text, currentSettings, config, msg));

    d3.select("h2#newData").text(msg["newData"]);
    d3.select("h2#progress").text(msg["progress"]);
    // Set button to select/update variables
    d3.select("#uploadVarsMenu")
        .html(msg["upload_vars"]).style("font-weight", "bold")

    // Set button to upload a concordance
    d3.select("#uploadConcordances")
        .html("<strong class='text-success'>" + msg["upload_conc"] + " </strong>")
        .on("click", () => uploadType(text, currentSettings, config, msg));

    // Set button to upload progress (json file)
    d3.select("#uploadProgress")
        .html("<strong class='text-primary'>" + msg["upload_progress"] + "</strong>")
        .on("click", () => uploadProgress(text, currentSettings, config, msg));

    // Set button to download progress
    d3.select("#download")
        .html("<strong>" + msg["download_json"] + "</strong>")
        .on("click", () => config.output = downloadJSON(text, "progress", config, msg));


    // Set button to export file as tsv
    d3.select("#export")
        .html("<strong>" + msg["export_tsv"] + "</strong>")
        .on("click", () => downloadTSV(text, currentSettings, config, msg));

    d3.selectAll("button[name='closeModal']").text(msg["close_modal"]);
    d3.selectAll("button[name='saveChanges']").text(msg["save_changes"]);

    offerVariables(text, currentSettings, config, msg);
    // if (d3.keys(config["types"]).length > 0) {
    //     offerTypes(currentSettings, config);
    // }

    $("#uploadVars").on("click", function (e) { e.stopPropagation(); });
    
    $(document).on("change", 'input[name="language"]', function() {
        const lang = d3.select(this).attr("value");
        loadData(lang);
      });
}









