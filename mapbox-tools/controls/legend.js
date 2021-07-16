import Control from '../components/control.js';
import Core from '../../basic-tools/tools/core.js';
import Dom from '../../basic-tools/tools/dom.js';

let n = 0;

export default class Legend extends Control { 
		
	constructor(options) {	
		super(options);
		
		this._container = this.Node('root');

		this.chkBoxes = null;
		this.chkBoxesState = null;
		
		this.radioBoxes = null;
		this.radioBoxesState = null;
		this.ReloadHandler(options, true);
		//this.Reload(options.legend, options.title, options.banner, options.subtitle);
	}
	
	ReloadHandler(options, upper = false, choice = 0){		
		if (options.type == "single"){
			if (upper){this.Reload(options.Legend, options.Title, options.Banner, options.Subtitle);}
			else {this.Reload(options.legend, options.title, options.banner, options.subtitle);}
		} else if (options.type == "multiple"){				
			var ind = options.indicators[choice];
			var title = ind.title;
			if (options.useIndicatorTitles == null){ title = options.title; }
			
			if (upper){
				if ( typeof title !== 'string'){title = title[Core.locale];}
				this.Reload(options.multiLegend(ind.legend), title, ind.banner, ind.subtitle, options.indicators, choice);
			}
			else {this.Reload(ind.legend, title, ind.banner, ind.subtitle, options.indicators, choice);}
		}			
	}
	
	Reload(legend, title, banner, subtitle, indicators = null, choice = 0) {	
		this.LoadLegend(legend, indicators, choice);
						
		if (banner) this.Node('banner').innerHTML = banner;
		if (title) this.Node('title').innerHTML = title;
		if (subtitle) this.Node('subtitle').innerHTML = subtitle;
		
		Dom.ToggleCss(this.Node("banner"), "hidden", !banner);
		Dom.ToggleCss(this.Node("title"), "hidden", !title);
		Dom.ToggleCss(this.Node("subtitle"), "hidden", !subtitle);
	}
	
	LoadLegend(config, indicators = null, choice = 0) {
		this.chkBoxes = []
		this.chkBoxesState = [];

		Dom.Empty(this.Node("legend"));
		this.Node('ititle').innerHTML = "";
		Dom.Empty(this.Node("indicators"));
		if (!config) return;
		
		config.forEach(i => this.AddLegendItem(i));
		if (indicators !== null){
			
			this.Node('ititle').innerHTML = "Indicators";
			this.radioBoxes = [];
			this.radioBoxesState = [];
			indicators.forEach(i => this.AddIndicatorItem(i))
			for (var i = 0, length = this.radioBoxesState.length; i < length; i++) {
				var r = this.radioBoxesState[i].radiobox;
				if (i == choice){r.checked = true; }
			}
		}
	}

	AddLegendItem(item) {
		if (!item.label) return;
		if (item.value){ //If it has a checkbox action to be performed
			var id = "legend-check-" + ++n;
			var div = Dom.Create("div", { className:"legend-item legend-item-1" }, this.Node("legend"));
			var chkBox = Dom.Create("input", { id:id, title: item.title, className: "legend-tickbox", type:"checkbox", checked:true }, div);
			var svg = Dom.CreateSVG("svg", { width:15, height:15 }, div);
			var icn = Dom.CreateSVG("rect", { width:15, height:15 }, svg);
			var lbl = Dom.Create("label", { innerHTML:item.label }, div);

			lbl.setAttribute("for", id);

			this.chkBoxes.push(chkBox)
			
			chkBox.addEventListener("change", this.OnCheckbox_Checked.bind(this));
			
			icn.setAttribute('fill', `rgb(${item.color.join(",")})`);
					
			this.chkBoxesState.push({ item:item, checkbox:chkBox });

		return div;
		} else {
			var id = "legend-check-" + ++n;
			var div = Dom.Create("div", { className:"legend-item legend-item-1" }, this.Node("legend"));
			var svg = Dom.CreateSVG("svg", { width:15, height:15 }, div);
			var icn = Dom.CreateSVG("rect", { width:15, height:15 }, svg);
			var lbl = Dom.Create("label", { innerHTML:item.label }, div);
			lbl.setAttribute("for", id);			
			icn.setAttribute('fill', `rgb(${item.color.join(",")})`);					

		return div;			
		}
	}
	
	AddIndicatorItem(item){
		var id = "legend-check-" + ++n;
		var title = Core.Nls("Indicator_Select") + item.title[Core.locale];
		var div = Dom.Create("div", { className:"legend-item legend-item-1" }, this.Node("indicators"));
		var rBox = Dom.Create("input", { id:id, title: title, className: "legend-tickbox", type:"radio", checked:false, name: "indicators"}, div);
		
		var lbl = Dom.Create("label", { innerHTML:item.title[Core.locale] }, div);
		this.radioBoxes.push(rBox)
		this.radioBoxesState.push({ item:item, radiobox:rBox });
		//lbl.setAttribute("for", id);		
		
		rBox.addEventListener("change", this.OnRadio_Checked.bind(this));

	}

	OnCheckbox_Checked(ev) {
		this.Emit("LegendChange", { state:this.chkBoxesState });
	}

	OnRadio_Checked(ev) {
		this.Emit("IndicatorChange", { state:this.radioBoxesState });
	}


	Template() {        
		return "<div handle='root' class='legend mapboxgl-ctrl'>" +
				  "<div handle='banner' class='control-label legend-banner'></div>" +
				  "<div>" +
					  "<div handle='title' class='control-label'></div>" +
					  "<div handle='subtitle' class='control-label legend-subtitle'></div>" +
				  "</div>" +
				  "<div handle='legend' class='legend-container'></div>" +
				  "<div>" +
					  "<div handle='ititle' class='control-label'></div>" +
					  "<div handle='isubtitle' class='control-label legend-subtitle'></div>" +
				  "</div>" +	
				  "<div handle='indicators' class='legend-container'></div>" +				  
			   "</div>";
	}
}