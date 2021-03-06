// following http://www.htmlwidgets.org/develop_intro.html
"use strict";

var cytoscape = require('cytoscape');
//----------------------------------------------------------------------------------------------------
// add layout extensions
var cola = require('cytoscape-cola');
cytoscape.use(cola);

let dagre = require('cytoscape-dagre');
cytoscape.use(dagre);

let coseBilkent = require('cytoscape-cose-bilkent');
cytoscape.use(coseBilkent);

$ = require('jquery');
require('jquery-ui-bundle');

//----------------------------------------------------------------------------------------------------
var executionMode = "beta";
const log = function(msg)
{
  if(executionMode == "devel")
      console.log(msg);
}
//----------------------------------------------------------------------------------------------------
HTMLWidgets.widget({

    name: 'cyjShiny',
    type: 'output',

    factory: function(el, allocatedWidth, allocatedHeight) {
	var cyj;
	return {
	    renderValue: function(x, instance) {
		log("---- ~/github/cyjsShiny/inst/browserCode/src/cyjShiny.js, renderValue")
		var data = JSON.parse(x.graph);
                var layoutName = x.layoutName;
		log(data);
		var cyDiv = el;
		cyj = cytoscape({
		    container: cyDiv,
		    elements: data.elements,
		    layout: {name: layoutName},

		    ready: function(){
                        log("cyjShiny cyjs ready");
			//$("#cyjShiny").height(0.95*window.innerHeight);
                        log("cyjShiny widget, initial dimensions: " + allocatedWidth + ", " + allocatedHeight)
			$("#cyjShiny").height(allocatedHeight)
			$("#cyjShiny").width(allocatedWidth)
			var cyj = this;
			window.cyj = this;   // terrible hack.  but gives us a simple way to call cytosacpe functions
			log("small cyjs network ready, with " + cyj.nodes().length + " nodes.");
		        log("  initial widget dimensions: " +
                            $("#cyjShiny").width() + ", " +
                            $("#cyjShiny").height());

			cyj.nodes().map(function(node){node.data({degree: node.degree()})});
			setTimeout(function() {
			    cyj.fit(100)
			}, 600);
		    } // ready
		}) // cytoscape()
            }, // renderValue
            resize: function(newWidth, newHeight, instance){
		log("cyjShiny widget, resize: " + newWidth + ", " + newHeight)
		//$("#cyjShiny").height(0.95 * window.innerHeight);
		$("#cyjShiny").height(newHeight);
		cyj.resize()
		log("  after resize, widget dimensions: " +
                            $("#cyjShiny").width() + ", " +
                            $("#cyjShiny").height());
            },
            cyjWidget: cyj
        }; // return
    } // factory
});  // widget
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("doLayout", function(message){

    var strategy = message.strategy;
    self.cyj.layout({name: strategy}).run()
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("removeGraph", function(message){

    self.cyj.elements().remove();
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("addGraph", function(message){

    var jsonString = message.graph;
    var g = JSON.parse(jsonString);
    self.cyj.add(g.elements);
    self.cyj.fit(50);
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("redraw", function(message){

    log("redraw requested");
    self.cyj.style().update();
    })

//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("setNodeAttributes", function(message){

    log("setNodeAttributes requested")

    var nodeIDs = message.nodes;
    var attributeName = message.attribute;

    for(var i=0; i < nodeIDs.length; i++){
       var id = nodeIDs[i];
       var newValue = message.values[i];
       var node = self.cyj.getElementById(id);
       node.data({[attributeName]:  newValue});
       };
})
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("selectNodes", function(message){

   log("selectNodes requested: " + message);

   var nodeIDs = message;

   if(typeof(nodeIDs) == "string")
      nodeIDs = [nodeIDs];

   var filterStrings = [];

   for(var i=0; i < nodeIDs.length; i++){
     var s = '[id="' + nodeIDs[i] + '"]';
     filterStrings.push(s);
     } // for i

   log("filtersStrings, joined: " + filterStrings);

   var nodesToSelect = window.cyj.nodes(filterStrings.join());
   nodesToSelect.select()

});
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("clearSelection", function(message){

    log("clearSelection requested: " + message);
    self.cyj.filter("node:selected").unselect();

})
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("getSelectedNodes", function(message){

    log("getSelectedNodes requested: " + message);
    var value = self.cyj.filter("node:selected")
        .map(function(node) {
            return(node.data().id)})
             //return {id: node.data().id, label: node.data().label}})

    log(self.cyj.filter("node:selected"));
    log(value)
    Shiny.setInputValue("selectedNodes", value, {priority: "event"});

});
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("sfn", function(message){

    log("sfn requested: " + message);
    self.cyj.nodes(':selected').neighborhood().nodes().select();

})
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("fitSelected", function(message){

    log("fitSelected requested");
    var padding = message.padding;

    var selectedNodes = self.cyj.filter("node:selected");

    if(selectedNodes.length == 0){
	log("no nodes currently selected")
     }
   else{
       log("fitSelected, with padding " + padding);
       self.cyj.fit(selectedNodes, padding)
   }
})
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("fit", function(message){
    log("fit requested: ");
    var padding = message.padding;
    log("   padding: " + padding)
    self.cyj.fit(padding);
    });
//------------------------------------------------------------------------------------------------------------------------
if(HTMLWidgets.shinyMode) Shiny.addCustomMessageHandler("loadStyle", function(message) {

    log("loading style");
    var styleSheet = message.json;
    window.cyj.style(styleSheet);
    });

//------------------------------------------------------------------------------------------------------------------------
