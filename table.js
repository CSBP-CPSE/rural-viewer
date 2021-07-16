import Templated from '/basic-tools/components/templated.js';
import Core from '/basic-tools/tools/core.js';
import Dom from '/basic-tools/tools/dom.js';
import Net from "/basic-tools/tools/net.js";
import Util from "/basic-tools/tools/util.js";
import Other from "/mapbox-tools/tools/other.js";
import Workaround from "./workaround.js";

export default Core.Templatable("Basic.Components.Table", class Table extends Templated {

	set caption(value) { this.Node('caption').innerHTML = value; }

	constructor(container, options) {	
		super(container, options);
		
		this.path = options.path;
		this.summary = options.summary;
		this.fields = options.fields;
		this.title = options.title;
		
		this.current = {
			item : null,
			page : 1,
			max : null,
			holding : null
		}

		// this.Node("description").innerHTML = options.description;

		this.Node('prev').addEventListener('click', this.OnButtonPrev_Handler.bind(this));
		this.Node('next').addEventListener('click', this.OnButtonNext_Handler.bind(this));
		this.Node('save').addEventListener('click', this.OnButtonSave_Handler.bind(this));
		
		this.fields.forEach(f => this.AddHeader(f));
	}

	Template() {
		return "<div class='table-widget'>" +
				  "<h2 handle='title'>nls(Table_Title_Default)</h2>" +
				  
			      "<a id='lode-table' handle='message' class='table-message'>nls(Table_Message)</a>"+
				  
			      "<div handle='table' class='table-container hidden'>" + 
					 "<summary handle='description'></summary>" +
				     "<table>" +
				        "<thead>" + 
				           "<tr handle='header'></tr>" + 
				        "</thead>" +
				        "<tbody handle='body'></tbody>" + 
				     "</table>" + 
				     "<div class='navigation'>" + 						
					    `<button handle='prev' title='nls(Table_Previous_Button)' disabled><img src='${Core.root}assets/arrow-left.png'></button>`+
					    "<span handle='current' class='current'></span>"+ 
					    `<button handle='next' title='nls(Table_Next_Button)' disabled><img src='${Core.root}assets/arrow-right.png'></button>`+
						`  <button handle='save' title='nls(Table_Download_Button)'><img src='${Core.root}assets/download.png'></button>` +
				     "</div>" + 
			      "</div>" + 
			   "</div>"
	}

	AddHeader(f) {
		Dom.Create("th", { innerHTML:f.label, className:f.type }, this.Node("header"));
	}

	GetDataFileUrl(file) {
		var url = window.location.href.split("/");
		
		url.splice(url.length - 1, 1);
		url.push(file);
		
		return url.join("/");
	}

	//Update the table content with the correct data of the DBU
	Populate(item, data) {		
		Dom.Empty(this.Node('body'));

		data.shift();

		data.forEach(rData => {
			if (rData.length == 0) return;
			
			var row = Dom.Create("tr", { className:"table-row" }, this.Node('body'));
			
			rData.forEach((cData, i) => {
				// WORKAROUND to fix fields (there's another one in application.js)
				var value = Workaround.FixField(this.fields[i].id, cData);
				
				var css = `table-cell ${this.fields[i].type}`;
				
				Dom.Create("td", { innerHTML:value, className:css }, row);
			});
		});
	}
	
	/**
	* Update the table with the correct DBUID data 
	*
	* Parameters :
	* item : the item that was used in the search bar
	* Return : none
	*/
	UpdateTable(item, page) {	
		// Set current DB
			
		var addComparison = false;
		var radios = document.getElementsByName('tableCompare');
		for (var i = 0, length = radios.length; i < length; i++) {
			if (radios[i].value == "1" ) { 
				if (radios[i].disabled) {radios[i].disabled = false;}
				if (radios[i].checked) { addComparison = true; break;}
			}
		}
		
		if (addComparison == false) {
			this.current.page = page || 1;
			this.current.item = item;
			this.current.max = this.summary[item.id] || 0;
			
			this.Node("title").innerHTML =  Util.Format(this.title, [item.label]);
			
			if (this.current.max == 0) {
				this.Node("message").innerHTML = Core.Nls("Table_No_Data");
				
				Dom.AddCss(this.Node("table"), "hidden");
				Dom.RemoveCss(this.Node("message"), "hidden");
				
				return;
			};
			
			// Get CSV file for selected DB. Extension is json because of weird server configuration. Content is csv.		
			var file = `${Core.root}${this.path}\\${this.current.item.id}_${this.current.page}.json`;
			var url = this.GetDataFileUrl(file);	
		
			Net.Request(url).then(ev => {
				var data = Util.ParseCsv(ev.result);
				this.Populate(item, data);
				
				// Update table UI
				this.Node('current').innerHTML = Core.Nls("Table_Current_Page", [this.current.page, this.current.max]);
				
				this.ToggleButtons();
				
				Dom.ToggleCss(this.Node("message"), "hidden", true);
				Dom.ToggleCss(this.Node("table"), "hidden", false);
			}, this.OnAsyncFailure);
		} else {			
			var itemArray = [];
			var duplicate = false;
			if (Array.isArray(this.current.item)){ itemArray = this.current.item; }
			else {itemArray = [this.current.item];}
			
			for (var i = 0, length = itemArray.length; i < length; i++) {
				var itemTest =  itemArray[i];
				if (itemTest.id == item.id){duplicate = true; break;}
			}
			if (duplicate){return;}
			
			if (Array.isArray(this.current.item)){ this.current.item.push(item); }
			else if (this.current.item == null) {this.current.item = [item]}
			else { this.current.item = [this.current.item, item]			}
			
			this.current.page = page || 1;			
			this.current.max = this.summary[item.id] || 0;
			
			this.Node("title").innerHTML =  Util.Format(this.title, [this.current.item[0].label]) + Core.Nls("Table_Title_Multiple_Suffix");
			
			if (this.current.max == 0) {
				this.Node("message").innerHTML = Core.Nls("Table_No_Data");
				
				Dom.AddCss(this.Node("table"), "hidden");
				Dom.RemoveCss(this.Node("message"), "hidden");
				
				return;
			}
			var promises = [];
			this.current.holding = null;
			for (var i = 0; i < this.current.item.length; i++) {
				var it = this.current.item[i];				
				// Get CSV file for selected DB. Extension is json because of weird server configuration. Content is csv.		
				var file = `${Core.root}${this.path}\\${it.id}_${this.current.page}.json`;				
				var url = this.GetDataFileUrl(file);		
	
				var p = Net.Request(url).then(ev => { 
					this.current.holding = ev.result;
					return ev.result;
				}, this.OnAsyncFailure);
				
				promises.push(p);			
			}
			Promise.all(promises).then((values) => {
				var res = Util.JoinData(values);
				var data = Util.ParseCsv(res);
				
				this.Populate(item, data);
				
				// Update table UI
				this.Node('current').innerHTML = Core.Nls("Table_Current_Page", [this.current.page, this.current.max]);
				
				this.ToggleButtons();
				
				Dom.ToggleCss(this.Node("message"), "hidden", true);
				Dom.ToggleCss(this.Node("table"), "hidden", false);						
				
			});
		} 		
	}
	
	SaveTable() {	 // Save table to csv format;
		var itemArray = []
		if (Array.isArray(this.current.item)){ itemArray = this.current.item; }
		else { itemArray = [this.current.item]; }
		
		var promises = [];
		for (var i = 0; i < itemArray.length; i++) {
			var it = itemArray[i];				
			// Get CSV file for selected DB. Extension is json because of weird server configuration. Content is csv.		
			var file = `${Core.root}${this.path}\\${it.id}_${this.current.page}.json`;				
			var url = this.GetDataFileUrl(file);	
		
			var p = Net.Request(url).then(ev => { 
				return ev.result;
			}, this.OnAsyncFailure);
			
			promises.push(p);			
		}
		Promise.all(promises).then((values) => {
			var res = Util.JoinData(values); //Combine all the csv files into a single table
			var lines = res.split('\n');					
			var ids = lines[0].split(',');
			var newids = [];
			for (var i = 0; i < ids.length; i++) {
				newids.push(this.fields[i].label);				
			}
			
			var fline = newids.join(','); 
			lines.shift();
			lines.unshift(fline);
			
			res  = lines.join('\n');
			
			var hiddenElement = document.createElement('a');  
			//hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(res);  
			hiddenElement.href = "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(res);   
			hiddenElement.target = '_blank';  			
      
			//provide the name for the CSV file to be downloaded  
			hiddenElement.download = Core.Nls("Download_File_Name") +'.csv';  
			hiddenElement.click();  
			
		});
		 		
	}	

	ToggleButtons() {
		this.Node('prev').disabled = (this.current.page <= 1);
		this.Node('next').disabled = (this.current.page >= this.current.max);
	}

	OnButtonPrev_Handler(ev) {
		this.current.page--;
		
		this.UpdateTable(this.current.item, this.current.page);
	}

	OnButtonNext_Handler(ev) {
		this.current.page++;		
		this.UpdateTable(this.current.item, this.current.page);
	}
	
	OnButtonSave_Handler(ev) {
		this.SaveTable();
	}	
	
	OnAsyncFailure(ev) {
		console.log(ev.error.toString());
	}
})