function uploadProgress() {
    const progressFile = openJSON();
    text = JSON.parse(fs.readFileSync(progressFile[0]));
    saved = JSON.stringify(text);
    updateTargetColor();
    const tmp = [...selectedVariables]
    _.pull(selectedVariables, ...selectedVariables)
    tmp.forEach(loadVars);
}

function openJSON() {
    return(dialog.showOpenDialogSync(options = {
        title: msg['upload_file'],
        filters: [{
            name: "JSON",
            extensions: ["json"]
        }]
    }));
}

function uploadType() {
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
            progressSteps: typeFiles.map(function(f) {return(typeFiles.indexOf(f)+1); })
        }).queue(
            typeFiles.map(function(f) {
                return({
                    text: msg["source"] + ": " + path.basename(f),
                    inputPlaceholder : path.basename(f, '.tsv'),
                    inputValidator: (value) => {
                        if (!value) { value = path.basename(f, '.tsv') }
                        if (d3.keys(types).indexOf(value) !== -1) {
                            return (msg['variable_exists']);
                        }
                    }
                });
        })
        ).then((result) => {
            if (result.value) {
                const answers = result.value.map(function(v, i) {
                    return(v === "" ? path.basename(typeFiles[i], '.tsv') : v);
                });
                Swal.fire({
                    icon : "success",
                    html : `${msg["your_types"]} ${answers}`
                    }).then(() => {
                        typeFiles.forEach(function(f, i) {
                            types[answers[i]] = d3.tsvParse(fs.readFileSync(f, options = { encoding: 'utf-8' }));
                            config['types'].push({name: answers[i], path:f});
                        });
                        offerTypes(d3.keys(types));
                    });
            }
        });
        // typeFiles.forEach(function (f) {
        //     let t = path.basename(f, '.tsv');
        //     Swal.mixin({
        //         title : msg['define_type'],
        //         text: "Filename: " + path.basename(f),
        //         icon: "question",
        //         input : "text",
        //         inputPlaceholder: t,
        //         inputValidator: (value) => {
        //             if (!value) { value = t }
        //             if (d3.keys(types).indexOf(value) !== -1) {
        //                 return (msg['variable_exists']);
        //             }
        //         }
        //     }).then((result) => {
        //         t = result.value ? result.value : t;
        //         types[t] = d3.tsvParse(fs.readFileSync(f, options = { encoding: 'utf-8' }));
        //         config['types'].push({
        //             name: t, path: f
        //         });
        //         offerTypes(d3.keys(types));
        //     });
        // });
    }  
}


function downloadJSON(data, whatFor) {
    file = dialog.showSaveDialogSync(options = {
        "title":  msg["save"][1] === 'before' ? msg["save"][0] + " " + whatFor : whatFor + " " + msg["save"][0],
        "defaultPath" : whatFor === 'progress' ? user + ".json" : user + "." + whatFor + ".json",
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
    // dialog.showSaveDialog(options = {
    //     "title":  msg["save"][1] === 'before' ? msg["save"][0] + " " + whatFor : whatFor + " " + msg["save"][0],
    //     "defaultPath" : whatFor === 'progress' ? user + ".json" : user + "." + whatFor + ".json"
    // }).then((file) => {
    //     if (file.canceled === false){
    //         // latest['saved'] = file.filePath;
    //         fs.writeFile(file.filePath, JSON.stringify(data), function (err) {
    //             if (err) throw err;
    //             console.log('Saved!');
    //             fname = file.filePath;
    //         });
    //     }
    // });
}

function downloadTSV() {
    var finalOutput = createTsv(text, types);
    dialog.showSaveDialog(options = {
        "title":  msg["progress_save"],
        "defaultPath" : user + ".tsv",
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