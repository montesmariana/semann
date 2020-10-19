function uploadProgress(text, currentSettings, config, msg, filename = null) {
    const progressFile = filename === null ? openJSON(msg)[0] : filename;
    config.output = progressFile;
    Object.assign(text, JSON.parse(fs.readFileSync(progressFile)));

    updateTargetColor(text, currentSettings, config, msg);
    
    config.types[currentSettings.type].variables.forEach((v) => { showAnnotations(v, text, currentSettings, config, msg); });
    
}

function openJSON(msg) {
    return(dialog.showOpenDialogSync(options = {
        title: msg['upload_file'],
        filters: [{
            name: "JSON",
            extensions: ["json"]
        }]
    }));
}

function uploadType(text, currentSettings, config, msg) {
    const typeFiles = dialog.showOpenDialogSync(options = {
        title: msg['upload_files'],
        filters: [
            {name: "Tab separated values", extensions: ["tsv"]},
            {name: "All Files", extensions: ["*"]}
        ],
        properties: ['multiSelections']
    });
    if (typeFiles !== undefined) {
        Swal.mixin({
            title : msg['define_types'],
            input: "text",
            confirmButtonText: msg['next'] + ' &rarr;',
            showCancelButton : true,
            progressSteps: typeFiles.map((f) => typeFiles.indexOf(f) + 1 )
        }).queue(
            typeFiles.map(function(f) {
                return({
                    text: msg["source"] + ": " + path.basename(f),
                    inputPlaceholder : path.basename(f, '.tsv'),
                    inputValidator: (value) => {
                        if (!value) { value = path.basename(f, '.tsv') }
                        if (d3.keys(config.types).indexOf(value) !== -1) {
                            return (msg['variable_exists']);
                        }
                    }
                });
        })
        ).then((result) => {
            if (result.value) {
                const answers = result.value.map((v, i) => v === "" ? path.basename(typeFiles[i], '.tsv') : v );
                Swal.fire({
                    icon : "success",
                    html : `${msg["your_types"]} ${answers.join(", ")}`
                    }).then(() => {
                        typeFiles.forEach(function(f, i) {
                            config.types[answers[i]] = {
                                "path" : f,
                                concordance : d3.tsvParse(fs.readFileSync(f, options = { encoding: 'utf-8' })),
                                variables : []
                            }
                        });
                        offerTypes(text, currentSettings, config, msg);
                    });
            }
        });
    }  
}


function downloadJSON(data, whatFor, config, msg) {
    file = dialog.showSaveDialogSync(options = {
        "title":  msg["save"][1] === 'before' ? msg["save"][0] + " " + whatFor : whatFor + " " + msg["save"][0],
        "defaultPath" : whatFor === 'progress' ? config.project + ".json" : config.project + "." + whatFor + ".json",
        "filters": [{
            name: "JSON",
            extensions: ["json"]
        }]
    });
    if (file !== undefined) {
        fs.writeFile(file, JSON.stringify(data), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    }
    return(file);
}

function downloadTSV(text, currentSettings, config, msg) {
    const finalOutput = createTsv(text, config);
    dialog.showSaveDialog(options = {
        "title":  msg["progress_save"],
        "defaultPath" : config.project + ".tsv",
        filters: [{
            name: "TSV",
            extensions: ["tsv", "txt", "csv"]
        }]
    }).then((file) => {
        if (file.canceled == false){
            // latest['exported'] = file.filePath;
            fs.writeFile(file.filePath, finalOutput, function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
        }
    });
    // full_types = d3.keys(types).filter(function (d) {
    //     return (checkAchievements(d) == 'done');
    // });
    // var message = full_types.length !== this_types.length ? msg["final_download_message"] : null;
    // // console.log(final_output);
    // Swal.fire({
    //     title: msg["download_title"],
    //     html: message,
    //     icon: 'success'
    // });
}