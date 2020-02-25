const { dialog, app } = require("electron").remote;
const fs = require("fs");
const path = require("path");



function loadData(lang) {
    const messages = require("./assets/messages.json");

    d3.select("#language").selectAll("label")
        .data(d3.keys(messages)).enter()
        .append("label").attr("class", "btn btn-light p-1")
        .classed("active", function(d) {return(d === lang); })
        .text(function(d) {return (d.toUpperCase() ); })
        .append("input")
            .attr('type', 'radio')
            .attr('name', 'language')
            .property('value', function(d) {return (d); })
            .attr('autocomplete', 'off')
            .property('checked', function(d) {return (d === lang); });
    
    start(messages[lang]);
}


