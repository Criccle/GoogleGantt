/*global logger*/
/*
    GoogleGantt
    ========================

    @file      : GoogleGantt.js
    @version   : 1.0.0
    @author    : <You>
    @date      : 2016-06-21
    @copyright : <Your Company> 2016
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "GoogleGantt/lib/jquery-1.11.2",
    "dojo/text!GoogleGantt/widget/template/GoogleGantt.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, domStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("GoogleGantt.widget.GoogleGantt", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements

        // Parameters configured in the Modeler.
        datasource: "",
        rowItem: "",
        rowList: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
		_chart: null,
		_jsonString: null,
		_chartInitialized: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
        	logger.level(logger.DEBUG);
            logger.debug(this.id + ".constructor");

            if (!window._googleLoading || window._googleLoading === false) {
                window._googleLoading = true;
                this._googleApiLoadScript = dom.script({'src' : 'https://www.gstatic.com/charts/loader.js', 'id' : 'GoogleApiLoadScript'});
                document.getElementsByTagName('head')[0].appendChild(this._googleApiLoadScript);
            }

            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._updateRendering();
            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
          	logger.debug(this.id + ".resize");
          	if (this._chart !== null) {
	            // Reset width to be able to shrink till 250.
	            this._chart.setOption('width', 250);
	            this._chart.draw();
	            // Set chart width to parent width.
	            var parentWidth = $('#' + this.id).parent().width();
	            if (parentWidth > 250) {
		            this._chart.setOption('width', parentWidth);
		            this._chart.draw();
            	}
          	}
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        _drawChart: function (returnedString, callback) {

        logger.debug("Creating data table with jsonString:                     " + returnedString);
        var data = new google.visualization.DataTable(returnedString);

		logger.debug("Setting option");
        var options = {
            height: 275
        };
 		
 		logger.debug("Creating Gantt chart");
        this._chart = new google.visualization.Gantt($('.ganttChart')[0]);
        logger.debug("Drawing chart");
        this._chart.draw(data, options);
         
          //google.charts.setOnLoadCallback(this._drawGantt(data, options));
        },

        _getJsonString: function (callback) {
        logger.debug(this.id + "Getting Json String");
        mx.data.action({
			params : {
				actionname : this.datasource,
				applyto : "selection",
				guids : [this._contextObj.getGuid()]
			},
			store: {
				caller: this.mxform
			},
			callback : lang.hitch(this, this._drawChart),
			error : lang.hitch(this, function(error) {
				alert(error.description);
				mendix.lang.nullExec(callback);
			})
		});
        },

        // Attach events to HTML dom elements
        _setupEvents: function () {
            logger.debug(this.id + "._setupEvents");
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");
            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            if (this._contextObj !== null) {
            // Display widget dom node.
            domStyle.set(this.domNode, 'display', 'block');
	            if(!window._googleVisualization || window._googleVisualization === false) {
	                this._googleVisualization = lang.hitch(this, function () {
	                if (typeof google !== 'undefined') {
	                    window._googleVisualization = true;
	                    google.charts.load('current',{'packages' : ['gantt']});
	                    google.charts.setOnLoadCallback(lang.hitch(this, function() {this._getJsonString(callback);}));
	                } else {	
	                    var duration =  new Date().getTime() - this._startTime;
	                    if (duration > 5000) {
	                        console.warn('Timeout loading Google API.');
	                        return;
	                    }
	                    setTimeout(this._googleVisualization,250);
	                }
	            	});
            	this._startTime = new Date().getTime();
            	setTimeout(this._googleVisualization,100);
            	} 
          	} else {
            // Hide widget dom node.
            domStyle.set(this.domNode, 'display', 'none');
          	}
            mendix.lang.nullExec(callback);
        },

        // Handle validations.
        _handleValidation: function (validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();
        },

        // Clear validations.
        _clearValidations: function () {
            logger.debug(this.id + "._clearValidations");
        },

        // Show an error message.
        _showError: function (message) {
            logger.debug(this.id + "._showError");
        },

        // Add a validation.
        _addValidation: function (message) {
            logger.debug(this.id + "._addValidation");
        },

        _unsubscribe: function () {
          if (this._handles) {
              dojoArray.forEach(this._handles, function (handle) {
                  mx.data.unsubscribe(handle);
              });
              this._handles = [];
          }
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this._unsubscribe();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                var objectHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });

                var validationHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });

                this._handles = [ objectHandle, validationHandle ];
            }
        }
    });
});

require(["GoogleGantt/widget/GoogleGantt"]);
