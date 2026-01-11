var form = document.createElement("form");
var menu = document.createElement("select");
form.appendChild(menu);
menu.addEventListener('change', function(e) {
	var opt = this.options[this.selectedIndex];
	var base = location.href.substring(0, location.href.indexOf("/api/")) + "/api/";
	location.href = base + opt.value;
});
var opts = [
	{text:"Overview", value:"index.html"},
	{text:"Classes"},
	{text:"Folder", value:"classes/folder.html"},
	{text:"Set", value:"classes/set.html"},
	{text:"Song", value:"classes/song.html"},
	{text:"State", value:"classes/state.html"},
	{text:"Styles", value:"classes/styles.html"},
	{text:"Video", value:"classes/video.html"},
	{text:"Services"},
	{text:"Authentication", value:"auth.html"},
	{text:"Books", value:"books.html"},
	{text:"Conversion", value:"convert.html"},
	{text:"Folders", value:"folders.html"},
	{text:"Hooks", value:"hooks.html"},
	{text:"Instruments", value:"instruments.html"},
	{text:"Media", value:"media.html"},
	{text:"Ping", value:"ping.html"},
	{text:"Sets", value:"sets.html"},
	{text:"Settings", value:"settings.html"},
	{text:"Songs", value:"songs.html"},
	{text:"State", value:"state.html"},
	{text:"Video Settings", value:"video.html"}
];
var group = null;
for(var i=0;i<opts.length;i++) {

	if(opts[i].value) {
		var opt = document.createElement("option");
		opt.value = opts[i].value;
		opt.text = opts[i].text;
		opt.selected = (location.href.indexOf("/api/" + opt.value) > 0);
		if(group) {
			group.appendChild(opt); 
		} else {
			menu.add(opt);
		}
	} else {
		group = document.createElement("optgroup");
		group.label = opts[i].text;
		menu.appendChild(group);
	}
}
var h = document.getElementsByTagName("header")[0];
h.insertBefore(form, h.firstChild);