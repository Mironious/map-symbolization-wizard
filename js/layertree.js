//~~~Layer tree constructor~~~//
var layerTree = function(options) 
{
    'use strict';
    if(!(this instanceof layerTree)) 
	{
        throw new Error('layerTree must be constructed with the new keyword.');
    } 
	else if (typeof options === 'object' && options.map && options.target) 
	{
        if (!(options.map instanceof ol.Map)) 
		{
            throw new Error('Please provide a valid OpenLayers 3 map object.');
        }
        this.map = options.map;
        var containerDiv = document.getElementById(options.target);
        if (containerDiv === null || containerDiv.nodeType !== 1) 
		{
            throw new Error('Please provide a valid element id.');
        }
		
		//Get or create messages
        this.messages = document.getElementById(options.messages) || document.createElement('span');
        
		//Create add/remove buttons and location
		//var controlDiv = document.createElement('div');
		var outDiv = document.getElementById('toolbar');
		var controlDiv = document.createElement('div');
        controlDiv.className = controlDiv.className+' ol-control'; //layertree-buttons
        controlDiv.appendChild(this.createButton('addvector', 'Add New Layer', 'addlayer'));
        controlDiv.appendChild(this.createButton('deletelayer', 'Remove Layer', 'deletelayer'));
        outDiv.appendChild(controlDiv);
        containerDiv.appendChild(outDiv);
		
		//Create layers menu
        this.layerContainer = document.createElement('div');
        this.layerContainer.className = 'layercontainer';
        containerDiv.appendChild(this.layerContainer);
		
        var idCounter = 0;
        this.selectedLayer = null;
        this.createRegistry = function (layer, buffer) 
		{
            layer.set('id', 'layer_' + idCounter);
            idCounter += 1;
            var layerDiv = document.createElement('div');
            layerDiv.className = buffer ? 'layer ol-unselectable buffering' : 'layer ol-unselectable';
            layerDiv.title = layer.get('name') || 'Unnamed Layer';
            layerDiv.id = layer.get('id');
            this.addSelectEvent(layerDiv);
			
			//Drag & drop layer
			var _this = this;
            layerDiv.draggable = true;
            layerDiv.addEventListener('dragstart', function (evt) 
			{
                evt.dataTransfer.effectAllowed = 'move';
                evt.dataTransfer.setData('Text', this.id);
            });
            layerDiv.addEventListener('dragenter', function (evt) 
			{
                this.classList.add('over');
            });
            layerDiv.addEventListener('dragleave', function (evt) 
			{
                this.classList.remove('over');
            });
            layerDiv.addEventListener('dragover', function (evt) 
			{
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'move';
            });
            layerDiv.addEventListener('drop', function (evt) 
			{
                evt.preventDefault();
                this.classList.remove('over');
                var sourceLayerDiv = document.getElementById(evt.dataTransfer.getData('Text'));
                if (sourceLayerDiv !== this) 
				{
                    _this.layerContainer.removeChild(sourceLayerDiv);
                    _this.layerContainer.insertBefore(sourceLayerDiv, this);
                    var htmlArray = [].slice.call(_this.layerContainer.children);
                    var index = htmlArray.length - htmlArray.indexOf(sourceLayerDiv) - 1;
                    var sourceLayer = _this.getLayerById(sourceLayerDiv.id);
                    var layers = _this.map.getLayers().getArray();
                    layers.splice(layers.indexOf(sourceLayer), 1);
                    layers.splice(index, 0, sourceLayer);
                    _this.map.render();
                }
            });
			
			//Edit title
            var layerSpan = document.createElement('span');
            layerSpan.textContent = layerDiv.title;
            layerDiv.appendChild(this.addSelectEvent(layerSpan, true));
            layerSpan.addEventListener('dblclick', function () 
			{
                this.contentEditable = true;
				layerDiv.draggable = false;
                layerDiv.classList.remove('ol-unselectable');
                this.focus();
            });
            layerSpan.addEventListener('blur', function () 
			{
                if(this.contentEditable) 
				{
                    this.contentEditable = false;
					layerDiv.draggable = true;
                    layer.set('name', this.textContent);
                    layerDiv.classList.add('ol-unselectable');
                    layerDiv.title = this.textContent;
                    this.scrollTo(0, 0);
                }
            });
			
			//Layer visibility checkbox button
            var visibleBox = document.createElement('input');
            visibleBox.type = 'checkbox';
            visibleBox.className = 'visible';
            visibleBox.checked = layer.getVisible();
            visibleBox.addEventListener('change', function () 
			{
                if(this.checked) 
				{
                    layer.setVisible(true);
                } 
				else 
				{
                    layer.setVisible(false);
                }
            });
            layerDiv.appendChild(this.stopPropagationOnEvent(visibleBox, 'click'));
			
			//Layer visibility slider
            var layerControls = document.createElement('div');
            this.addSelectEvent(layerControls, true);
            var opacityHandler = document.createElement('input');
            opacityHandler.type = 'range';
            opacityHandler.min = 0;
            opacityHandler.max = 1;
            opacityHandler.step = 0.1;
            opacityHandler.value = layer.getOpacity();
            opacityHandler.addEventListener('input', function () 
			{
                layer.setOpacity(this.value);
            });
            opacityHandler.addEventListener('change', function () 
			{
                layer.setOpacity(this.value);
            });
            opacityHandler.addEventListener('mousedown', function () 
			{
                layerDiv.draggable = false;
            });
            opacityHandler.addEventListener('mouseup', function () 
			{
                layerDiv.draggable = true;
            });
            layerControls.appendChild(this.stopPropagationOnEvent(opacityHandler, 'click'));
            layerDiv.appendChild(layerControls);
            this.layerContainer.insertBefore(layerDiv, this.layerContainer.firstChild);
            return this;
        };
        this.map.getLayers().on('add', function (evt) 
		{
            if (evt.element instanceof ol.layer.Vector) 
			{
                this.createRegistry(evt.element, true);
            } 
			else 
			{
                this.createRegistry(evt.element);
            }
        }, this);
        this.map.getLayers().on('remove', function (evt) 
		{
            this.removeRegistry(evt.element);
        }, this);
    } 
	else 
	{
        throw new Error('Invalid parameter(s) provided.');
    }
};


//~~~Extend constructor functions~~~//
//Create buttons function
layerTree.prototype.createButton = function (elemName, elemTitle, elemType) 
{
    var buttonElem = document.createElement('button');
    buttonElem.className = elemName;
    buttonElem.title = elemTitle;
    switch (elemType) 
	{
        case 'addlayer':
            buttonElem.addEventListener('click', function () 
			{
                document.getElementById(elemName).style.display = 'block';
            });
			buttonElem.innerHTML = "New";
            return buttonElem;
        case 'deletelayer':
            var _this = this;
            buttonElem.addEventListener('click', function () 
			{
                if (_this.selectedLayer) 
				{
                    var layer = _this.getLayerById(_this.selectedLayer.id);
                    _this.map.removeLayer(layer);
                    _this.messages.textContent = 'Layer removed successfully.';
                } 
				else 
				{
                    _this.messages.textContent = 'No selected layer to remove.';
                }
            });
			buttonElem.innerHTML = "Delete";
            return buttonElem;
        default:
            return false;
    }
};


layerTree.prototype.addBufferIcon = function (layer) {
    layer.getSource().on('change', function (evt) {
        var layerElem = document.getElementById(layer.get('id'));
        switch (evt.target.getState()) {
            case 'ready':
                layerElem.className = layerElem.className.replace(/(?:^|\s)(error|buffering)(?!\S)/g, '');
                break;
            case 'error':
                layerElem.className += ' error'
                break;
            default:
                layerElem.className += ' buffering';
                break;
        }
    });
};
/*
//Clears out the entire element check WMS
layerTree.prototype.removeContent = function (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    return this;
};
//Creates an option element check WMS
layerTree.prototype.createOption = function (optionValue) {
    var option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    return option;
};*/

//Add custom vector layer
layerTree.prototype.addVectorLayer = function (form) {
    var file = form.file.files[0];
    var currentProj = this.map.getView().getProjection();
    try 
	{
        var fr = new FileReader();
        var sourceFormat;
        var source = new ol.source.Vector();
        fr.onload = function (evt) {
            var vectorData = evt.target.result;
            switch (form.format.value) 
			{
                case 'geojson':
                    sourceFormat = new ol.format.GeoJSON();
                    break;
                case 'topojson':
                    sourceFormat = new ol.format.TopoJSON();
                    break;
                case 'kml':
                    sourceFormat = new ol.format.KML();
                    break;
                case 'osm':
                    sourceFormat = new ol.format.OSMXML();
                    break;
                default:
                    return false;
            }
            var dataProjection = form.projection.value || sourceFormat.readProjection(vectorData) || currentProj;
            source.addFeatures(sourceFormat.readFeatures(vectorData, {
                dataProjection: dataProjection,
                featureProjection: currentProj
            }));
        };
        fr.readAsText(file);
        var layer = new ol.layer.Vector({
            source: source,
            name: form.displayname.value
        });
        this.addBufferIcon(layer);
        this.map.addLayer(layer);
        this.messages.textContent = 'New layer added successfully.';
        return this;
    } 
	catch (error) 
	{
        this.messages.textContent = 'Some unexpected error occurred: (' + error.message + ').';
        return error;
    }
};

//Add WMS layer
layerTree.prototype.addWmsLayer = function (form) {
	function makelayer(mapname) 
	{
		return new ol.layer.Tile({
			source: new ol.source.TileWMS({
				url: 'http://localhost:8080/geoserver/wms',
				params: {
					layers: 'MapWizard:'+mapname,
				},
				crossOrigin: 'anonymous',
				projection : 'EPSG:2100',
				serverType: 'geoserver',                    
			}),
			name: mapname
		});
	}
	
	var newlayer;
	switch(form.dataType.value)
	{
		case 'Points':
			if (form.hierarchyData.value == 'Nominal') 
			{
				newlayer = makelayer('Point Nominal Color Hue');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Point Nominal Shape');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Point Nominal Orientation');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Point Nominal Iconographic');
				this.map.addLayer(newlayer);
			} 
			else 
			{
				newlayer = makelayer('Point Interval Color Value');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Point Interval Size');
				this.map.addLayer(newlayer);
			}
			break;
		case 'Lines':
			if (form.hierarchyData.value == 'Nominal') 
			{
				newlayer = makelayer('Line Nominal Color Hue');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Line Nominal Shape');
				this.map.addLayer(newlayer);
			} 
			else 
			{
				newlayer = makelayer('Line Interval Color Value');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Line Interval Size');
				this.map.addLayer(newlayer);
			}
			break;
		case 'Area':
			if (form.hierarchyData.value == 'Nominal') 
			{
				newlayer = makelayer('Area Nominal Color Hue');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Area Nominal Shape');
				this.map.addLayer(newlayer);
				newlayer = makelayer('Area Nominal Orientation');
				this.map.addLayer(newlayer);
			} 
			else 
			{
				if (form.processedData.value == 'Primary') 
				{
					newlayer = makelayer('Area Interval Size');
					this.map.addLayer(newlayer);
				} 
				else 
				{
					newlayer = makelayer('Area Interval Color Value');
					this.map.addLayer(newlayer);
				}
			}
			break;
	}
    
    this.messages.textContent = 'WMS layer added successfully.';
    return this;
};

//Selecting an item
layerTree.prototype.addSelectEvent = function (node, isChild) 
{
    var _this = this;
    node.addEventListener('click', function (evt) 
	{
        var targetNode = evt.target;
        if (isChild) 
		{
            evt.stopPropagation();
            targetNode = targetNode.parentNode;
        }
        if (_this.selectedLayer) 
		{
            _this.selectedLayer.classList.remove('active');
        }
        _this.selectedLayer = targetNode;
        targetNode.classList.add('active');
    });
    return node;
};

//Delete layer
layerTree.prototype.removeRegistry = function (layer) {
    var layerDiv = document.getElementById(layer.get('id'));
    this.layerContainer.removeChild(layerDiv);
    return this;
};

//Get layer id
layerTree.prototype.getLayerById = function (id) {
    var layers = this.map.getLayers().getArray();
    for (var i = 0; i < layers.length; i += 1) {
        if (layers[i].get('id') === id) {
            return layers[i];
        }
    }
    return false;
};

//Do make layer invisible
layerTree.prototype.stopPropagationOnEvent = function (node, event) 
{
    node.addEventListener(event, function (evt) 
	{
        evt.stopPropagation();
    });
    return node;
};

//Creates the print control
ol.control.Print = function (opt_options) 
{
    var options = opt_options || {};
    var _this = this;
    var controlDiv = document.createElement('div');
    controlDiv.className = options.class || 'ol-print ol-unselectable ol-control';
    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || 'Print';
    controlButton.title = options.tipLabel || 'Print map';
    var dataURL;
    controlButton.addEventListener('click', function (evt) 
	{
        _this.getMap().once('postcompose', function (evt) 
		{
            var canvas = evt.context.canvas;
            dataURL = canvas.toDataURL('image/png');
        });
        _this.getMap().renderSync();
        //window.open(dataURL, '_blank');
		var OpenWindow = window.open("printmap.html", "_blank ");
        OpenWindow.printMapData = dataURL; // printMapData is a variable in printmap.html
        dataURL = null;
    });
    controlDiv.appendChild(controlButton);
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
};
ol.inherits(ol.control.Print, ol.control.Control);

//Create the Zoom control
ol.control.Z = function (opt_options) 
{
    var options = opt_options || {};
    var _this = this;
    var controlDiv = document.createElement('div');
    controlDiv.className = options.class || 'ol-unselectable ol-control';
    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || 'Zoom';
    controlButton.title = options.tipLabel || 'Zoom';
    
    controlButton.addEventListener('click', function (evt) 
	{
		if(zoom == 0) 
		{
			zoom = new ol.control.Zoom();
			zoomslider = new ol.control.ZoomSlider();
			map.addControl(zoom);
			map.addControl(zoomslider);
		} 
		else 
		{
			map.removeControl(zoom);
			map.removeControl(zoomslider);
			zoom = 0;
			zoomslider = 0;
		}
    });
    controlDiv.appendChild(controlButton);
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
};
ol.inherits(ol.control.Z, ol.control.Control);

//Create the Scale control
ol.control.S = function (opt_options) 
{
    var options = opt_options || {};
    var _this = this;
    var controlDiv = document.createElement('div');
    controlDiv.className = options.class || 'ol-unselectable ol-control';
    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || 'Scale';
    controlButton.title = options.tipLabel || 'Scale Line';
    
    controlButton.addEventListener('click', function (evt) 
	{
		if(scaleline == 0) 
		{
			scaleline = new ol.control.ScaleLine();
			map.addControl(scaleline);
		} 
		else 
		{
			map.removeControl(scaleline);
			scaleline = 0;
		}
    });
    controlDiv.appendChild(controlButton);
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
};
ol.inherits(ol.control.S, ol.control.Control);

