function offerVariables(startingVariables) {
    const varsMenu = d3.select("#uploadVars");
    
    varsMenu.selectAll("button").remove();
    varsMenu.selectAll("div").remove();

    varsMenu.selectAll("button")
        .data(startingVariables).enter()
        .append("button")
        .attr("class", "dropdown-item var")
        .attr("xlink:href", "#")
        // .attr("value", function (d) { return (d.code) })
        .classed('active', function (d) {
            return (selectedVariables.indexOf(d.code) !== -1);
        })
        .text(function (d) { return (d.label) })
        .on("click", function (d) {
            if (selectedVariables.indexOf(d.code) === -1) {
                selectedVariables.push(d.code);
                showAnnotations(d.code);
            } else {
                selectedVariables.splice(selectedVariables.indexOf(d.code), 1);
                console.log(selectedVariables);
                removeAnnotations(d.code);
            }
            config['variables'] = selectedVariables;
            d3.select(this).classed('active', function (d) {
                return (selectedVariables.indexOf(d.code) !== -1);
            });
            // if (d3.keys(types).length > 0) {
            //     showAnnotations();
            // }
        });

    varsMenu.append("div").attr("class", "dropdown-divider");
    varsMenu.append("button").attr("class", "dropdown-item file")
        .text(msg['personalized_options'])
        .on("click", otherVars);

    // if (d3.keys(types).length > 0) {
    //     showAnnotations();
    // }
}

function otherVars() {
    Swal.fire({
        title: msg['username_actions'],
        input: "select",
        inputOptions: {
            categorical: msg['categorical_option'],
            numerical: msg['numerical_option'],
            fromFile: msg['from_file_option']
        },
        inputPlaceholder: msg['action_placeholder'],
        showCancelButton: true
    }).then((value) => {
        if (value.value === 'categorical') {
            createCategorical();
            $("#catModal").modal('show');
        } else if (value.value === 'numerical') {
            createNumerical();
        } else if (value.value === 'fromFile') {
            askVars();
        }
    });
}

function createCategorical() {
    var typesToAnnotate = d3.keys(types).slice();

    d3.select("#catVariableTitle").text(msg["load_variable_title"])
    d3.select("#catVariableBody").selectAll("form").remove();
    d3.select("#catVariableBody").selectAll("div").remove();

    const selectTitle = d3.select("#catVariableBody").append("form")
    selectTitle.append("label").text(msg["load_variable_title"]);
    selectTitle.append("input").attr("type", "text")
        .attr("id", "catTitle");

    if (typesToAnnotate.length === 0) {
        console.log("No types")
        itemsNum = [1];
        var forms = d3.select("#catVariableBody").append("div");

        addTypeForCat(forms, 1);
      
        d3.select("#catVariableBody").append("button")
            .attr("type", "button")
            .attr("class", "btn btn-danger m-2")
            .html("<i class='fas fa-plus'></i> " + msg["add_type"])
            .on("click", function() {
                itemsNum.push(itemsNum[itemsNum.length-1] + 1);
                addTypeForCat(forms, itemsNum[itemsNum.length-1]);
            });

        d3.select("#saveCategorical").on("click", function() {
            const setVariable = {};
            itemsNum.forEach(function(x) {
                const typeName = d3.select("#catType"+x).property("value");
                setVariable[typeName] = valuesNum.map(function (x) {
                    return({
                        "code" : d3.select("#value-" + x).property("value"),
                        "label" : d3.select("#label-" + x).property("value"),
                    });
                });
            });
            const varName = d3.select("#catTitle").property('value');
            const fname = downloadJSON(setVariable, varName);
            addPersonalizedVariable(varName, setVariable, fname);
            showAnnotations(varName);
            $("#catModal").modal('hide');
        })
    } else {
        const typeDivs = d3.select("#catVariableBody")
            .selectAll("div")
            .data(typesToAnnotate).enter()
            .append("div")
        typeDivs.append("h5").text(function(d) {return(msg["for_type"] + d); });
        typeDivs.each(fillCategorical);
        d3.select("#saveCategorical")
            .on("click", function() {
                const setVariable = {};
                typesToAnnotate.forEach(function(t) {
                    setVariable[t] = valuesNum.map(function (x) {
                        return({
                            "code" : d3.select("#value-" + x).property("value"),
                            "label" : d3.select("#label-" + x).property("value"),
                        });
                    });
                });
                const varName = d3.select("#catTitle").property('value');
                const fname = downloadJSON(setVariable, varName);
                addPersonalizedVariable(varName, setVariable, fname);
                showAnnotations(varName);
                $("#catModal").modal('hide');
            });
    }

    
}

function addTypeForCat(forms, value) {
    forms.append("hr");
    const defineType = forms.append("form");
    defineType.append("label").text(msg["define_type"]);
    defineType.append("input").attr("type", "text")
        .attr("id", "catType" + value);
    forms.append("div").each(fillCategorical);
}

function fillCategorical(p) {
    const f = d3.select(this).append("div");
    valuesNum = [1, 2];

    addCategorical(f, valuesNum[0]);
    addCategorical(f, valuesNum[1]);
    
    d3.select(this).append("button")
        .attr("type", "button")
        .attr("class", "btn btn-success m-2")
        .html("<i class='fas fa-plus'></i> " + msg["add_value"])
        .on("click", function() {
            valuesNum.push(valuesNum[valuesNum.length-1] + 1);
            addCategorical(f, valuesNum[valuesNum.length-1]);
        })

    function addCategorical(form, value) {
        const ff = form.append("form").attr("class", "form-inline");
        ff.append("label").attr("class", "px-2").text(msg['label']);
        ff.append("input").attr("type", "text")
            .attr("id", function(d) {return("label-" + value)});
        ff.append("label").attr("class", "px-2").text(msg['value']);
        ff.append("input").attr("type", "text")
            .attr("id", function(d) {return("value-" + value)});
    }
}

function createNumerical() {
    Swal.fire({
        title: msg["load_variable_title"],
        input: "text",
        inputValidator: (value) => {
            if (!value) {
                return (msg['load_variable_insist']);
            }
        }
    }).then((result) => {
        if (result.value) {
            addPersonalizedVariable(result.value, 'numerical', "numerical");
            showAnnotations(result.value);
        }
    });
}

function askVars() {
    Swal.fire({
        title: msg["load_variable_title"],
        input: "text",
        inputValidator: (value) => {
            if (!value) {
                return (msg["load_variable_insist"]);
            }
        }
    }).then((result) => {
        if (result.value) {
            let varFile = dialog.showOpenDialogSync(options = {
                title: msg['upload_file'],
                filters: [{
                    name: "JSON",
                    extensions: ["json"]
                }]
            });
            addPersonalizedVariable(result.value, JSON.parse(fs.readFileSync(varFile[0])), varFile[0]);
            showAnnotations(result.value);
        }
    });

    // latest['defs'] = def_file[0];
    // if (d3.keys(types).length > 0) {
    //     start();
    // }
}

function addPersonalizedVariable(name, content, path) {
    personalizedVariables[name] = content;
    config['personalized_variables'].push({
        variable: name, path: path
    });
    variables.push({ code: name, label: name[0].toUpperCase() + name.substr(1).toLowerCase() });
    selectedVariables.push(name);
    console.log(selectedVariables);
    offerVariables(variables);
}

function showConc() {
    counter += 1;
    // this_selection = this_user['tokens'][type].slice(0);
    // Remove and recreate concordance to avoid accumulation
    $("#concordance").remove();
    $("#waiting").remove();

    const workspace = d3.select("#playground").append("div")
        .attr("class", "col-sm-10")
        .attr("id", "concordance");

    const tabs = workspace.append("ul")
        .attr("class", "nav nav-tabs")
        .attr("role", "tablist");

    var concordances = types[type];
    toClassify = d3.map(concordances, function (d) { return (d.id); }).keys();
    viewing = 0;
    var overview, buttons;

    d3.keys(types).forEach(function (d) {
        announced[d] = checkAchievements(d);
    });

    if (d3.keys(text).indexOf(type) === -1) {
        text[type] = {};
        saved = JSON.stringify(text);
    } // Create a dictionary within 'text' for this type

    checkType(); // mark the types that are done

    // Set tabs, with 'overview' selected by default
    tabs.selectAll("li")
        .data([msg['tab_1'], msg['tab_2']]).enter()
        .append("li")
        .attr("class", "nav-item")
        .append("a")
        .attr("class", "nav-link")
        .attr("id", function (d) { return (d + "-tab"); })
        .classed("active", function (d) { return (d == msg['tab_1']); })
        .attr("data-toggle", "tab")
        .attr("href", function (d) { return ("#" + d); })
        .attr("role", "tab")
        .attr("aria-controls", function (d) { return (d); })
        .text(function (d) { return (d.toUpperCase()); });

    workspace.append("div").attr("class", "tab-content")
        .selectAll("div")
        .data([msg['tab_1'], msg['tab_2']]).enter()
        .append("div")
        .attr("class", "tab-pane")
        .attr("id", function (d) { return (d); })
        .classed("active", function (d) { return (d == msg['tab_1']); })
        .attr("width", "100vp")
        .attr("role", "tabpanel")
        .attr("aria-labelledby", function (d) { return (d + "-tab"); });

    // OVERVIEW TAB

    // Create scrollable space for concordances (also to separate from legend)
    overview = d3.select("#" + msg['tab_1'])
        .append("div")
        .attr("class", "mt-4")
        .style("height", "70vh").style("overflow", "auto");

    // For each concordance we get a row, with a left, target and right column
    // 'target' column shows how far the progress is with colors and is clickable to take you to that occurrence
    overview.selectAll("div")
        .data(concordances).enter()
        .append("div").attr("class", "row no-gutters justify-content-sm-center")
        .each(function (d) {
            const line = d3.select(this);

            line.append("div").attr("class", "col-md-5")
                .append("p").attr("class", "text-sm-right")
                .text(function (d) { return (d.left); });

            line.append("div").attr("class", "col-md-2 px-0")
                .append("p").attr("class", "text-sm-center")
                .style("font-weight", "bold")
                .text(function (d) { return (d.target); })
                .style('cursor', 'pointer')
                .on("click", function (d) {
                    tabs.selectAll(".nav-link").classed("active", function () {
                        return (d3.select(this).attr("id") == msg['tab_2'] + "-tab");
                    })
                    workspace.selectAll(".tab-pane").classed("active", function () {
                        return (d3.select(this).attr("id") == msg['tab_2']);
                    });
                    viewing = toClassify.indexOf(d.id);
                    displayConc();
                });

            updateTargetColor();

            line.append("div").attr("class", "col-md-5")
                .append("p").attr("class", "text-sm-left")
                .text(function (d) { return (d.right); });
        });


    // SENSE ANNOTATION TAB

    // Store in the 'conc' variable the set of divs tied to the concordance, to which we'll add everything else
    conc = d3.select("#" + msg['tab_2']).append("div").attr("class", "row justify-content-sm-center mt-5")
        .append("div").attr("class", "col-sm-12").selectAll("div")
        .data(concordances).enter()
        .append("div")
        .attr("token_id", function (d) { return (d.id); }); // The 'token_id' attribute makes it available for nested elements

    displayConc(); // displays the concordance that corresponds to the current token

    /// FIRST show concordance

    conc.append("p")
        .style('color', '#696969')
        .html(msg['before_concordance']);

    conc.each(function (d) {
        var line = d3.select(this);
        line.append("p")
            .attr("class", "text-center")
            .html(function (d) {
                return (d.left +
                    '<span class="px-1 text-primary" style="font-weight:bold">' +
                    d.target + '</span>' + d.right);
            });
    });

    conc.append("hr");

    // if (selectedVariables.length > 0) {
    //     showAnnotations();
    // }

    buttons = d3.select("#" + msg['tab_2']).append("div")
        .attr("class", "row justify-content-center")
        .append("div").attr("class", "col-sm-auto")
        .append("div").attr("class", "btn-group mt-2");

    buttons.append("button") // PREVIOUS
        .attr("type", "button")
        .attr("class", "btn shadow-sm btn-secondary m-1")
        .text(msg["previous"])
        .on("click", function () {
            viewing > 0 ? viewing -= 1 : viewing = toClassify.length - 1;
            displayConc();
            announceAchievement();
        });

    buttons.append("button") // NEXT
        .attr("type", "button")
        .attr("class", "btn shadow-sm btn-secondary m-1")
        .text(msg["next"])
        .on("click", function () {
            viewing < toClassify.length - 1 ? viewing += 1 : viewing = 0;
            displayConc();
            announceAchievement();
        });
}

function showAnnotations(variable) {

    if (conc === undefined) {
        uploadType();
    }
    if (selectedVariables.length === 1) {
        d3.selectAll(".annotationsSection").remove()
        anns = conc.append("div").attr("class", "annotationsSection");
    } else {
        anns = conc.select("div.annotationsSection");
    }
    console.log(variable);

    switch(variable) {
        case "confidence":
            addConfidence();
            break;
        case "cues":
            addCues();
            break;
        case "comments":
            addComments();
            break;
        default:
            personalizedVariables[x] === 'numerical' ? addNumerical(variable) : addVariable(variable);
    }
}

function removeAnnotations(variable) {
    d3.select("#"+type+"_"+variable).remove();
    selectedVariables.forEach(function(d) {
        d3.select("#instNum_"+type+"_"+d)
            .text(selectedVariables.indexOf(d)+1+".");
    })
}
// function showAnnotations() {
//     instructionNumber = 1;

//     d3.selectAll(".annotationsSection").remove()
//     anns = conc.append("div").attr("class", "annotationsSection");
//     // addVariable('sense');
//     // addConfidence();
//     // addCues();
//     // addComments();
//     // displayNoSense();
//     // ableAnns();

//     categVars = selectedVariables.filter(function (x) {
//         return (d3.keys(personalizedVariables).indexOf(x) !== -1 &&
//         personalizedVariables[x] !== 'numerical' &&
//         d3.keys(personalizedVariables[x]).indexOf(type) !== -1);
//     });
//     categVars.forEach(addVariable);

//     numVars = selectedVariables.filter(function(x) {
//         return (d3.keys(personalizedVariables).indexOf(x) !== -1 &&
//         personalizedVariables[x] === 'numerical')
//     });
//     numVars.forEach(addNumerical);

//     if (selectedVariables.indexOf('confidence') !== -1) {
//         addConfidence();
//     }
//     if (selectedVariables.indexOf('cues') !== -1) {
//         addCues();
//     }
//     if (selectedVariables.indexOf('comments') !== -1) {
//         addComments();
//     }
// }

function writeInstruction(text, variable) {
    const instructionNumber = selectedVariables.indexOf(variable)+1;
    d3.select("#"+type+"_"+variable).append("p")
        .style('color', '#696969')
        .html("<span id='instNum_"+type+"_"+variable+"' style='font-weight:bold;'>" + instructionNumber.toString() + ".</span> " + text);
    // instructionNumber += 1;
}

function addNumerical(variable) {

    const block = anns.append("div").attr("id", type+"_"+variable);

    writeInstruction(msg['instruction_variable'] + variable + '.', variable);

    block.append("input").attr("type", "number").attr("name", type + "_" + variable);

    block.append("hr");

    $(document).on("change", "input[name='" + type + "_" + variable + "']", function() {
        var analized = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).property('value');
        if (d3.keys(text[type]).indexOf(analized) === -1) {
            text[type][analized] = {};
        }
        text[type][analized][variable] = answer;
        updateTargetColor();
    })
}

function addVariable(variable) {

    const block = anns.append("div").attr("id", type+"_"+variable);

    writeInstruction(msg['instruction_variable'] + variable + ".", variable);

    block.append("div").attr("class", "row no-gutters justify-content-sm-center")
        .append("div").attr("class", "btn-group-vertical btn-group-toggle mt-2 btn-block")
        .attr("data-toggle", "buttons")
        .selectAll("label")
        .data(addNoneTag(personalizedVariables[variable][type])).enter()
        .append("label")
        .attr("class", "btn shadow-md btn btn-outline-secondary btn-sm")
        .classed("active", function (d) {
            var here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            // var chosen = hasSense(here, type) && text[type][here][variable] === d.code;
            var chosen = d3.keys(text[type][here]).indexOf(variable) !== -1 && text[type][here][variable] === d.code;
            return (chosen ? true : null);
        })
        .html(function (d) { return (d.label); })
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", type + "_" + variable)
        .attr("value", function (d) { return (d.code) });

    // Control de results when var changes
    $(document).on('change', 'input[name="' + type + '_' + variable + '"]', function (event) {
        var analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).attr('value');
        // register data
        if (d3.keys(text[type]).indexOf(analized) === -1) {
            text[type][analized] = {};
        }
        text[type][analized][variable] = answer;
        // text[type][analized]['cues'] = [];

        // inputtext.select("#" + type + toClassify.indexOf(analized) + "_comments").property('value', '');

        updateTargetColor();
        // colorStars();
        // ableAnns();
        // displayNoSense();
        // displayReminder();
        // saveInLS();
    });

    block.append("hr");
}

function addConfidence() {

    const block = anns.append("div").attr("id", type+"_confidence");

    writeInstruction(msg['instruction_confidence'], 'confidence');

    conf = block.append("div").attr("class", "row no-gutters justify-content-sm-center")
        .append("div").attr("id", "confidence")
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
        .attr("name", type + "_confidence")
        .attr("value", function (d) { return (d); });

    colorStars();

    conf.append("span").attr("class", "px-2")
        .text(msg["confidence_all"]);

    // Control when confidence changes
    $(document).on('change', 'input[name="' + type + '_confidence"]', function (event) {
        var analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).property('value');
        if (d3.keys(text[type]).indexOf(analized) === -1) {
            text[type][analized] = {};
        }
        text[type][analized]['confidence'] = answer;
        updateTargetColor();
        colorStars();
    });

    block.append("hr");
}

function addCues() {
    const block = anns.append("div").attr("id", type+"_cues");

    writeInstruction(msg['instruction_cues'], 'cues')

    cues = block.append("div").attr("class", "row justify-content-center")
        .each(function (d) {
            var line = d3.select(this).append('p').attr("class", "text-center"),
                leftContext = [],
                rightContext = [],
                leftSource = d.left.split(' '),
                rightSource = d.right.split(' '); // turns the lines into lists of context words

            // Each context word is represented by an 'index' (what gets registered), comprised of
            // a letter ('L' for left, 'R' for right) and the distance to the target (starting with 1)
            leftContext = leftSource.map(function (d, i) {
                var cwIdx = leftSource.length - i - 1;
                return ({ 'index': 'L' + cwIdx.toString(), 'cw': d });
            });
            rightContext = rightSource.map(function (d, i) {
                return ({ "index": "R" + i.toString(), 'cw': d });
            });
            halfLine(leftContext);

            line.append("span").attr("class", "btn p-0 text-primary")
                .style("font-weight", "bold")
                .text(function (d) { return (d.target); });

            halfLine(rightContext);

            function halfLine(context) {
                line.append("span").attr("class", "btn-group-toggle")
                    .attr("data-toggle", "buttons")
                    // .attr("disabled", function(d) {
                    //     return(d3.keys(text[type]).indexOf(d.id) > -1 ? null : true);
                    // })
                    .selectAll("label")
                    .data(context).enter()
                    .append("label").attr("class", "btn btn-cue px-1")
                    .classed("active", function (d) {
                        var here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr('token_id');
                        // var chosen = hasSense(here, type) && text[type][here]['cues'].indexOf(d.index) !== -1;
                        var chosen = d3.keys(text[type][here]).indexOf('cues') !== -1 && text[type][here]['cues'].indexOf(d.index) !== -1;
                        return (chosen ? true : null);
                    })
                    .text(function (d) { return (d.cw); })
                    .append("input").attr("type", "checkbox")
                    .attr("name", type + counter + "_cues")
                    .attr("autocomplete", "off")
                    .attr("value", function (d) { return (d.index); });
            }

        });

    // Control of results when the 'cues' change
    $(document).on("change", "input[name='" + type + counter + "_cues']", function () {
        var analized = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        console.log(analized);
        var answer = d3.select(this).attr('value');
        if (d3.keys(text[type]).indexOf(analized) === -1) {
            text[type][analized] = {};
        }
        console.log(text[type][analized]);
        if (d3.keys(text[type][analized]).indexOf('cues') === -1) {
            text[type][analized]['cues'] = [];
        }
        var cues_list = text[type][analized]['cues'];
        if (cues_list.indexOf('none') === 0) {
            cues_list.splice(0, 1);
        }

        if (cues_list.indexOf(answer) === -1) {
            cues_list.push(answer);
        } else { //if you are unclicking
            cues_list.splice(cues_list.indexOf(answer), 1);
        }
        console.log(cues_list);
        console.log(text[type]);

        updateTargetColor();
        displayReminder();
        saveInLS();
    });

    // HERE we add the reminder to add cues if the sense is annotated but there are not cues
    reminder = block.append('div')
        .attr('class', 'alert alert-warning text-center')
        .attr('role', 'alert')
        .html(msg["reminder"]);

    // and a confirmation if they have selected 'here'
    no_cues_conf = block.append('div')
        .attr('class', 'alert alert-success text-center')
        .attr('role', 'alert')
        .html(msg["no_cues_conf"]);

    displayReminder();

    // Use the <a> in the reminder message to select 'no cues' as option
    reminder.select("#no-cues-selected")
        .style('cursor', 'pointer')
        // .attr("href", "#")
        .on("click", function (d) {
            if (d3.keys(text[type]).indexOf(d.id) === -1) {
                text[type][d.id] = {};
            }
            text[type][d.id]['cues'] = ['none'];
            displayReminder();
            updateTargetColor();
        });

    block.append("hr");
}

function addComments() {
    const block = anns.append("div").attr("id", type+"_comments");

    writeInstruction(msg['instruction_comments'], 'comments');

    // no_sense_message = anns.append('div')
    //     .attr('class', 'alert alert-warning text-center')
    //     .attr('role', 'alert')
    //     .html(msg["no_sense_message"]);

    inputtext = block.append("div").attr("class", "row")
        .append("div").attr("class", "col")
        .attr("token_id", function (d) { return (d.id); });

    inputtext.append("div").append("input")
        .attr("class", "form-control")
        .attr("id", function (d) { return (type + toClassify.indexOf(d.id) + "_comments"); })
        .attr("name", "comments")
        .attr('autocomplete', 'on')
        .attr("placeholder", msg["comments_placeholder"])
        .attr("aria-label", "Comments")
        .property('value', function () {
            var here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
            return (d3.keys(text[type][here]).indexOf('comments') !== -1 ? text[type][here]['comments'] : null);
        })

    // control when comments change
    $(document).on('change', 'input[name="comments"]', function () {
        var analized = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        var answer = d3.select(this).property('value');
        if (d3.keys(text[type]).indexOf(analized) === -1) {
            text[type][analized] = {};
        }
        text[type][analized]['comments'] = answer;

        // displayNoSense();
        updateTargetColor();
        saveInLS();
    });

    block.append("hr");
}

function addNoneTag(variable) {
    var x = variable.slice(0)
    x.push(
        {
            'code': msg['no_sense_code'],
            'label': msg['no_sense_label']
        }
    );
    return (x);
}

function updateTargetColor(t) {
    d3.select("#" + msg['tab_1']).selectAll("p.text-sm-center")
        .style("color", function (d) {
            if (!hasSense(d.id, type)) {
                return ('#000000');
            } else if (!isDone(d.id, type)) {
                return ('#ef8a62');
            } else { return ("#4daf4a") }
        });
}

// Update display of reminder to annotate cues
function displayReminder() {
    reminder.style("display", function (d) {
        var wantCues = selectedVariables.indexOf('cues') !== -1;
        var here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        var needCues = d3.keys(text[type]).indexOf(here) === -1 ||
            d3.keys(text[type][here]).indexOf('cues') === -1 ||
            text[type][here]['cues'].length === 0;
        return (wantCues && needCues ? 'block' : 'none');
    });

    no_cues_conf.style("display", function (d) {
        var wantCues = selectedVariables.indexOf('cues') !== -1;
        var here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        var noCues = d3.keys(text[type]).indexOf(here) !== -1 &&
            d3.keys(text[type][here]).indexOf('cues') !== -1 &&
            text[type][here]['cues'].indexOf('none') === 0;
        return (wantCues && noCues ? 'block' : 'none');
    });
}

function ableAnns() {
    conf.attr("disabled", function() {
        var here = d3.select(this.parentNode.parentNode.parentNode.parentNode).attr("token_id");
        return (hasSense(here, type) ? null : true);
    });
    cues.selectAll("span").attr("disabled", function(d) {
        return(d3.keys(text[type]).indexOf(d.id) > -1 ? null : true);
    });
    cues.selectAll("label").classed("active", function (d) {
        var here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).attr('token_id');
        var chosen = hasSense(here, type) && text[type][here]['cues'].indexOf(d.index) > -1;
        return (chosen ? true : null);
    })

    inputtext.selectAll("input")
        .attr("disabled", function() {
            var here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
            return (hasSense(here, type) ? null : true);
        });
}

// Update display of reminder to comment when sense is 'none'
function displayNoSense() {
    no_sense_message.style("display", function (d) {
        var here = d3.select(this.parentNode.parentNode.parentNode).attr("token_id");
        return (hasSense(here, type) &&
            text[type][here]['sense'] == msg['no_sense_code'] &&
            d3.keys(text[type][here]).indexOf('comments') == -1 ? 'block' : 'none');
    });
}

// update display of ocncordances
function displayConc() {
    conc.style('display', function (d) {
        return (toClassify.indexOf(d.id) == viewing ? 'block' : 'none');
    });
}

// show that a type is done
function checkType() {
    d3.select("#typeSelection").selectAll("label")
        .html(function (d) {
            return (checkAchievements(d) == 'done' ? d + ' <i class="fas fa-check"></i>' : d);
        })
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", "type")
        .attr("value", function (d) { return (d) });
}

// update color of confidence stars
function colorStars() {
    conf.selectAll("label")
        .style("color", function (d) {
            var here = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("token_id");
            if (!hasSense(here, type) ||
                d3.keys(text[type][here]).indexOf('confidence') === -1 ||
                text[type][here]['confidence'] < d) {
                return ("#bdbdbd");
            } else {
                return ("#ffa500");
            }
        })
}

function offerTypes(selectedTypes) {
    // selectedTypes = d3.keys(this_user['tokens']); // tailored to this user
    d3.select("#typelist").remove();

    const typesel = d3.select("#typeSelection").append("div").attr("id", "typelist");

    typesel.append("h3").text(msg["typelist_title"]);
    typesel.append("div").attr("class", "btn-group-vertical btn-group-toggle")
        .attr("data-toggle", "buttons")
        .selectAll("label")
        .data(selectedTypes).enter()
        .append("label")
        .attr("class", "btn shadow-sm btn-success mt-1")
        .classed("active", function (d) { return (selectedTypes.indexOf(d) == 0); })
        .html(function (d) { return (d); })
        .append("input")
        .attr("type", "radio")
        .attr("autocomplete", "off")
        .attr("name", "type")
        .attr("value", function (d) { return (d) });

    // React to changes in the radio buttons
    $(document).on("change", "input[name='type']", function (event) {
        type = d3.select(this).property('value');
        showConc();
    });

    // Start with first type by default
    type = selectedTypes[0];

    showConc();
}

function userOnClick() {
    Swal.fire({
        title: msg['username_actions'],
        input: "select",
        inputOptions: {
            change: msg['change_username'],
            load: msg['load_config'],
            save: msg['save_config']
        },
        inputPlaceholder: msg['action_placeholder'],
        showCancelButton: true
    }).then((value) => {
        if (value.value === 'change') {
            Swal.fire({
                title: msg['ask_username'],
                input: "text"
            }).then((name) => {
                if (name) {
                    user = name.value;
                    d3.select(this).text(user);
                    text['user'] = user;
                    config['user'] = user;
                }
            });
        } else if (value.value === 'load') {
            const config_file = dialog.showOpenDialogSync(options = {
                title: msg['upload_file'],
                filters: [{
                    name: "JSON",
                    extensions: ["json"]
                }]
            });
            config = JSON.parse(fs.readFileSync(config_file[0]));
            user = config['user'];
            selectedVariables = config['variables'];
            config['types'].forEach(function (t) {
                types[t['name']] = d3.tsvParse(fs.readFileSync(t['path'], options = { encoding: 'utf-8' }));
            });
            config['personalized_variables'].forEach(function (v) {
                personalizedVariables[v['variable']] = v['path'] === 'numerical' ? 'numerical' : JSON.parse(fs.readFileSync(v['path']));
                variables.push({ code: v['variable'], label: v['variable'][0].toUpperCase() + v['variable'].substr(1).toLowerCase() });
            });
            offerTypes(d3.keys(types));
            offerVariables(variables);

            console.log(config);
            //   loadConfigFile();
        } else if (value.value === 'save') {
            downloadJSON(config, "config");
        }
    });
}

function uploadType() {
    const typeFiles = dialog.showOpenDialogSync(options = {
        title: msg['upload_files'],
        filters: [{
            name: "Tab separated values",
            extensions: ["tsv"]
        }],
        properties: ['multiSelections']
    });
    if (typeFiles !== undefined) {
        typeFiles.forEach(function (f) {
            const t = path.basename(f, '.tsv');
            types[t] = d3.tsvParse(fs.readFileSync(f, options = { encoding: 'utf-8' }));
            config['types'].push({
                name: t, path: f
            });
            // if (d3.keys(latest).indexOf('types') === -1) {
            //     latest['types'] = {};
            // }
            // latest['types'][t] = f;
            offerTypes(d3.keys(types));
            // saveInLS();
        });
    }  
}

// Check if all the tokens of a type have been assigned with senses
function allSenses(t) {
    // return (d3.keys(text[t]).length === this_user['tokens'][t].length);
    return (d3.keys(text[t]).length === types[t].length);
}

// Check if a particular token has been annotated
function hasSense(token, t) {
    return (d3.keys(text[t]).indexOf(token) !== -1);
}

// Check if the full work is done
function isDone(token, t) {
    const currentVariables = selectedVariables.filter(function(v) {
        return(v !== 'comments' && d3.keys(text[t][token]).indexOf(v) !== -1);
    });
    // var has_cues = text[t][token_id]['cues'].length > 0;
    // var has_conf = d3.keys(text[t][token_id]).indexOf('confidence') > -1;
    // var has_full_sense = text[t][token_id]['sense'] != msg['no_sense_code'] || d3.keys(text[t][token_id]).indexOf('comments') > -1;
    return (currentVariables.length === selectedVariables.length-1);
}

function checkAchievements(t) {
    const goal = toClassify;
    const startedTokens = goal.filter(function(d) {return (hasSense(d, t)); });
    const doneTokens = goal.filter(function(d) {return (hasSense(d, t) && isDone(d, t)); });
    
    if (startedTokens.length == Math.ceil(goal.length*3/5)) {
        return('halfdone');
    } else if (startedTokens.length == goal.length && doneTokens.length === goal.length) {
        return('done');
    } else {
        return('notdone');
    }
}

// Fire an alert when a type is finished
function announceAchievement() {
    const status = checkAchievements(type);
    var selectedTypes = d3.keys(types);
    var message, congrats, timer = 0;

    if (status == 'done' && announced[type] != 'done') {
        congrats = msg["congratulations"];
        checkType();
        full_types = selectedTypes.filter(function (d) {
            return (checkAchievements(d) == 'done');
        });
        if (full_types.length == selectedTypes.length) {
            message = msg["all_done_message"];
            timer = 2000;
        } else {
            message = msg["type_done_message"][0] + type + msg["type_done_message"][1];
            timer = 1000;
        }
    } else if (status == 'halfdone' && announced[type] != 'halfdone') {
        congrats = msg["encouragement"];
        // message = "You are almost done with <em>" + type + "</em>!"
        message = msg["almost_done_message"][0] + type + msg["almost_done_message"][1];
        timer = 1000;
    } else {
        return;
    }

    if (timer > 0) {

        Swal.fire({
            title: congrats[Math.floor(Math.random() * congrats.length)],
            html: message,
            type: "success",
            // position: "top",
            showConfirmButton: false,
            timer: timer
        });
        announced[type] = status;
    }
}

function createTsv(text, concordance) {
    const annotations = d3.keys(text).filter(function (d) { return typeof text[d] == 'object' });
    var outputCols = ['id', 'left', 'target', 'right']
    selectedVariables.forEach(function(x) {outputCols.push(x); });
    var output = annotations.map(function (a) {
        // a is the name of a type
        return d3.keys(text[a]).map(function (t) {
            // t is a token_id
            var res = [t];
            // return concordance.filter(function(d) {return (d.id === t); })[0];
            ['left', 'target', 'right'].forEach(function(c) {
                res.push(concordance.filter(function(d) {return (d.id == t); })[0][c]);
            });
            selectedVariables.forEach(function (c) {
                // c is a variable
                res.push(d3.keys(text[a][t]).indexOf(c) === -1 ? "" : text[a][t][c]);
            });
            console.log(text[a][t]);
            return (res.join('\t'));
        })
        .join('\n');
    })
    .join('\n');
    return [outputCols.join('\t'), output].join('\n');
    // return(output);
}

function saveInLS() { // check if storage is available and store
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("annotations-" + text['user'], JSON.stringify(text));
    }
}