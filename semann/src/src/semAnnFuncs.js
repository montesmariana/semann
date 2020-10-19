function offerVariables(text, currentSettings, config, msg) {
    const varsMenu = d3.select("#uploadVars");
    const haveTypes = d3.keys(config.types).length > 0;

    varsMenu.selectAll("button").remove();
    varsMenu.selectAll("div").remove();

    varsMenu.selectAll("button")
        .data(config.variables).enter()
        .append("button")
        .attr("class", "dropdown-item var")
        .attr("xlink:href", "#")
        .classed("active", (d) => (haveTypes && config.types[currentSettings.type].variables.indexOf(d.code) !== -1))
        .on("click", function (d) {
            if (haveTypes) {loadVars(d.code, d3.select(this), text, currentSettings, config, msg);}
        })
        .text( (d) => d.label);

    varsMenu.append("div").attr("class", "dropdown-divider");
    varsMenu.append("button").attr("class", "dropdown-item file")
        .text(msg["personalized_options"])
        .on("click", () => otherVars(text, currentSettings, config, msg));

}

function loadVars(varName, btn, text, currentSettings, config, msg){
    switch (varName) {
        case "confidence":
            toggleSubvariable("confidence", btn, text, currentSettings, config, msg);
            break;
        case "cues":
            toggleSubvariable("cues", btn, text, currentSettings, config, msg);
            break;
        default:
            toggleVariable(varName, btn, text, currentSettings, config, msg);
    }
}

function toggleVariable(variable, btn, text, currentSettings, config, msg) {
    const checkAttributes = d3.keys(config.personalizedVariables[variable]).indexOf("hasAttributes") !== -1;
    if (config.types[currentSettings.type].variables.indexOf(variable) === -1) {
        config.types[currentSettings.type].variables.push(variable);
        showAnnotations(variable, text, currentSettings, config, msg);
    } else {
        _.pull(config.types[currentSettings.type].variables, variable);
        removeAnnotations(variable, currentSettings, config);
        if (checkAttributes) {
            config.personalizedVariables[variable]["hasAttributes"].forEach((x) => removeAnnotations(x + "_" + variable, currentSettings, config));
        }
    }
    btn.classed("active", (d) => d3.keys(config.types).length > 0 && config.types[currentSettings.type].variables.indexOf(d.code) !== -1);
}

function toggleSubvariable(subvariable, btn, text, currentSettings, config, msg) {
    const inputOptions = {};
    config.variables.forEach((d) => { if (d.type !== "default" && config.types[currentSettings.type].variables.indexOf(d) !== -1) { inputOptions[d.code] = d.label } });
    inputOptions[msg["overall"]] = msg["overall"][0].toUpperCase() + msg["overall"].substr(1).toLowerCase();
    Swal.fire({
        title: msg["variable_selection"],
        input: "select",
        inputOptions: inputOptions
    }).then((result) => {
        if (result.value) {
            if (result.value === "overall") {
                toggleVariable(subvariable, btn, text, currentSettings, config, msg);
            } else {
                const varAttributes = config.personalizedVariables[result.value]["hasAttributes"];
                if (varAttributes.indexOf(subvariable) === -1) {
                    varAttributes.push(subvariable);
                    if (config.types[currentSettings.type].variables.indexOf(result.value) !== -1) showAnnotations(subvariable, text, currentSettings, config, msg, result.value);
                } else {
                    _.pull(varAttributes, subvariable);
                    if (config.types[currentSettings.type].variables.indexOf(result.value) !== -1) removeAnnotations(subvariable + "_" + result.value, currentSettings, config);
                }
            }
        }
    });
}

function otherVars(text, currentSettings, config, msg) {
    Swal.fire({
        title: msg["project_actions"],
        input: "select",
        inputOptions: {
            categorical: msg["categorical_option"],
            numerical: msg["numerical_option"],
            fromFile: msg["from_file_option"]
        },
        inputPlaceholder: msg["action_placeholder"],
        showCancelButton: true
    }).then((value) => {
        switch(value.value){
            case "categorical":
                createCategorical(text, currentSettings, config, msg);
                $("#catModal").modal("show");
                break;
            case "numerical":
                createNumerical(text, currentSettings, config, msg);
                break;
            case "fromFile":
                askVars(text, currentSettings, config, msg);
                break;
        }
    });
}

function createCategorical(text, currentSettings, config, msg) {

    d3.select("#catVariableTitle").text(msg["categorical_option"])
    d3.select("#catVariableBody").selectAll("form").remove();
    d3.select("#catVariableBody").selectAll("div").remove();
    d3.select("#catVariableBody").selectAll("button").remove();
    d3.select("#saveCategorical").classed("disabled", true);

    const selectTitle = d3.select("#catVariableBody").append("form")
        .append("div").attr("class", "form-group");
    selectTitle.append("label").attr("for", "catTitle")
        .style("font-weight", "bold")
        .text(msg["load_variable_title"]);
    selectTitle.append("input").attr("type", "text")
        .attr("class", "form-control")
        .attr("required", "")
        .attr("pattern", "[a-zA-Z][a-zA-Z0-9\.]*")
        .attr("maxlength", 20)
        .attr("id", "catTitle");
    selectTitle.append("p").attr("id", "catTitleValidate");

    $(document).on("change", "input#catTitle", () => {
        const isValid = d3.select("#catTitle").property("validity").valid;
        d3.select("p#catTitleValidate")
            .text(isValid ? "Looks good!" : d3.select("#catTitle").property("validationMessage"));
        d3.select("#saveCategorical")
            .classed("disabled", isValid ? null : true);
    })

    const p = d3.select("#catVariableBody").append("div");
    fillCategorical(p, msg);

    d3.select("#saveCategorical")
        .on("click", function () {
            const extras = [];
            d3.selectAll("[name='wantExtras']").each(function () {
                if (d3.select(this).property("checked")) {
                    extras.push(d3.select(this).property("value"));
                }
            })
            const setVariable = {
                "type": "categorical",
                "hasAttributes": extras,
                "values": []
            };

           let maxCats = parseInt(d3.select("div[name='catVar']").attr("minCats"))
            for (let i = 1; i < maxCats+1; i++) {
                setVariable.values.push({
                    "code": d3.select("#value-" + i).property("value"),
                    "label": d3.select("#label-" + i).property("value"),
                });
            }
            var varName = d3.select("#catTitle").property("value");
            saveCategorical(varName, setVariable, text, currentSettings, config, msg);
        });

    const wantConf = d3.select("#catVariableBody").append("div")
        .attr("class", "form-check");
    wantConf.append("input")
        .attr("class", "form-check-input")
        .attr("name", "wantExtras")
        .attr("id", "wantConfidence")
        .attr("type", "checkbox")
        .attr("value", "confidence");
    wantConf.append("label")
        .attr("class", "form-check-label")
        .attr("for", "wantConfidence")
        .text(msg["confidence_label"]);

    const wantCues = d3.select("#catVariableBody").append("div")
        .attr("class", "form-check");
    wantCues.append("input")
        .attr("class", "form-check-input")
        .attr("name", "wantExtras")
        .attr("id", "wantCues")
        .attr("type", "checkbox")
        .attr("value", "cues");
    wantCues.append("label")
        .attr("class", "form-check-label")
        .attr("for", "wantCues")
        .text(msg["keywords_label"]);
}

function variableAvailable(name, config) {
    return (config.variables.filter((v) => v.code === name).length === 0);
}

function saveCategorical(varName, content, text, currentSettings, config, msg) {
    if (!variableAvailable(varName, config)) {
        Swal.fire({
            title: msg["variable_exists"],
            // text: msg["load_variable_title"],
            icon: "error",
            // input: "text",
        })
    } else {
        const fname = downloadJSON(content, varName, config, msg);
        if (fname !== undefined) {
            addPersonalizedVariable(varName, content, fname, config);
            offerVariables(text, currentSettings, config, msg);
        }
        $("#catModal").modal("hide");
    }
}

function fillCategorical(p, msg) {
    const f = p.append("div")
        .attr("name", "catVar")
        .attr("minCats", 2);
    let minCats = f.attr("minCats");

    addLabel(f, 1, msg);
    addLabel(f, 2, msg);

    p.append("button")
        .attr("type", "button")
        .attr("class", "btn btn-success m-2")
        .html("<i class='fas fa-plus'></i> " + msg["add_value"])
        .on("click", function () {
            minCats = parseInt(f.attr("minCats")) + 1;
            f.attr("minCats", minCats);
            addLabel(f, minCats, msg);
        }); 
}

function addLabel(form, value, msg) {
    const ff = form.append("form").append("div").attr("class", "row");
    const ffLabel = ff.append("div").attr("class", "col-6");
    const ffValue = ff.append("div").attr("class", "col-6");

    ffLabel.append("label").attr("class", "px-2")
        .attr("for", "label-" + value)
        .style("font-weight", "bold")
        .text(msg["label"]);
    ffLabel.append("input").attr("type", "text")
        .attr("class", "form-control")
        .attr("id", "label-" + value);
    ffValue.append("label").attr("class", "px-2")
        .attr("for", "value-" + value)
        .style("font-weight", "bold")
        .text(msg["value"]);
    ffValue.append("input").attr("type", "text")
        .attr("class", "form-control")
        .attr("id", "value-" + value);
}

function createNumerical(text, currentSettings, config, msg) {
    Swal.fire({
        title: msg["load_variable_title"],
        input: "text",
        inputValidator: (value) => {
            if (!value) {
                return (msg["load_variable_insist"]);
            } else if (!variableAvailable(value, config)) {
                return (msg["variable_exists"]);
            } else if (!/^[a-zA-Z][a-zA-Z0-9\.]*$/.test(value)) {
                return (msg["wrong_pattern"]);
            }
        } 
    }).then((result) => {
        if (result.value) {
            const content = { "type": "numerical" }
            addPersonalizedVariable(result.value, content, "numerical", config);
            offerVariables(text, currentSettings, config, msg);
        }
    });
}

function askVars(text, currentSettings, config, msg) {
    const varFile = openJSON(msg);
    const fileContents = JSON.parse(fs.readFileSync(varFile[0]));
    const fileNameParts = path.basename(varFile[0], ".json").split(".");
    const candidate = fileNameParts[fileNameParts.length-1];
    const placeHolder = (/^[a-zA-Z][a-zA-Z0-9\.]*$/.test(candidate)) && variableAvailable(candidate, config) ? candidate : "someVar";

    Swal.fire({
        title: msg["load_variable_title"],
        input: "text",
        inputPlaceholder: placeHolder,
        inputValidator: (value) => {
            if (!value) {
                value = placeHolder
            } else if (!(/^[a-zA-Z][a-zA-Z0-9\.]*$/.test(value))) {
                return (msg["wrong_pattern"]);
            } else if (!variableAvailable(value, config)) {
                return (msg["variable_exists"]);
            }
        }
    }).then((result) => {
        const varName = result.value ? result.value : placeHolder;
        const contents = d3.keys(fileContents).indexOf("hasAttributes") !== -1 ? fileContents : { "type": "categorical", "values": fileContents, "hasAttributes": [] }
        addPersonalizedVariable(varName, contents, varFile[0], config);
        offerVariables(text, currentSettings, config, msg);
        
    });

    // latest["defs"] = def_file[0];
    // if (d3.keys(types).length > 0) {
    //     start();
    // }
}

function addPersonalizedVariable(name, content, path, config) {
    config.personalizedVariables[name] = {
        path: path,
        hasAttributes: d3.keys(content).indexOf("hasAttributes") === -1 ? [] : content["hasAttributes"],
        values: d3.keys(content).indexOf("values") === -1 ? [] : content["values"],
        type: path === "numerical" ? "numerical" : "categorical"
    }
    config.variables.push({
        code: name, label: name[0].toUpperCase() + name.substr(1).toLowerCase(),
        type: path === "numerical" ? "numerical" : "categorical"
    });
}

function showConc(text, currentSettings, config, msg) {
    currentSettings.counter += 1;
    // currentSettings.focus = d3.select("#" + msg["tab_1"] + "-tab").classed("active") ? msg["tab_1"] : msg["tab_2"];
    // this_selection = this_project["tokens"][type].slice(0);
    // Remove and recreate concordance to avoid accumulation
    $("#concordance").remove();

    const workspace = d3.select("#playground").append("div")
        .attr("class", "col-sm-10")
        .attr("id", "concordance");

    const tabs = workspace.append("ul")
        .attr("class", "nav nav-tabs")
        .attr("role", "tablist");

    let concordances = config.types[currentSettings.type].concordance;
    currentSettings.toClassify = d3.map(concordances, (d) => d.id).keys();
    currentSettings.viewing = 0;
    let overview, buttons, conc;

    d3.keys(config.types).forEach((d) => {currentSettings.announced[d] = checkAchievements(d, text, currentSettings, config)});

    if (d3.keys(text).indexOf(currentSettings.type) === -1) {
        text[currentSettings.type] = {};
    } // Create a dictionary within "text" for this type

    checkType(text, currentSettings, config); // mark the types that are done

    // Set tabs, with "overview" selected by default
    tabs.selectAll("li")
        .data([msg["tab_1"], msg["tab_2"]]).enter()
        .append("li")
        .attr("class", "nav-item")
        .append("a")
        .attr("class", "nav-link")
        .attr("id", (d) => (d + "-tab"))
        .classed("active", (d) => (d === currentSettings.focus))
        .attr("data-toggle", "tab")
        .attr("href", (d) => ("#" + d))
        .attr("role", "tab")
        .attr("aria-controls", (d) => d)
        .text((d) => d.toUpperCase());

    workspace.append("div").attr("class", "tab-content")
        .selectAll("div")
        .data([msg["tab_1"], msg["tab_2"]]).enter()
        .append("div")
        .attr("class", "tab-pane")
        .attr("id", (d) => d)
        .classed("active", (d) => (d === currentSettings.focus))
        .attr("width", "100vp")
        .attr("role", "tabpanel")
        .attr("aria-labelledby", (d) => (d + "-tab"));

    // OVERVIEW TAB

    // Create scrollable space for concordances (also to separate from legend)
    overview = d3.select("#" + msg["tab_1"])
        .append("div")
        .attr("class", "mt-4")
        .style("height", "70vh").style("overflow", "auto");

    // For each concordance we get a row, with a left, target and right column
    // "target" column shows how far the progress is with colors and is clickable to take you to that occurrence
    overview.selectAll("div")
        .data(concordances).enter()
        .append("div").attr("class", "row no-gutters justify-content-sm-center")
        .each(function () {
            const line = d3.select(this);

            line.append("div").attr("class", "col-md-5")
                .append("p").attr("class", "text-sm-right")
                .text((d) => d.left);

            line.append("div").attr("class", "col-md-2 px-0")
                .append("p").attr("class", "text-sm-center")
                .style("font-weight", "bold")
                .text((d) => d.target)
                .style("cursor", "pointer")
                .on("click", function (d) {
                    currentSettings.focus = msg["tab_2"]
                    tabs.selectAll(".nav-link")
                        .classed("active", (x) => (x === currentSettings.focus))
                    workspace.selectAll(".tab-pane")
                        .classed("active", (x) => (x === currentSettings.focus));
                    currentSettings.viewing = currentSettings.toClassify.indexOf(d.id);
                    displayConc(currentSettings);
                    if (config.types[currentSettings.type].variables.length > 0) {
                        config.types[currentSettings.type].variables.forEach((v) => { showAnnotations(v, text, currentSettings, config, msg); })
                    }
                });

            updateTargetColor(text, currentSettings, config, msg);

            line.append("div").attr("class", "col-md-5")
                .append("p").attr("class", "text-sm-left")
                .text((d) => d.right);
        });


    // SENSE ANNOTATION TAB

    // Store in the "conc" variable the set of divs tied to the concordance, to which we"ll add everything else
    conc = d3.select("#" + msg["tab_2"]).append("div").attr("class", "row justify-content-sm-center mt-5")
        .append("div").attr("class", "col-sm-12").selectAll("div")
        .data(concordances).enter()
        .append("div")
        .attr("class", "conc_" + currentSettings.type)
        .attr("token_id", (d) => d.id); // The "token_id" attribute makes it available for nested elements

    displayConc(currentSettings); // displays the concordance that corresponds to the current token

    /// FIRST show concordance

    conc.append("p")
        .style("color", "#696969")
        .html(msg["before_concordance"]);

    conc.each(function () {
        d3.select(this)
            .append("p")
            .attr("class", "text-center")
            .html(function (d) {
                return (d.left +
                    "<span class='px-1 text-primary' style='font-weight:bold'>" +
                    d.target + "</span>" + d.right);
            });
    });

    conc.append("hr");

    buttons = d3.select("#" + msg["tab_2"]).append("div")
        .attr("class", "row justify-content-center")
        .append("div").attr("class", "col-sm-auto")
        .append("div").attr("class", "btn-group mt-2");

    buttons.append("button") // PREVIOUS
        .attr("type", "button")
        .attr("class", "btn shadow-sm btn-secondary m-1")
        .text(msg["previous"])
        .on("click", function () {
            currentSettings.viewing > 0 ? currentSettings.viewing -= 1 : currentSettings.viewing = currentSettings.toClassify.length - 1;
            displayConc(currentSettings);
            announceAchievement(text, currentSettings, config, msg);
        });

    buttons.append("button") // NEXT
        .attr("type", "button")
        .attr("class", "btn shadow-sm btn-secondary m-1")
        .text(msg["next"])
        .on("click", function () {
            currentSettings.viewing < currentSettings.toClassify.length - 1 ? currentSettings.viewing += 1 : currentSettings.viewing = 0;
            displayConc(currentSettings);
            announceAchievement(text, currentSettings, config, msg);
        });

    if (config.types[currentSettings.type].variables.length > 0) {
        config.types[currentSettings.type].variables.forEach((v) => { showAnnotations(v, text, currentSettings, config, msg); })
    }
}

function showAnnotations(variable, text, currentSettings, config, msg, supravariable = null) {
    if (d3.keys(currentSettings).indexOf("conc") === -1) {
        uploadType(text, currentSettings, config, msg);
        showAnnotations(variable, text, currentSettings, config, msg);
    } else {
        const firstVariable = config.types[currentSettings.type].variables.length === 1 && supravariable !== config.types[currentSettings.type].variables[0];
        const notFirstTime = d3.selectAll(".conc_" + currentSettings.type).select("div.annotationsSection").node() === null;
        if (firstVariable || notFirstTime) {
            d3.selectAll(".annotationsSection").remove()
            currentSettings.anns = d3.selectAll(".conc_" + currentSettings.type).append("div").attr("class", "annotationsSection")
                .style("height", "70vh").style("overflow", "auto");
        } else {
            
            currentSettings.anns = d3.selectAll(".conc_" + currentSettings.type).select("div.annotationsSection");
        }

        switch (variable) {
            case "confidence":
                addConfidence(text, currentSettings, config, msg, supravariable);
                break;
            case "cues":
                addCues(text, currentSettings, config, msg, supravariable);
                break;
            case "comments":
                addComments(text, currentSettings, config, msg);
                break;
            default:
                if (config.personalizedVariables[variable]["type"] === "numerical") {
                    addNumerical(variable, text, currentSettings, config, msg);
                    } else {
                    addCategorical(variable, text, currentSettings, config, msg);
                    }
        }

        if (d3.keys(config.personalizedVariables[variable]).indexOf("hasAttributes") !== -1) {
            config.personalizedVariables[variable]["hasAttributes"].forEach((x) => showAnnotations(x, text, currentSettings, config, msg, variable));
            ableAnns(variable, text, currentSettings, config);
        }
    }
}

function removeAnnotations(variable, currentSettings, config) {

    // detachedVariables[variable] = $("#"+type+"_"+variable).detach();
    d3.selectAll("." + currentSettings.type + "_" + variable).remove();
    config.types[currentSettings.type].variables.forEach(function (d) {
        const instructionNumber = config.types[currentSettings.type].variables.indexOf(d) + 1;
        d3.selectAll(".instNum_" + currentSettings.type + "_" + d)
            .text(instructionNumber.toString() + ".");
        if (d3.keys(config.personalizedVariables[d]).indexOf("hasAttributes") > -1) {
            config.personalizedVariables[d]["hasAttributes"].forEach(function (a) {
                const subInstNumber = instructionNumber.toString() + "." + (config.personalizedVariables[d]["hasAttributes"].indexOf(a) + 1).toString();
                d3.selectAll(".instNum_" + currentSettings.type + "_" + a + "_" + d)
                    .text(subInstNumber + ".");
            });
        }
    });
}

function writeInstruction(text, variable, currentSettings, config) {
    const varNameSplit = variable.split("_");
    const varName = varNameSplit.length === 1 ? varNameSplit[0] : varNameSplit[1];
    const instructionNumber = config.types[currentSettings.type].variables.indexOf(varName) + 1;
    const instructionNumberString = varNameSplit.length === 1 ? instructionNumber.toString() : instructionNumber.toString() + "." + (config.personalizedVariables[varName]["hasAttributes"].indexOf(varNameSplit[0]) + 1).toString();
    d3.selectAll("." + [currentSettings.type] + "_" + variable).append("p")
        .style("color", "#696969")
        .html("<span class='instNum_" + [currentSettings.type] + "_" + variable + "' style='font-weight:bold;'>" + instructionNumberString + ".</span> " + text);
    // instructionNumber += 1;
}

function addNumerical(variable, text, currentSettings, config, msg) {

    const block = currentSettings.anns.append("div").attr("class", currentSettings.type + "_" + variable);

    writeInstruction(msg["instruction_variable"] + variable + ".", variable, currentSettings, config);

    block.append("input").attr("type", "number").attr("name", currentSettings.type + "_" + variable);

    block.append("hr");

    $(document).on("change", "input[name='" + currentSettings.type + "_" + variable + "']", function () {
        const analized = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        const answer = d3.select(this).property("value");
        if (d3.keys(text[currentSettings.type]).indexOf(analized) === -1) {
            text[currentSettings.type][analized] = {};
        }
        text[currentSettings.type][analized][variable] = answer;
        updateTargetColor(text, currentSettings, config, msg)
    })
}

function addCategorical(variable, text, currentSettings, config, msg) {

    const block = currentSettings.anns.append("div").attr("class", currentSettings.type + "_" + variable);

    writeInstruction(msg["instruction_variable"] + variable + ".", variable, currentSettings, config);

    block.append("div").attr("class", "row no-gutters justify-content-sm-center")
        .append("div").attr("class", "btn-group-vertical btn-group-toggle mt-2 btn-block")
        .attr("data-toggle", "buttons")
        .selectAll("label")
        .data(function (d) {
            return (config.personalizedVariables[variable].values);
        }).enter()
        // .data(addNoneTag(personalizedVariables[variable][type])).enter() //uncomment to add None-Tags
        .append("label")
        .attr("class", "btn shadow-md btn btn-outline-secondary btn-sm")
        .classed("active", function (d) {
            const here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            // var chosen = hasSense(here, type) && text[type][here][variable] === d.code;
            const chosen = d3.keys(text[currentSettings.type][here]).indexOf(variable) !== -1 && text[currentSettings.type][here][variable] === d.code;
            return (chosen ? true : null);
        })
        .html((d) => d.label)
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", currentSettings.type + "_" + variable)
        .attr("value", (d) => d.code);

    // Control de results when var changes
    $(document).on("change", "input[name='" + currentSettings.type + "_" + variable + "']", function () {
        const analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        const answer = d3.select(this).attr("value");
        // register data
        if (d3.keys(text[currentSettings.type]).indexOf(analized) === -1) {
            text[currentSettings.type][analized] = {};
        }
        text[currentSettings.type][analized][variable] = answer;
        // text[type][analized]["cues"] = [];

        // inputtext.select("#" + type + toClassify.indexOf(analized) + "_comments").property("value", "");

        updateTargetColor(text, currentSettings, config, msg)
        // colorStars();
        ableAnns(variable, text, currentSettings, config);
        // displayNoSense();
        displayReminder("cues_"+variable, text, currentSettings, config);
        // saveInLS();
    });

    block.append("hr");
}

function addConfidence(text, currentSettings, config, msg, supravariable = null) {
    const varName = supravariable === null ? "confidence" : "confidence_" + supravariable;

    const block = currentSettings.anns.append("div").attr("class", currentSettings.type + "_" + varName);

    writeInstruction(msg["instruction_confidence"], varName, currentSettings, config);

    const conf = block.append("div").attr("class", "row no-gutters justify-content-sm-center")
        .append("div").attr("id", varName)
        .attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons");

    conf.append("span").attr("class", "px-2")
        .text(msg["confidence_none"]);

    conf.selectAll("label")
        .data([1, 2, 3, 4, 5, 6, 7]).enter()
        .append("label")
        .attr("class", "btn btn-sm")
        .style("font-size", "1.5em")
        .html("&#x2605;")
        .append("input").attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", currentSettings.type + "_" + varName)
        .attr("value", (d) => d);

        colorStars(varName, text, currentSettings);

    conf.append("span").attr("class", "px-2")
        .text(msg["confidence_all"]);

    // Control when confidence changes
    $(document).on("change", "input[name='" + currentSettings.type + "_" + varName + "']", function () {
        const analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        const answer = d3.select(this).property("value");
        if (d3.keys(text[currentSettings.type]).indexOf(analized) === -1) {
            text[currentSettings.type][analized] = {};
        }
        text[currentSettings.type][analized][varName] = answer;
        updateTargetColor(text, currentSettings, config, msg)
        colorStars(varName, text, currentSettings);
    });

    block.append("hr");
}

function halfLine(line, context, varName, text, currentSettings) {
    line.append("span").attr("class", "btn-group-toggle")
        .attr("data-toggle", "buttons")
        .selectAll("label")
        .data(context).enter()
        .append("label").attr("class", "btn btn-cue px-1")
        .classed("active", function (d) {
            const here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            // var chosen = hasSense(here, type) && text[type][here]["cues"].indexOf(d.index) !== -1;
            const chosen = d3.keys(text[currentSettings.type][here]).indexOf(varName) !== -1 && text[currentSettings.type][here][varName].indexOf(d.index) !== -1;
            return (chosen ? true : null);
        })
        .text((d) => d.cw)
        .append("input").attr("type", "checkbox")
        .attr("name", currentSettings.type + currentSettings.counter + "_" + varName)
        .attr("autocomplete", "off")
        .attr("value", (d) => d.index);
}
function addCues(text, currentSettings, config, msg, supravariable = null) {
    const varName = supravariable === null ? "cues" : "cues_" + supravariable;

    const block = currentSettings.anns.append("div").attr("class", currentSettings.type + "_" + varName);

    writeInstruction(msg["instruction_cues"], varName, currentSettings, config);

    block.append("div").attr("class", "row justify-content-center")
        .each(function (d) {
            const line = d3.select(this).append("p").attr("class", "text-center");
            let leftContext = [],
                rightContext = [],
                leftSource = d.left.split(" "),
                rightSource = d.right.split(" "); // turns the lines into lists of context words

            // Each context word is represented by an "index" (what gets registered), comprised of
            // a letter ("L" for left, "R" for right) and the distance to the target (starting with 1)
            leftContext = leftSource.map(function (d, i) {
                var cwIdx = leftSource.length - i - 1;
                return ({ "index": "L" + cwIdx.toString(), "cw": d });
            });
            rightContext = rightSource.map((d, i) => ({ "index": "R" + i.toString(), "cw": d }));
            halfLine(line, leftContext, varName, text, currentSettings);

            line.append("span").attr("class", "btn p-0 text-primary")
                .style("font-weight", "bold")
                .text((d) => d.target);

            halfLine(line, rightContext, varName, text, currentSettings);
        });

    // Control of results when the "cues" change
    $("." + currentSettings.type + "_" + varName).on("change", "input[name='" + currentSettings.type + currentSettings.counter + "_" + varName + "']", function () {
        const analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        const answer = d3.select(this).attr("value");
        if (d3.keys(text[currentSettings.type]).indexOf(analized) === -1) {
            text[currentSettings.type][analized] = {};
        }
        if (d3.keys(text[currentSettings.type][analized]).indexOf(varName) === -1) {
            text[currentSettings.type][analized][varName] = [];
        }
        const cues_list = text[currentSettings.type][analized][varName];
        if (cues_list.indexOf("none") === 0) { _.pull(cues_list, "none"); }

        if (cues_list.indexOf(answer) === -1) { cues_list.push(answer); } else { _.pull(cues_list, answer); }
        
        updateTargetColor(text, currentSettings, config, msg)
        displayReminder(varName, text, currentSettings, config);
        saveInLS(text);
    });

    // HERE we add the reminder to add cues if the sense is annotated but there are not cues
    const reminder = block.append("div")
        .attr("class", "alert alert-warning text-center")
        .attr("name", "reminder_" + currentSettings.type + "_" + varName)
        .attr("role", "alert")
        .html(msg["reminder"]);

    // and a confirmation if they have selected "here"
    block.append("div")
        .attr("class", "alert alert-success text-center")
        .attr("name", "noCues_" + currentSettings.type + "_" + varName)
        .attr("role", "alert")
        .html(msg["no_cues_conf"]);

    displayReminder(varName, text, currentSettings, config);

    // Use the <a> in the reminder message to select "no cues" as option
    reminder.select("#no-cues-selected")
        .style("cursor", "pointer")
        // .attr("href", "#")
        .on("click", function (d) {
            if (d3.keys(text[currentSettings.type]).indexOf(d.id) === -1) {
                text[currentSettings.type][d.id] = {};
            }
            text[currentSettings.type][d.id][varName] = ["none"];
            displayReminder(varName, text, currentSettings, config);
            updateTargetColor(text, currentSettings, config, msg)
        });

    block.append("hr");
}

function addComments(text, currentSettings, config, msg) {
    const block = currentSettings.anns.append("div").attr("class", currentSettings.type + "_comments");

    writeInstruction(msg["instruction_comments"], "comments", currentSettings, config, msg);

    // no_sense_message = anns.append("div")
    //     .attr("class", "alert alert-warning text-center")
    //     .attr("role", "alert")
    //     .html(msg["no_sense_message"]);

    const inputtext = block.append("div").attr("class", "row")
        .append("div").attr("class", "col")
        .attr("token_id", (d) => d.id);

    inputtext.append("div").append("input")
        .attr("class", "form-control")
        .attr("id", (d) => (currentSettings.type + currentSettings.toClassify.indexOf(d.id) + "_comments"))
        .attr("name", "comments")
        .attr("autocomplete", "on")
        .attr("placeholder", msg["comments_placeholder"])
        .attr("aria-label", "Comments")
        .property("value", function () {
            const here = d3.select(this.parentNode.parentNode).attr("token_id");
            return (d3.keys(text[currentSettings.type][here]).indexOf("comments") !== -1 ? text[currentSettings.type][here]["comments"] : null);
        })

    // control when comments change
    $(document).on("change", "input[name='comments']", function () {
        const analized = d3.select(this.parentNode.parentNode).attr("token_id");
        const answer = d3.select(this).property("value");
        if (d3.keys(text[currentSettings.type]).indexOf(analized) === -1) {
            text[currentSettings.type][analized] = {};
        }
        text[currentSettings.type][analized]["comments"] = answer;

        // displayNoSense();
        updateTargetColor(text, currentSettings, config, msg);
        saveInLS(text);
    });

    block.append("hr");
}

function updateTargetColor(text, currentSettings, config, msg) {
    d3.select("#" + msg["tab_1"]).selectAll("p.text-sm-center")
        .style("color", function (d) {
            if (!hasSense(d.id, currentSettings.type, text)) {
                return ("#000000");
            } else if (!isDone(d.id, currentSettings.type, text, config)) {
                return ("#ef8a62");
            } else { return ("#4daf4a") }
        });
}

// Update display of reminder to annotate cues
function displayReminder(varName, text, currentSettings, config) {
    const wantCues = varName === "cues" ? config.types[currentSettings.type].variables.indexOf(varName) !== -1 : config.personalizedVariables[varName.slice(5)]["hasAttributes"].indexOf("cues") !== -1;
    const suffix = currentSettings.type + "_" + varName;
    d3.selectAll("div[name='reminder_" + suffix + "']")
        .style("display", function () {
            const here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
            const noNeedCues = d3.keys(text[currentSettings.type]).indexOf(here) !== -1 && d3.keys(text[currentSettings.type][here]).indexOf(varName) !== -1 && text[currentSettings.type][here][varName].length > 0;
            const cuesDisabled = varName !== "cues" && d3.keys(text[currentSettings.type]).indexOf(here) === -1
            return (!wantCues || (noNeedCues || cuesDisabled) ? "none" : "block");
        });

    d3.selectAll("div[name='noCues_" + suffix + "']")
        .style("display", function () {
            const here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
            const noCues = d3.keys(text[currentSettings.type]).indexOf(here) !== -1 &&
                d3.keys(text[currentSettings.type][here]).indexOf(varName) !== -1 &&
                text[currentSettings.type][here][varName].indexOf("none") === 0;
            return (wantCues && noCues ? "block" : "none");
        });
}

function ableAnns(supravariable, text, currentSettings, config) {
    
    if (config.personalizedVariables[supravariable]["hasAttributes"].indexOf("confidence") !== -1) {
        d3.selectAll("." + currentSettings.type + "_confidence_" + supravariable)
            .selectAll(".btn-group-toggle")
            .attr("disabled", function () {
                const here = d3.select(this.parentNode.parentNode.parentNode.parentNode).attr("token_id");
                return (d3.keys(text[currentSettings.type][here]).indexOf(supravariable) !== -1 ? null : true);
            });
    }

    if (config.personalizedVariables[supravariable]["hasAttributes"].indexOf("cues") !== -1) {
        d3.selectAll("." + currentSettings.type + "_cues_" + supravariable)
            .selectAll(".btn-group-toggle")
            .classed("disabled", function () {
                const here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
                return (d3.keys(text[currentSettings.type][here]).indexOf(supravariable) !== -1 ? null : true);
            });
    }
}

// update display of concordances
function displayConc(currentSettings) {
    d3.selectAll(".conc_"+currentSettings.type)
        .style("display", (d) => {
            return(currentSettings.toClassify.indexOf(d.id) === currentSettings.viewing ? "block" : "none")});
}

// show that a type is done
function checkType(text, currentSettings, config) {
    d3.select("#typeSelection").selectAll("label")
        .html((d) => (checkAchievements(d, text, currentSettings, config) === "done" ? d + " <i class='fas fa-check'></i>" : d))
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", "type")
        .attr("value", (d) => d);
}

// update color of confidence stars
function colorStars(varName, text, currentSettings) {
    d3.selectAll("#"+varName).selectAll("label")
        .style("color", function (d) {
            const here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            if (!hasSense(here, currentSettings.type, text) ||
                d3.keys(text[currentSettings.type][here]).indexOf(varName) === -1 ||
                text[currentSettings.type][here][varName] < d) {
                return ("#bdbdbd");
            } else {
                return ("#ffa500");
            }
        })
}

function offerTypes(text, currentSettings, config, msg) {
    const selectedTypes = d3.keys(config.types);
    if (selectedTypes.indexOf(currentSettings.type) === -1) { currentSettings.type = selectedTypes[0] }
    selectedTypes.forEach((t) => text[t] = {});

    d3.select("#typelist").remove();

    const typesel = d3.select("#typeSelection").append("div").attr("id", "typelist");

    typesel.append("h3").text(msg["typelist_title"]);
    typesel.append("div").attr("class", "btn-group-vertical btn-group-toggle")
        .attr("data-toggle", "buttons")
        .selectAll("label")
        .data(selectedTypes).enter()
        .append("label")
        .attr("class", "btn shadow-sm btn-success mt-1")
        .classed("active", (d) => (selectedTypes.indexOf(d) === currentSettings.type))
        .html((d) => d)
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", "type")
        .attr("value", (d) => d);

    offerVariables(text, currentSettings, config, msg);

    showConc(text, currentSettings, config, msg);

    // React to changes in the radio buttons
    $(document).on("change", "input[name='type']", function () {
        currentSettings.type = d3.select(this).property("value");
        offerVariables(text, currentSettings, config, msg);
        showConc(text, currentSettings, config, msg);
    });
}

function projectOnClick(text, currentSettings, config, msg) {
    Swal.fire({
        title: msg["project_actions"],
        input: "select",
        inputOptions: {
            change: msg["change_project"],
            load: msg["load_config"],
            save: msg["save_config"]
        },
        inputPlaceholder: msg["action_placeholder"],
        showCancelButton: true
    }).then((value) => {
        if (value.value === "change") {
            Swal.fire({
                title: msg["ask_project"],
                input: "text"
            }).then((name) => {
                if (name) {
                    project = name.value;
                    d3.select(this).text(project);
                    text["project"] = project;
                    config["project"] = project;
                }
            });
        } else if (value.value === "load") {
            const config_file = openJSON(msg);
            Object.assign(config, JSON.parse(fs.readFileSync(config_file[0])));
            text["project"] = config.project;
            d3.select(this).text(config.project);
            d3.keys(config.types).forEach((t) => config.types[t].concordance = d3.tsvParse(fs.readFileSync(config.types[t].path, options = { encoding: "utf-8" })));
            
            d3.keys(config.personalizedVariables).filter((v) => config.personalizedVariables[v].path !== "numerical")
                .forEach((v) => {
                    config.personalizedVariables[v].values = JSON.parse(fs.readFileSync(config.personalizedVariables[v].path)).values
                });
            
            offerTypes(text, currentSettings, config, msg);
            offerVariables(text, currentSettings, config, msg);
            uploadProgress(text, currentSettings, config, msg, config.output);
            //   loadConfigFile();
        } else if (value.value === "save") {
            const toSave = _.clone(config);
            d3.keys(config.personalizedVariables).forEach((v) => {
                const vv = config.personalizedVariables[v];  
                toSave.personalizedVariables[v] = { path : vv.path, hasAttributes : vv.hasAttributes, type : vv.type};
            });
            d3.keys(config.types).forEach((t) => {
                tt = config.types[t];
                toSave.types[t] = { path : tt.path, variables : tt.variables };
            });
            if (config.output.length === 0) {
                config.output = downloadJSON(text, "progress", config, msg);
            }
            downloadJSON(config, "config", config, msg);
        }
    });
}


// Check if all the tokens of a type have been assigned with senses
function allSenses(t, text, config) {
    return (d3.keys(text[t]).length === config.types[t].concordance.length);
}

// Check if a particular token has been annotated
function hasSense(token, t, text) {
    return (d3.keys(text[t]).indexOf(token) !== -1);
}

// Check if the full work is done
function isDone(token, t, text, config) {
    const maxVariables = config.types[t].variables.filter((v) => v !== "comments");
    const currentVariables = maxVariables.filter( (v) => d3.keys(text[t][token]).indexOf(v) !== -1);
    return (currentVariables.length === maxVariables.length);
}

function checkAchievements(t, text, currentSettings, config) {
    const goal = currentSettings.toClassify;
    const startedTokens = goal.filter((d) => hasSense(d, t, text));
    const doneTokens = startedTokens.filter((d) => isDone(d, t, text, config));

    if (startedTokens.length == Math.ceil(goal.length * 3 / 5)) {
        return ("halfdone");
    } else if (doneTokens.length === goal.length) {
        return ("done");
    } else {
        return ("notdone");
    }
}

// Fire an alert when a type is finished
function announceAchievement(text, currentSettings, config, msg) {
    const status = checkAchievements(currentSettings.type, text, currentSettings, config);
    const selectedTypes = d3.keys(config.types);
    let message, congrats, timer = 0;

    if (status === "done" && currentSettings.announced[currentSettings.type] !== "done") {
        congrats = msg["congratulations"];
        checkType(text, currentSettings, config);
        full_types = selectedTypes.filter((d) => (checkAchievements(d, text, currentSettings, config) == "done"));
        if (full_types.length == selectedTypes.length) {
            message = msg["all_done_message"];
            timer = 2000;
        } else {
            message = msg["type_done_message"][0] + currentSettings.type + msg["type_done_message"][1];
            timer = 1000;
        }
    } else if (status == "halfdone" && currentSettings.announced[currentSettings.type] != "halfdone") {
        congrats = msg["encouragement"];
        // message = "You are almost done with <em>" + type + "</em>!"
        message = msg["almost_done_message"][0] + currentSettings.type + msg["almost_done_message"][1];
        timer = 1000;
    } else {
        return;
    }

    if (timer > 0) {

        Swal.fire({
            title: congrats[Math.floor(Math.random() * congrats.length)],
            html: message,
            icon: "success",
            // position: "top",
            showConfirmButton: false,
            timer: timer
        });
        currentSettings.announced[currentSettings.type] = status;
    }
}

function createTsv(text, config) {
    const annotations = d3.keys(config.types).filter((d) => d3.keys(text[d]).length > 0);
    const allVariables = annotations.map((t) => config.types[t].variables);
    const varNames = _.uniq(allVariables.flat());
    d3.keys(config.personalizedVariables).forEach(v => {
        if (varNames.indexOf(v) > -1 && config.personalizedVariables[v]["hasAttributes"].length > 0) {
            config.personalizedVariables[v]["hasAttributes"].forEach((y) => varNames.push(y + "_" + v));
        }
    });
    const colNames = ["id", ..._.pull(config.types[annotations[0]].concordance.columns, "id"), ...varNames];
    const output = annotations.map(function (a) {
        const concordance = config.types[a].concordance;
        // a is the name of a type
        const thisType = d3.keys(text[a]).map(function (t) {
            // t is a token_id
            const res = [t];
            const concColumns = concordance.columns;
            _.pull(concColumns, "id");
            concColumns.forEach((c) => res.push(concordance.filter((d) => d.id === t)[0][c]));
            varNames.forEach((c) => res.push(d3.keys(text[a][t]).indexOf(c) === -1 ? "" : text[a][t][c]));
            return (res.join("\t"));
        }).join("\n");
        return(thisType);
    });
    return [colNames.join("\t"), ...output].join("\n");
}


function saveInLS(text) { // check if storage is available and store
    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("annotations-" + text.project, JSON.stringify(text));
    }
}