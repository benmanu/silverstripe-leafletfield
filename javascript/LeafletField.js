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
			zoom = mapOptions.zoom;

		// create a map, set the view to a given place and zoom
		map = L.map(mapElement)
			.setView(center, zoom);

		// add an OpenStreetMap tile layer
		L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);

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
				val = geometryField.val(),
				collection;

			// check if exists
			if(val !== void 0 && /\[.+\]/.test(val)) {
				collection = JSON.parse(val);
			} else {
				collection = [];
			}

			collection.push(json);
			geometryField.val(JSON.stringify(collection));
		}

		function _onEdit(layer) {
			var collection = [];

			drawnItems.eachLayer(function(layer) {
				collection.push(layer.toGeoJSON());
			});

			geometryField.val(JSON.stringify(collection));
		}

		function _onDelete(layer) {
			var json = layer.toGeoJSON(),
				val = geometryField.val(),
				collection,
				newCollection = [];

			// check if exists
			if(val !== void 0 && /\[.+\]/.test(val)) {
				collection = JSON.parse(val);
			} else {
				collection = [];
			}

			for (var i = collection.length - 1; i >= 0; i--) {
				if(JSON.stringify(collection[i]) !== JSON.stringify(json)) {
					newCollection.push(collection[i]);
				}
			};

			geometryField.val(JSON.stringify(newCollection));
		}

		function _onLoad() {
			var val = geometryField.val(),
				collection;

			// clear layers.
			drawnItems.clearLayers();

			// check if field value exists.
			if(val !== void 0 && /\[.+\]/.test(val)) {
				collection = JSON.parse(val);
			} else {
				collection = [];
			}

			// for each geoJson feature add a layer.
			for (var i = collection.length - 1; i >= 0; i--) {
				L.geoJson(collection[i], {
					onEachFeature: function (feature, layer) {
						drawnItems.addLayer(layer);
					}
				});
			};

			if(collection.length > 0) {
				map.fitBounds(drawnItems.getBounds());
			}
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
