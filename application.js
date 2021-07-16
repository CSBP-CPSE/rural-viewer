import Other from "/mapbox-tools/tools/other.js";
import Factory from "/mapbox-tools/tools/factory.js";
import Templated from "/basic-tools/components/templated.js";
import Core from "/basic-tools/tools/core.js";
import Net from "/basic-tools/tools/net.js";
import Util from "/basic-tools/tools/util.js";
import Dom from "/basic-tools/tools/dom.js";
import Table from "./table.js";
import Store from "./store.js";
import Workaround from "./workaround.js";

export default class ProxApp extends Templated { 
	
	constructor(node, config) {
		super(node);
		
		this.config = config;
		this.current = this.config.maps[Store.Map];

		if (!this.current) this.current = Util.FirstProperty(this.config.maps);
		
		this.AddMap();	
		this.AddSearch();	
		
		this.AddBaseControls();		
		this.AddGroup(); //Legend, etc.
		this.AddMenu();
		
		this.ReloadTable();				
		this.ReloadMap();
	}
	
	Template() {
		return  "<div handle='presentation' class='instructions'>nls(Map_Presentation_1)</div>" + 
				"<div handle='presentation' class='instructions'>nls(Map_Presentation_2)</div>" + 
				"<div class='search-container'>" +
				  "<span class='wb-inv'>nls(Inv_Search_Instructions)</span>" + 
				  "<label class='search-label'>nls(App_Search_Label)" +
				     "<div handle='search' class='search'></div>" +
			      "</label>" +
				  "<div class='inv-container'>" +
					"<a href='#lode-table' class='wb-inv wb-show-onfocus wb-sl'>nls(Inv_Skip_Link)</a>" + 
				  "</div>" +
			   "</div>" +
			   "<div handle='instructions' class='instructions'>nls(Map_Description)</div>" + 
               "<div class='map-container'>" +
                  "<div handle='map' class='map'></div>" +
               "</div>" +
			   "<div class='table-container'>" +
				  "<div handle='table' class='table'></div>" +
			   "</div>"+
			   "<h2 handle='variableTitle'>nls(VariableTitle_Default)</h2>" +
			   "<div class='table-container'>" +				
				  "<div handle='variables' class='table'></div>" +
			   "</div>";
	}

	AddMap() {
		//var token = "pk.eyJ1IjoiZGVpbC1sZWlkIiwiYSI6ImNrMzZxODNvNTAxZjgzYm56emk1c3doajEifQ.H5CJ3maS0ZuxX_7QTgz1kg"; //DEIL token CHANGE
		var token = "pk.eyJ1IjoiYWJrYW11bnJvIiwiYSI6ImNram5keWdzbTU3engyeXA5cjd2azIxZGYifQ.HDVwM7Oycp_5IQ_CtOZ8mw";  //My token
		
		this.map = Factory.Map(this.Node("map"), token, this.current.Style, [Store.Lng, Store.Lat], Store.Zoom);

		// Hooking up all events 
		this.map.On("StyleChanged", this.OnMapStyleChanged_Handler.bind(this));
		this.map.On("MoveEnd", this.OnMapMoveEnd_Handler.bind(this));
		this.map.On("ZoomEnd", this.OnMapZoomEnd_Handler.bind(this));
		this.map.On("Click", this.OnMapClick_Handler.bind(this));	
		this.map.SetClickableMap()		
		
		this.Node("variables").innerHTML = this.current.variables[Core.locale];
	}

	AddBaseControls() {
		var fullscreen = Factory.FullscreenControl(Core.Nls("FullScreen_Title"));
		var navigation = Factory.NavigationControl(false, true, Core.Nls("Navigation_ZoomIn_Title"), Core.Nls("Navigation_ZoomOut_Title"));
		var scale = Factory.ScaleControl("metric");
		
		this.map.AddControl(fullscreen, "top-left");
		this.map.AddControl(navigation, "top-left");
		this.map.AddControl(scale);
	}

	AddSearch() {
		this.config.search.items = this.config.search.items.map(i => {
			return { 
				id : i[0], 
				name : i[1],
				label : `${i[1]} (${i[0]})`, 
				extent : [[i[2], i[3]], [i[4], i[5]]] 
			}
		});
		
		// Add top-left search bar
		var search = Factory.SearchControl(this.config.search.items, Core.Nls("Search_Placeholder"), Core.Nls("Search_Title"));
		
		search.Place(this.Node("search"));
		
		search.On("Change", this.OnSearchChange_Handler.bind(this));
		
		search.Node("typeahead").Node("input").id = "lode-search";
	}
	
	AddGroup() {
		// Top-right group for legend, etc.		
		this.group = { //CHANGE
			//legend : Factory.LegendControl(this.current.Legend, this.current.FullTitle, this.current.Subtitle)
			legend : Factory.LegendControl(this.current)
		}
						
		this.map.AddControl(Factory.Group(this.group));
		
		// Assumption: All dataset will have a legend with toggles because it's all point data
		this.group.legend.On("LegendChange", this.OnLegend_Changed.bind(this));
		this.group.legend.On("IndicatorChange", this.OnIndicator_Changed.bind(this));
	}

	OnLegend_Changed(ev) {
		var opacities = ev.state.map(i => Number(i.checkbox.checked));

		// Assumption: Data will always be point data
        this.map.Choropleth([this.current.LayerIDs[0]], 'circle-color', this.current.Legend, opacities);
        this.map.ChoroplethVarOpac([this.current.LayerIDs[0]], 'circle-stroke-color', this.current.Legend, opacities);

        this.map.ChoroplethVarOpac( [this.current.LayerIDs[1]] , 'text-color', this.current.Legend, opacities);
    }
	
	// NEW FUNCTION - added handling for radio control of indicator levels within a single style
	OnIndicator_Changed(ev) {
		var radios = ev.state;
		var choice = 0;
		for (var i = 0, length = radios.length; i < length; i++) {
			var r = radios[i];
			if(r.radiobox.checked){ this.map.ShowLayer(r.item.id); choice = i; }
			else {this.map.HideLayer(r.item.id); }
		}
		this.group.legend.ReloadHandler(this.current, true, choice);
	}
	
	ReloadMap(){
		if (this.current.type == "multiple"){
			var ind = this.current.indicators;
			for (var i = 0, length = ind.length; i < length; i++) {
				var item = ind[i];
				if(i == 0){ this.map.ShowLayer(item.id);}
				else {this.map.HideLayer(item.id); }
			}			
		}
	}
	
	AddMenu() {
		// Top-left menu below navigation
		var maps = Factory.MapsListControl(this.config.maps);
		var bookmarks = Factory.BookmarksControl(this.config.bookmarks);
		
		this.menu = Factory.MenuControl();
		
		this.map.AddControl(this.menu, "top-left");
		
		this.menu.AddButton("home", Core.root + "assets/globe.png", Core.Nls("Home_Title"), this.OnHomeClick_Handler.bind(this));
		this.menu.AddPopupButton("maps", Core.root + "assets/layers.png", Core.Nls("Maps_Title"), maps, this.map.Container);
		this.menu.AddPopupButton("bookmarks", Core.root + "assets/bookmarks.png", Core.Nls("Bookmarks_Title"), bookmarks, this.map.Container);
						
		maps.On("MapSelected", this.OnMapSelected_Handler.bind(this));
		bookmarks.On("BookmarkSelected", this.OnBookmarkSelected_Handler.bind(this));
	}
	
	ReloadTable() {
		Dom.Empty(this.Node("table"));
		
		var radios = document.getElementsByName('tableCompare');
		for (var i = 0, length = radios.length; i < length; i++) { 	if (radios[i].value == "0" ) { radios[i].checked = true;} if (radios[i].value == "1" ) { radios[i].disabled = true;} 	}
		
		Net.JSON(`${Core.root}${this.current.TableUrl}`).then(ev => { 
			this.current.UpdateTable(ev.result);
		
			this.table = new Table(this.Node("table"), this.current.Table);
			
			this.table.Node("message").setAttribute("href", "#lode-search");
		});		
	}
	
	OnHomeClick_Handler(ev) {
		this.map.FitBounds([[-173.457, 41.846], [-17.324, 75.848]]);
	}
	
	OnBookmarkSelected_Handler(ev) {
		this.menu.Button("bookmarks").popup.Hide();
		
		this.map.FitBounds(ev.item.extent, { animate:false });
	}
		
	OnMapSelected_Handler(ev) {
		this.menu.Button("maps").popup.Hide();
		
		Store.Map = ev.id;

		this.current = ev.map;	
		
		// this.Node('instructions').innerHTML = Core.Nls("Map_Description", [this.current.Title]);
		
		this.map.SetStyle(this.current.Style);
		this.ReloadMap();
		this.ReloadTable();		

		this.group.legend.ReloadHandler(this.current, true);
		
		this.Node("variables").innerHTML = this.current.variables[Core.locale];
		//this.group.legend.Reload(this.current.Legend, this.current.FullTitle, this.current.Subtitle);
	}

	OnMapStyleChanged_Handler(ev) {
		this.map.SetClickableMap();
		
		// Assumption: Data will always be point data 
		//this.map.Choropleth([this.current.LayerIDs[0]], 'circle-color', this.current.Legend, 1); //CHANGE
	}
	
	OnMapMoveEnd_Handler(ev) {		
		Store.Lat = this.map.Center.lat;
		Store.Lng = this.map.Center.lng;
	}
	
	OnMapZoomEnd_Handler(ev) { 		
		Store.Zoom = this.map.Zoom;
	}
	
	OnMapClick_Handler(ev) {		
		var features = this.map.QueryRenderedFeatures(ev.point, this.current.ClickableLayersIDs);
						
		if (features.length == 0) return;
		
		var f = features[0];
		
		// WORKAROUND to fix fields (there's another one in table.js)
		for (var fld in f.properties) {
			f.properties[fld] = Workaround.FixField(fld, f.properties[fld]);
		}

		// TODO : Handle lookups, string formats
		var html = Other.HTMLize(f.properties, this.current.Fields, Core.Nls("Map_Not_Available"));
		
		this.map.InfoPopup(ev.lngLat, html);
	}
	
	// Assumption : Search will always be by CSD
	OnSearchChange_Handler(ev) {
		var legend = [{
			color : this.config.search.color,
			value : ["==", ["get", this.config.search.field], ev.item.id]
		}, {
			color : [255, 255, 255, 0]
		}];

		this.table.UpdateTable(ev.item);
		
		this.map.Choropleth([this.config.search.layer], 'line-color', legend);
		
		this.map.FitBounds(ev.item.extent, { padding:30, animate:false });
	}
}