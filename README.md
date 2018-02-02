# SilverStripe LeafletField module

Provides a form field type allowing users to draw features on a map, the features are stored as geoJSON objects in a single database field.


## Installation

    $ composer require benmanu/silverstripe-leafletfield


## Basic Usage

Import the field

    use BenManu\LeafletField\LeafletField;

Create a text database field to store the geojson value.

    public static $db = array(
        'Geometry' => 'Text',
    );

Create a LeafletField, passing through the object that you want to store the value against.

    $field = new LeafletField('Geometry', 'Geometry', $this);

[Leaflet.draw demo](http://leaflet.github.io/Leaflet.draw/)


## Field Options

Define default field options through config.

    BenManu\LeafletField\LeafletField:
      map_options:
        center:
          latitude: "-40.866119"
          longitude: "174.143780"
        zoom: 5
      draw_options:
        polyline:
          shapeOptions:
            color: '#269634'
        polygon:
          allowIntersection: false
          drawError:
            color: '#b00b00'
            timeout: 1000
        rectangle: false
        circle: false

Define custom options for individual field instances (overrides defaults).

    $field->setLimit(1); // Limit the amount of objects the field can contain.
    $field->setMapOptions(array(
        'center' => array(
            'latitude' => '-40.866119',
            'longitude' => '174.143780'
        ),
        'zoom' => 5
    ));
    $field->setDrawOptions(array(
        'polyline' => array(
            'shapeOptions' => array(
                'color' => '#269634'
            )
        ),
        'polygon' => array(
            'allowIntersection' => false,
            'drawError' => array(
                'color' => '#b00b00',
                'timeout' => 1000
            )
        ),
        'rectangle' => false,
        'circle' => false
    ));

The draw options are set using the same structure as [Leaflet.draw options](https://github.com/Leaflet/Leaflet.draw#drawoptions).


## Maintainer Contacts

* Ben Manu <ben@silverstripe.com>

## Requirements

* SilverStripe 4.0

## Project Links
* [GitHub Project Page](https://github.com/benmanu/silverstripe-leafletfield)
* [Issue Tracker](https://github.com/benmanu/silverstripe-leafletfield/issues)
* [Leaflet](http://leafletjs.com/)
* [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw)
* [GeoJSON](http://geojson.org/geojson-spec.html)
