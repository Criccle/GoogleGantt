# Google Gantt Chart

This widget impelements the Google Gantt Chart widget in your Mendix application! 

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario

Visualize project progress with this easy to use Gantt chart

## Description

Put this widget inside a context, create a list of rows and enjoy your Gantt chart!

## Configuration & Properties

The widget needs an entity as it's context. It also needs a microflow which returns a list of rows that is used to fill the chart. Some attributes of the row entity may be left empty. For more information on configuration options see [The Google Gantt documentation](https://developers.google.com/chart/interactive/docs/gallery/ganttchart). Be sure to implement the following configuration settings as well to prevent errors.

Create a new object in your domain model. It may be non persistant. Make sure it has the exact following attributes:

* taskID (String)
* taskName (String)
* resource (String)
* startDate (DateTime)
* endDate (DateTime)
* duration (Integer)
* percentCompleted (Integer)
* dependencies (String)

On the Data tab select your entity and the microflow that returns a list with these entities. On the other tabs you can specify desired styling settings.

## Known issues and bugs

None. Please let us know if you run into any!