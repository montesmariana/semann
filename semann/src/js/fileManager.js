function uploadProgress() {
    const progressFile = dialog.showOpenDialogSync(options = {
        title: msg['upload_file'],
        filters: [{
            name: "JSON",
            extensions: ["json"]
        }]
    });
    text = JSON.parse(fs.readFileSync(progressFile[0]));
    saved = JSON.stringify(text);
    showConc();
}

function downloadJSON(data, whatFor) {
    file = dialog.showSaveDialogSync(options = {
        "title":  msg["save"][1] === 'before' ? msg["save"][0] + " " + whatFor : whatFor + " " + msg["save"][0],
        "defaultPath" : whatFor === 'progress' ? user + ".json" : user + "." + whatFor + ".json"
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
    var finalOutput = createTsv(text, types[type]);
    dialog.showSaveDialog(options = {
        "title":  msg["progress_save"],
        "defaultPath" : user + ".tsv"
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