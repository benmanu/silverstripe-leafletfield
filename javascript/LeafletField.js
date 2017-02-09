(function($) {

	function initField() {
		var field = $(this);
		if(field.data('leafletfield-inited') === true) {
			return;
		}
		field.data('leafletfield-inited', true);

		var mapOptions = JSON.parse(field.attr('data-map-options')),
			drawOptions = JSON.parse(field.attr('data-draw-options')),
			mapElement = field.find('.leafletfield-map')[0],
			geometryField = field.find('.leafletfield-geometry');

		var map,
			center = [mapOptions.center.latitude, mapOptions.center.longitude],
			zoom = mapOptions.zoom,
			bounds = mapOptions.bounds,
			tileLayer = (mapOptions.tileLayer ? mapOptions.tileLayer : '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
			attribution = (mapOptions.attribution ? mapOptions.attribution : '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'),
			subdomains = (mapOptions.subdomains ? mapOptions.subdomains : '');

		// create a map, set the view to a given place and zoom
		map = L.map(mapElement)
			.setView(center, zoom);
		
		// set bounds if available
		if(bounds !== void 0) {
			var southWest = L.latLng(bounds._northEast.lat, bounds._northEast.lng);
			var northEast = L.latLng(bounds._southWest.lat, bounds._southWest.lng);
			bounds = L.latLngBounds(southWest, northEast);
			map.fitBounds(bounds);
		}

		// add an OpenStreetMap tile layer
        var tileLayerOptions = {
            attribution: attribution,
            maxZoom: 18
        };

        if (subdomains && subdomains !== '') {
            tileLayerOptions.subdomains = subdomains;
        }

		L.tileLayer(tileLayer, tileLayerOptions).addTo(map);

		// Initialise the FeatureGroup to store editable layers
		var drawnItems = new L.FeatureGroup();
		map.addLayer(drawnItems);

		// Initialise the draw control and pass it the FeatureGroup of editable layers
		var drawControl = new L.Control.Draw({
			edit: {
				featureGroup: drawnItems
			},
			draw: drawOptions
		});

		// Initialise the saved layers
		_onLoad();

		map.addControl(drawControl);

		// Draw events.
		map.on('draw:created', function (e) {
			var layer = e.layer;

			// remove excess layers if a limit is set
			var limitCheck = (drawnItems && drawnItems.getLayers().length >= mapOptions.layerLimit);
			
			if(limitCheck) {
				alert('Too many layers! Please remove one before adding another.');
			} else {
				// update the field
				_onAdd(layer);

				drawnItems.addLayer(layer);
			}
		});

		map.on('draw:edited', function (e) {
		    var layers = e.layers;
		    layers.eachLayer(function (layer) {
		        _onEdit(layer)
		    });
		});

		map.on('draw:deleted', function (e) {
		    var layers = e.layers;
		    layers.eachLayer(function (layer) {
		        _onDelete(layer)
		    });
		});

		// Update the field data.
		function _onAdd(layer) {
			var json = layer.toGeoJSON(),
				collection = _getValue();

			collection.push(json);
			_setValue(collection);
		}

		function _onEdit(layer) {
			var collection = [];

			drawnItems.eachLayer(function(layer) {
				collection.push(layer.toGeoJSON());
			});

			_setValue(collection);
		}

		function _onDelete(layer) {
			var json = layer.toGeoJSON(),
				collection = _getValue(),
				newCollection = [];

			for (var i = collection.length - 1; i >= 0; i--) {
				if(JSON.stringify(collection[i]) !== JSON.stringify(json)) {
					newCollection.push(collection[i]);
				}
			};

			_setValue(newCollection);
		}

		function _onLoad() {
			var collection = _getValue();

			// clear layers.
			drawnItems.clearLayers();

			// for each geoJson feature add a layer.
			for (var i = collection.length - 1; i >= 0; i--) {
				L.geoJson(collection[i], {
					onEachFeature: function (feature, layer) {
						drawnItems.addLayer(layer);
					}
				});
			};

			// set the bounds of the map
			if(_getBounds() !== void 0) {
				map.fitBounds(_getBounds());
			} else if(collection.length > 0) {
				map.fitBounds(drawnItems.getBounds());
			}
		}

		function _setValue(collection) {
			layers = {
				layers: collection,
				bounds: map.getBounds(),
				zoom: map.getZoom(),
				center: map.getCenter()
			};
			layers = JSON.stringify(layers);
			geometryField.val(layers);
		}

		function _getValue() {
			var value = geometryField.val(),
				layers = [];

			if(value !== void 0 && /\{"layers":\[.+\]}/.test(value)) {
				value = JSON.parse(value);
				layers = value.layers;
			}

			return layers;
		}

		function _getBounds() {
			var value = geometryField.val(),
				bounds,
				southWest,
				northEast;

			if(value !== void 0 && /\{"layers":\[.+\]}/.test(value)) {
				value = JSON.parse(value);
				bounds = value.bounds;

				if(bounds !== void 0) {
					southWest = L.latLng(bounds._northEast.lat, bounds._northEast.lng);
					northEast = L.latLng(bounds._southWest.lat, bounds._southWest.lng);
					bounds = L.latLngBounds(southWest, northEast);
				}
			}

			return bounds;
		}
	}

	$.fn.leafletfield = function() {
		return this.each(function() {
			initField.call(this);
		});
	}

	function init() {
		var mapFields = $('.leafletfield:visible').leafletfield();
		mapFields.each(initField);
	}

	// Export the init function
	window.leafletfieldInit = function() {
		init();
	}

	// CMS stuff: set the init method to re-run if the page is saved or pjaxed
	// there are no docs for the CMS implementation of entwine, so this is hacky
	if(!!$.fn.entwine && $(document.body).hasClass('cms')) {
		(function setupCMS() {
			var matchFunction = function() {
				init();
			};
			$.entwine('leafletfield', function($) {
				$('.cms-tabset').entwine({
					onmatch: matchFunction
				});
				$('.cms-tabset-nav-primary li').entwine({
					onclick: matchFunction
				});
				$('.ss-tabset li').entwine({
					onclick: matchFunction
				});
				$('.cms-edit-form').entwine({
					onmatch: matchFunction
				});
			});
		}());
	}

}(jQuery));
