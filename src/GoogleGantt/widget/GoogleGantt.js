/*global logger*/
/*
    GoogleGantt
    ========================

    @file      : GoogleGantt.js
    @version   : 1.4.0
    @author    : Willem van Zantvoort
    @date      : 2016-06-21
    @copyright : TimeSeries Consulting
    @license   : Apache 2

    Documentation
    ========================
    Implement Google Gantt in your project!
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
    "dojo/text!GoogleGantt/widget/template/GoogleGantt.html",

    "GoogleGantt/lib/loader"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, domStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("GoogleGantt.widget.GoogleGantt", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        criticalPathEnabled: "",
        criticalPathStyleStroke: "",
        criticalPathStyleStrokeWidth: "",

        ganttArrowColor: "",
        ganttArrowWidth: "",
        ganttArrowAngle: "",
        ganttArrowRadius: "",

        ganttGridLineStroke: "",
        ganttGridLineStrokeWidth: "",
        ganttGridTrackFill: "",
        ganttGridDarkTrackFill: "",

        ganttLabelStyleFont: "",
        ganttLabelStyleFontSize: "",
        ganttLabelStyleColor: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _contextObj: null,
        _chart: null,
        _jsonString: null,
        _chartInitialized: null,
        _data: null,
        _options: null,
        _height: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
              logger.debug(this.id + ".resize");
              if (this._chart !== null) {
                this._chart.draw(this._data, this._options);
              }
        },

        _createTable: function (returnedList, callback) {
            logger.debug(this.id + "._createTable");
            this._data = new google.visualization.DataTable();
            var taskID = null;
            var taskName = null;
            var resource = null;
            var startDate = null;
            var endDate = null;
            var duration = null;
            var percentCompleted = null;
            var dependencies = null;

            this._data.addColumn('string', 'Task ID');
            this._data.addColumn('string', 'Task Name');
            this._data.addColumn('string', 'Resource');
            this._data.addColumn('date', 'Start Date');
            this._data.addColumn('date', 'End Date');
            this._data.addColumn('number', 'Duration');
            this._data.addColumn('number', 'Percent Complete');
            this._data.addColumn('string', 'Dependencies');

            for (var i = 0; i < returnedList.length ; i++) {
                returnedList[i].fetch("taskID", function(value) {
                    if(value != null && value.valueOf() != "") {
                        taskID = value;
                    } else {
                        taskID = null;
                    }
                });

                returnedList[i].fetch("taskName", function(value) {
                    if(value != null && value.valueOf() != "") {
                        taskName = value;
                    } else {
                        taskName = null;
                    }
                });

                returnedList[i].fetch("resource", function(value) {
                    if(value != null && value.valueOf() != "") {
                        resource = value;
                    } else {
                        resource = null;
                    }
                });

                returnedList[i].fetch("startDate", function(value) {
                    if(value != null && value.valueOf() != "") {
                        startDate = new Date(value);
                    } else {
                        startDate = null;
                    }
                });

                returnedList[i].fetch("endDate", function(value) {
                    if(value != null && value.valueOf() != "") {
                        endDate = new Date(value);
                    } else {
                        endDate = null;
                    }
                });

                returnedList[i].fetch("duration", function(value) {
                    if(value != null && value.valueOf() != "") {
                        duration = parseInt(value);
                    } else {
                        duration = null;
                    }

                });

                returnedList[i].fetch("percentCompleted", function(value) {
                    if(value != null && value.valueOf() != "") {
                        percentCompleted = parseInt(value);
                    } else {
                        percentCompleted = null;
                    }
                });

                returnedList[i].fetch("dependencies", function(value) {
                    if(value != null && value.valueOf() != "") {
                        dependencies = value;
                    } else {
                        dependencies = null;
                    }
                });

                this._data.addRows([
                    [taskID, taskName, resource, startDate, endDate, duration, percentCompleted, dependencies]
                ])
            }

            this._height = returnedList.length * 40 + 20;

            this._drawChart(returnedList, callback);
        },

        _drawChart: function (callback) {
            this._setOptions();

             logger.debug("Creating Gantt chart");
            this._chart = new google.visualization.Gantt($('.ganttChart')[0]);
            logger.debug("Drawing chart");
            this._chart.draw(this._data, this._options);

          //google.charts.setOnLoadCallback(this._drawGantt(data, options));
        },

        _getData: function (callback) {
            logger.debug(this.id + "._getData");
            mx.data.action({
            params : {
                actionname : this.rowList,
                applyto : "selection",
                guids : [this._contextObj.getGuid()]
            },
            store: {
                caller: this.mxform
            },
            callback : lang.hitch(this, this._createTable),
            error : lang.hitch(this, function(error) {
                alert(error.description);
                mendix.lang.nullExec(callback);
            })
        });
        },

        _setOptions: function () {
            logger.debug("Setting option");

            this._options = {
                height: this._height,
                gantt: {
                    criticalPathEnabled: this.criticalPathEnabled,
                    criticalPathStyle: {
                        stroke: this.criticalPathStyleStroke,
                        strokeWidth: this.criticalPathStyleStrokeWidth
                    },
                    arrow: {
                        color: this.ganttArrowColor,
                        width: this.ganttArrowWidth,
                        angle: this.ganttArrowAngle,
                        radius: this.ganttArrowRadius
                    },
                    innerGridHorizLine: {
                        stroke: this.ganttGridLineStroke,
                        strokeWidth: this.ganttGridLineStrokeWidth
                    },
                    innerGridTrack: {
                        fill: this.ganttGridTrackFill
                    },
                    innerGridDarkTrack: {
                        fill: this.ganttGridDarkTrackFill
                    },
                    labelStyle: {
                        fontName: this.ganttLabelStyleFont,
                        fontSize: this.ganttLabelStyleFontSize,
                        color: this.ganttLabelStyleColor
                    }
                }
            };
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
            // Display widget dom node.
            domStyle.set(this.domNode, 'display', 'block');
                if(!window._googleVisualization || window._googleVisualization === false) {
                    logger.debug(this.id + "Google visualization package is about to be set")
                    this._googleVisualization = lang.hitch(this, function () {
                    if (typeof google !== 'undefined') {
                        logger.debug(this.id + "Google defined, loading packages")
                        window._googleVisualization = true;
                        google.charts.load('current',{'packages' : ['gantt']});
                        google.charts.setOnLoadCallback(lang.hitch(this, function() {this._getData(callback);}));
                    } else {
                        var duration =  new Date().getTime() - this._startTime;
                        if (duration > 5000) {
                            logger.debug(this.id + 'Timeout loading Google API.');
                            return;
                    }
                    setTimeout(this._googleVisualization,250);
                    }
                    });
                this._startTime = new Date().getTime();
                setTimeout(this._googleVisualization,100);
                }
                else {
                    logger.debug(this.id + "Google already defined, loading packages");
                    this._getData(callback);
                }
              } else {
            // Hide widget dom node.
            logger.debug(this.id + "context is empty");
            domStyle.set(this.domNode, 'display', 'none');
              }
            mendix.lang.nullExec(callback);
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });

                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });
            }
        }
    });
});

require(["GoogleGantt/widget/GoogleGantt"]);
